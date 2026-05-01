// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createPreference } from '@/lib/mercadopago'

const BodySchema = z.object({
  sku: z.enum(['single', 'pack3', 'pack10']),
  analysisId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Login necessário' } },
      { status: 401 }
    )
  }

  const body = await request.json()
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.message } },
      { status: 400 }
    )
  }

  const { sku, analysisId } = parsed.data
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin

  try {
    const result = await createPreference({
      sku,
      userId: user.id,
      userEmail: user.email!,
      notificationUrl: `${appUrl}/api/webhook/mercadopago`,
      successUrl: `${appUrl}/analise/${analysisId}?checkout=success`,
      failureUrl: `${appUrl}/analise/${analysisId}?checkout=failure`,
    })

    return NextResponse.json({ ok: true, initPoint: result.init_point })
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error('MP checkout error:', detail)
    return NextResponse.json(
      { ok: false, error: { code: 'MP_ERROR', message: `Erro ao criar preferência: ${detail}` } },
      { status: 500 }
    )
  }
}
