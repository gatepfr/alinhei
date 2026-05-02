// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createPreference } from '@/lib/mercadopago'

const BodySchema = z.object({
  sku: z.enum(['single', 'pack3', 'pack10']),
  analysisId: z.string().uuid(),
  couponCode: z.string().trim().toUpperCase().optional(),
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

  const { sku, analysisId, couponCode } = parsed.data
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin).trim()

  // Valida cupom e calcula desconto
  let discountedPrice: number | undefined
  let validatedCouponCode: string | undefined

  if (couponCode) {
    const serviceClient = createServiceClient()
    const { data: coupon } = await serviceClient
      .from('coupons')
      .select('discount_type, discount_value, max_uses, uses_count, valid_until, is_active')
      .eq('is_active', true)
      .ilike('code', couponCode)
      .maybeSingle()

    if (
      coupon &&
      (!coupon.valid_until || new Date(coupon.valid_until) > new Date()) &&
      (coupon.max_uses === null || coupon.uses_count < coupon.max_uses)
    ) {
      const { PRODUCTS } = await import('@/lib/mercadopago')
      const basePrice = PRODUCTS[sku].price
      if (coupon.discount_type === 'percent') {
        discountedPrice = +(basePrice * (1 - Number(coupon.discount_value) / 100)).toFixed(2)
      } else {
        discountedPrice = Math.max(0.01, +(basePrice - Number(coupon.discount_value)).toFixed(2))
      }
      validatedCouponCode = couponCode
    }
  }

  try {
    const result = await createPreference({
      sku,
      userId: user.id,
      userEmail: user.email!,
      notificationUrl: `${appUrl}/api/webhook/mercadopago`,
      successUrl: analysisId 
        ? `${appUrl}/analise/${analysisId}?checkout=success`
        : `${appUrl}/dashboard?checkout=success`,
      failureUrl: analysisId
        ? `${appUrl}/analise/${analysisId}?checkout=failure`
        : `${appUrl}/dashboard?checkout=failure`,
      discountedPrice,
      couponCode: validatedCouponCode,
    })

    return NextResponse.json({ ok: true, initPoint: result.init_point })
  } catch (err) {
    const detail = err instanceof Error
      ? err.message
      : typeof err === 'object'
        ? JSON.stringify(err)
        : String(err)
    console.error('MP checkout error:', JSON.stringify(err, null, 2))
    return NextResponse.json(
      { ok: false, error: { code: 'MP_ERROR', message: `Erro ao criar preferência: ${detail}` } },
      { status: 500 }
    )
  }
}
