import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import { callWithJson } from '@/lib/anthropic'
import { DIAGNOSTICO_SYSTEM, DIAGNOSTICO_USER } from '@/lib/prompts'
import { DiagnosticoSchema } from '@/lib/schemas'
import { sanitizeCurriculo, sanitizeVaga } from '@/lib/input-sanitizer'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const RequestSchema = z.object({
  curriculo: z.string().min(50, 'Currículo muito curto'),
  vaga: z.string().min(20, 'Descrição de vaga muito curta'),
})

function sha256(text: string) {
  return crypto.createHash('sha256').update(text).digest('hex')
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: { code: 'INVALID_JSON', message: 'Requisição inválida.' } }, { status: 400 })
  }

  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } },
      { status: 400 }
    )
  }

  const { text: curriculo, truncated: curriculoTruncated } = sanitizeCurriculo(parsed.data.curriculo)
  const { text: vaga, truncated: vagaTruncated } = sanitizeVaga(parsed.data.vaga)

  const curriculoHash = sha256(curriculo)
  const vagaHash = sha256(vaga)

  const supabase = createServiceClient()

  // Cache: se o mesmo par já foi analisado nas últimas 24h, reutilizar
  const { data: cached } = await supabase
    .from('analyses')
    .select('id')
    .eq('curriculo_hash', curriculoHash)
    .eq('vaga_hash', vagaHash)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (cached) {
    return NextResponse.json({ ok: true, analysisId: cached.id })
  }

  // Chamar LLM
  let diagnostic: z.infer<typeof DiagnosticoSchema>
  let inputTokens: number
  let outputTokens: number

  try {
    const result = await callWithJson(DiagnosticoSchema, {
      system: DIAGNOSTICO_SYSTEM,
      user: DIAGNOSTICO_USER(curriculo, vaga),
      temperature: 0.3,
      maxTokens: 2500,
    })
    diagnostic = result.data
    inputTokens = result.inputTokens
    outputTokens = result.outputTokens
  } catch (err) {
    console.error('[analyze] LLM error:', err)
    return NextResponse.json(
      { ok: false, error: { code: 'LLM_ERROR', message: 'Erro ao processar com IA. Tente novamente.' } },
      { status: 500 }
    )
  }

  // Custo aproximado Haiku: $0.80/MTok input, $4/MTok output → em BRL ~5.5x
  const costBrlCents = Math.round((inputTokens * 0.0008 + outputTokens * 0.004) / 1000 * 5.5 * 100)

  const sessionId = req.cookies.get('session_id')?.value ?? null
  const { data: { user } } = await createClient().auth.getUser()

  const { data: analysis, error: dbError } = await supabase
    .from('analyses')
    .insert({
      user_id: user?.id ?? null,
      session_id: sessionId,
      curriculo_text: curriculo,
      curriculo_hash: curriculoHash,
      vaga_text: vaga,
      vaga_hash: vagaHash,
      diagnostic,
      tokens_input: inputTokens,
      tokens_output: outputTokens,
      cost_brl_cents: costBrlCents,
    })
    .select('id')
    .single()

  if (dbError || !analysis) {
    console.error('[analyze] DB error:', dbError)
    return NextResponse.json(
      { ok: false, error: { code: 'DB_ERROR', message: 'Erro ao salvar análise.' } },
      { status: 500 }
    )
  }

  console.log('[analyze] tokens:', { inputTokens, outputTokens, costBrlCents, curriculoTruncated, vagaTruncated })

  return NextResponse.json({ ok: true, analysisId: analysis.id })
}
