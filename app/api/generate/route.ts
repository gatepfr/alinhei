import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { debitCredit } from '@/lib/credits'
import { anthropic, callWithJson, MODEL } from '@/lib/anthropic'
import { CURRICULO_SYSTEM, CURRICULO_USER, CARTA_SYSTEM, CARTA_USER, PERGUNTAS_SYSTEM, PERGUNTAS_USER } from '@/lib/prompts'
import { CartaSchema, PerguntasSchema } from '@/lib/schemas'

const RequestSchema = z.object({
  analysis_id: z.string().uuid(),
})

const resend = new Resend(process.env.RESEND_API_KEY)

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

  const { analysis_id } = parsed.data
  const serviceClient = createServiceClient()

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
    .select('id')
    .eq('analysis_id', analysis_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
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
    anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      temperature: 0.5,
      system: CURRICULO_SYSTEM,
      messages: [{ role: 'user', content: CURRICULO_USER(curriculoText, vagaText, diagnosticoJson) }],
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
      maxTokens: 2000,
    }),
  ])

  const curriculo_otimizado =
    curriculoResult.status === 'fulfilled' && curriculoResult.value.content[0]?.type === 'text'
      ? curriculoResult.value.content[0].text
      : null

  const carta = cartaResult.status === 'fulfilled' ? cartaResult.value.data : null
  const perguntas = perguntasResult.status === 'fulfilled' ? perguntasResult.value.data : null

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

  // E-mail transacional best-effort
  if (user.email && process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: user.email,
      subject: 'Seu pacote completo está pronto — VagaCerta',
      html: `<p>Olá! Seu pacote completo foi gerado com sucesso.</p>
<p><a href="${appUrl}/analise/${analysis_id}/completo">Acessar resultado completo →</a></p>
<p><a href="${appUrl}/api/pdf/${generation.id}">Baixar PDF →</a></p>
<p style="color:#888;font-size:12px">— VagaCerta</p>`,
    }).catch((err: unknown) => console.error('[generate] email error:', err))
  }

  console.log('[generate] tokens:', { totalInput, totalOutput, costBrlCents })

  return NextResponse.json({ ok: true, generationId: generation.id })
}
