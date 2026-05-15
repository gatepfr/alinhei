import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { debitCredit } from '@/lib/credits'
import { getAnthropic, callWithJson, MODEL } from '@/lib/anthropic'
import { CURRICULO_SYSTEM, CURRICULO_USER, CARTA_SYSTEM, CARTA_USER, PERGUNTAS_SYSTEM, PERGUNTAS_USER, type ContactInfo } from '@/lib/prompts'
import { CartaSchema, PerguntasSchema } from '@/lib/schemas'

const ContactInfoSchema = z.object({
  name: z.string().max(200).optional(),
  email: z.string().max(300).optional(),
  phone: z.string().max(50).optional(),
  linkedin_url: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
})

const RequestSchema = z.object({
  analysis_id: z.string().uuid(),
  contact_info: ContactInfoSchema.optional(),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: 'Necessário estar logado.' } },
      { status: 401 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: 'INVALID_JSON', message: 'Requisição inválida.' } },
      { status: 400 }
    )
  }

  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } },
      { status: 400 }
    )
  }

  const { analysis_id, contact_info } = parsed.data
  const serviceClient = createServiceClient()

  // Persist contact info to user metadata (best-effort, non-blocking)
  if (contact_info) {
    const meta: Record<string, string> = {}
    if (contact_info.name) meta.full_name = contact_info.name
    if (contact_info.phone) meta.phone = contact_info.phone
    if (contact_info.linkedin_url) meta.linkedin_url = contact_info.linkedin_url
    if (contact_info.city) meta.city = contact_info.city
    if (Object.keys(meta).length > 0) {
      serviceClient.auth.admin.updateUserById(user.id, {
        user_metadata: { ...(user.user_metadata ?? {}), ...meta },
      }).catch((err: unknown) => console.error('[generate] profile save error:', err))
    }
  }

  const { data: analysis } = await serviceClient
    .from('analyses')
    .select('id, curriculo_text, vaga_text, diagnostic')
    .eq('id', analysis_id)
    .maybeSingle()

  if (!analysis) {
    return NextResponse.json(
      { ok: false, error: { code: 'NOT_FOUND', message: 'Análise não encontrada.' } },
      { status: 404 }
    )
  }

  // Idempotência: já existe geração para esse par analysis+user
  const { data: existing } = await serviceClient
    .from('generations')
    .select('id, curriculo_otimizado, carta, perguntas')
    .eq('analysis_id', analysis_id)
    .eq('user_id', user.id)
    .maybeSingle()

  // Tudo já gerado: retorno imediato sem cobrar crédito novamente
  if (existing && existing.curriculo_otimizado && existing.carta && existing.perguntas) {
    return NextResponse.json({ ok: true, generationId: existing.id })
  }

  // Geração parcial: regenerar apenas os campos ausentes sem debitar crédito
  if (existing) {
    const curriculoText = analysis.curriculo_text as string
    const vagaText = analysis.vaga_text as string
    const diagnosticoJson = JSON.stringify(analysis.diagnostic)

    const [curriculoResult, cartaResult, perguntasResult] = await Promise.allSettled([
      existing.curriculo_otimizado
        ? Promise.resolve(null)
        : getAnthropic().messages.create({
            model: MODEL, max_tokens: 2000, temperature: 0.5,
            system: CURRICULO_SYSTEM,
            messages: [{ role: 'user', content: CURRICULO_USER(curriculoText, vagaText, diagnosticoJson, contact_info as ContactInfo | undefined) }],
          }),
      existing.carta
        ? Promise.resolve(null)
        : callWithJson(CartaSchema, { system: CARTA_SYSTEM, user: CARTA_USER(curriculoText, vagaText, 'a empresa'), temperature: 0.7, maxTokens: 1000 }),
      existing.perguntas
        ? Promise.resolve(null)
        : callWithJson(PerguntasSchema, { system: PERGUNTAS_SYSTEM, user: PERGUNTAS_USER(curriculoText, vagaText), temperature: 0.5, maxTokens: 3000 }),
    ])

    const updates: Record<string, unknown> = {}
    if (!existing.curriculo_otimizado && curriculoResult.status === 'fulfilled' && curriculoResult.value) {
      const msg = curriculoResult.value as unknown as { content: Array<{ type: string; text?: string }> }
      if (msg.content[0]?.type === 'text') updates.curriculo_otimizado = msg.content[0].text
    }
    if (!existing.carta && cartaResult.status === 'fulfilled' && cartaResult.value) {
      updates.carta = (cartaResult.value as unknown as { data: unknown }).data
    }
    if (!existing.perguntas && perguntasResult.status === 'fulfilled' && perguntasResult.value) {
      updates.perguntas = (perguntasResult.value as unknown as { data: unknown }).data
    }

    if (Object.keys(updates).length > 0) {
      await serviceClient.from('generations').update(updates).eq('id', existing.id)
    }

    return NextResponse.json({ ok: true, generationId: existing.id })
  }

  // Criar linha vazia para ter o UUID antes do débito
  const { data: generation, error: genError } = await serviceClient
    .from('generations')
    .insert({ analysis_id, user_id: user.id })
    .select('id')
    .single()

  if (genError || !generation) {
    console.error('[generate] insert error:', genError)
    return NextResponse.json(
      { ok: false, error: { code: 'DB_ERROR', message: 'Erro ao iniciar geração.' } },
      { status: 500 }
    )
  }

  // Debitar 1 crédito
  const debitId = await debitCredit(user.id, generation.id)
  if (!debitId) {
    await serviceClient.from('generations').delete().eq('id', generation.id)
    return NextResponse.json(
      { ok: false, error: { code: 'INSUFFICIENT_CREDITS', message: 'Sem créditos disponíveis.' } },
      { status: 402 }
    )
  }

  const curriculoText = analysis.curriculo_text as string
  const vagaText = analysis.vaga_text as string
  const diagnosticoJson = JSON.stringify(analysis.diagnostic)

  // 3 prompts em paralelo
  const [curriculoResult, cartaResult, perguntasResult] = await Promise.allSettled([
    getAnthropic().messages.create({
      model: MODEL,
      max_tokens: 2000,
      temperature: 0.5,
      system: CURRICULO_SYSTEM,
      messages: [{ role: 'user', content: CURRICULO_USER(curriculoText, vagaText, diagnosticoJson, contact_info as ContactInfo | undefined) }],
    }),
    callWithJson(CartaSchema, {
      system: CARTA_SYSTEM,
      user: CARTA_USER(curriculoText, vagaText, 'a empresa'),
      temperature: 0.7,
      maxTokens: 1000,
    }),
    callWithJson(PerguntasSchema, {
      system: PERGUNTAS_SYSTEM,
      user: PERGUNTAS_USER(curriculoText, vagaText),
      temperature: 0.5,
      maxTokens: 3000,
    }),
    ])

  const curriculo_otimizado =
    curriculoResult.status === 'fulfilled' && curriculoResult.value.content[0]?.type === 'text'
      ? curriculoResult.value.content[0].text
      : null

  const carta = cartaResult.status === 'fulfilled' ? cartaResult.value.data : null
  const perguntas = perguntasResult.status === 'fulfilled' ? perguntasResult.value.data : null

  // If all three LLM calls failed the user's credit was debited but nothing was produced.
  // Roll back by deleting the generation row so the next attempt can debit and retry cleanly.
  if (!curriculo_otimizado && !carta && !perguntas) {
    await serviceClient.from('generations').delete().eq('id', generation.id)
    return NextResponse.json(
      { ok: false, error: { code: 'LLM_ERROR', message: 'Erro ao gerar o pacote. Tente novamente.' } },
      { status: 500 }
    )
  }

  let totalInput = 0
  let totalOutput = 0
  if (curriculoResult.status === 'fulfilled') {
    totalInput += curriculoResult.value.usage.input_tokens
    totalOutput += curriculoResult.value.usage.output_tokens
  }
  if (cartaResult.status === 'fulfilled') {
    totalInput += cartaResult.value.inputTokens
    totalOutput += cartaResult.value.outputTokens
  }
  if (perguntasResult.status === 'fulfilled') {
    totalInput += perguntasResult.value.inputTokens
    totalOutput += perguntasResult.value.outputTokens
  }

  const costBrlCents = Math.round((totalInput * 0.0008 + totalOutput * 0.004) / 1000 * 5.5 * 100)

  await serviceClient
    .from('generations')
    .update({ curriculo_otimizado, carta, perguntas, tokens_input: totalInput, tokens_output: totalOutput, cost_brl_cents: costBrlCents })
    .eq('id', generation.id)

  // E-mail transacional best-effort (dynamic import evita inicialização em build time)
  if (user.email && process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    import('resend').then(({ Resend }) => {
      const resend = new Resend(process.env.RESEND_API_KEY)
      return resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: user.email!,
        subject: 'Seu pacote completo está pronto — Alinhei',
        html: `<p>Olá! Seu pacote completo foi gerado com sucesso.</p>
<p><a href="${appUrl}/analise/${analysis_id}/completo">Acessar resultado completo →</a></p>
<p><a href="${appUrl}/api/pdf/${generation.id}/curriculo">Baixar Currículo ATS (PDF) →</a></p>
<p><a href="${appUrl}/api/pdf/${generation.id}/diagnostico">Baixar Diagnóstico (PDF) →</a></p>
<p style="color:#888;font-size:12px">— Alinhei</p>`,
      })
    }).catch((err: unknown) => console.error('[generate] email error:', err))
  }

  console.log('[generate] tokens:', { totalInput, totalOutput, costBrlCents })

  return NextResponse.json({ ok: true, generationId: generation.id })
}
