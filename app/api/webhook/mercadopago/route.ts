// app/api/webhook/mercadopago/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { validateWebhookSignature, PRODUCTS, type ProductSku } from '@/lib/mercadopago'
import { createServiceClient } from '@/lib/supabase/server'
import { grantCredits } from '@/lib/credits'

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const xSignature = request.headers.get('x-signature') ?? ''
  const xRequestId = request.headers.get('x-request-id') ?? ''

  if (!validateWebhookSignature(rawBody, xSignature, xRequestId)) {
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
    payment = await new Payment(mpClient).get({ id: paymentId })
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
    console.error('Payment insert error:', paymentError)
    return NextResponse.json({ error: 'failed to save payment' }, { status: 500 })
  }

  await grantCredits(userId, product.credits, `purchase:${sku}`, paymentRecord.id, expiresAt)

  return NextResponse.json({ ok: true })
}
