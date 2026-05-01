// app/api/webhook/mercadopago/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Payment } from 'mercadopago'
import { validateWebhookSignature, PRODUCTS, getMpClient, type ProductSku } from '@/lib/mercadopago'
import { createServiceClient } from '@/lib/supabase/server'
import { grantCredits } from '@/lib/credits'

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const xSignature = request.headers.get('x-signature') ?? ''
  const xRequestId = request.headers.get('x-request-id') ?? ''
  const dataId = request.nextUrl.searchParams.get('data.id') ?? ''

  if (!validateWebhookSignature(rawBody, xSignature, xRequestId, dataId)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  let payload: { type?: string; data?: { id?: string | number } }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  if (payload.type !== 'payment' || !payload.data?.id) {
    return NextResponse.json({ ok: true })
  }

  const paymentId = String(payload.data.id)

  let payment: Awaited<ReturnType<InstanceType<typeof Payment>['get']>>
  try {
    payment = await new Payment(getMpClient()).get({ id: paymentId })
  } catch {
    return NextResponse.json({ error: 'failed to fetch payment' }, { status: 500 })
  }

  if (payment.status !== 'approved') {
    return NextResponse.json({ ok: true })
  }

  const userId = payment.metadata?.user_id as string | undefined
  const sku = payment.metadata?.sku as ProductSku | undefined

  if (!userId || !sku || !PRODUCTS[sku]) {
    return NextResponse.json({ error: 'missing metadata' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Idempotência
  const { data: existing } = await supabase
    .from('payments')
    .select('id')
    .eq('mp_payment_id', paymentId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ ok: true })
  }

  const product = PRODUCTS[sku]
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + product.expirationDays)

  const { data: paymentRecord, error: paymentError } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      mp_payment_id: paymentId,
      mp_preference_id: (payment as unknown as { preference_id?: string }).preference_id ?? null,
      status: 'approved',
      product_sku: sku,
      amount_brl_cents: Math.round(product.price * 100),
      credits_granted: product.credits,
      payer_email: payment.payer?.email ?? null,
      payment_method: payment.payment_type_id ?? null,
      raw_webhook: payload,
      approved_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (paymentError || !paymentRecord) {
    // unique_violation: outro webhook já processou este pagamento (race condition)
    if (paymentError?.code === '23505') {
      return NextResponse.json({ ok: true })
    }
    console.error('Payment insert error:', paymentError)
    return NextResponse.json({ error: 'failed to save payment' }, { status: 500 })
  }

  try {
    await grantCredits(userId, product.credits, `purchase:${sku}`, paymentRecord.id, expiresAt)
  } catch (err) {
    console.error('grantCredits error:', err)
    return NextResponse.json({ error: 'failed to grant credits' }, { status: 500 })
  }

  // Incrementa uses_count do cupom se houver (seguro: payment já é idempotente)
  const couponCode = (payment.metadata as Record<string, unknown> | undefined)?.coupon_code as string | undefined
  if (couponCode) {
    const { data: coupon } = await supabase
      .from('coupons')
      .select('id, uses_count')
      .ilike('code', couponCode)
      .maybeSingle()
    if (coupon) {
      await supabase
        .from('coupons')
        .update({ uses_count: coupon.uses_count + 1 })
        .eq('id', coupon.id)
    }
  }

  // Concede crédito ao referrer se for primeira compra do usuário indicado
  const { count: prevPayments } = await supabase
    .from('payments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'approved')
    .neq('id', paymentRecord.id)

  if ((prevPayments ?? 0) === 0) {
    const { data: referral } = await supabase
      .from('referrals')
      .select('id, referrer_id')
      .eq('referred_id', userId)
      .eq('credit_granted', false)
      .maybeSingle()

    if (referral) {
      const referralExpiresAt = new Date()
      referralExpiresAt.setDate(referralExpiresAt.getDate() + 30)
      await grantCredits(referral.referrer_id, 1, 'referral', referral.id, referralExpiresAt)
      await supabase
        .from('referrals')
        .update({ credit_granted: true })
        .eq('id', referral.id)
    }
  }

  return NextResponse.json({ ok: true })
}
