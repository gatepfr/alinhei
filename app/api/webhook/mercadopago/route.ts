// app/api/webhook/mercadopago/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Payment } from 'mercadopago'
import { validateWebhookSignature, PRODUCTS, getMpClient, type ProductSku } from '@/lib/mercadopago'
import { createServiceClient } from '@/lib/supabase/server'
import { grantCredits } from '@/lib/credits'

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const xSignature = request.headers.get('x-signature') ?? ''
    const xRequestId = request.headers.get('x-request-id') ?? ''
    const dataIdFromQuery = request.nextUrl.searchParams.get('data.id') ?? ''

    console.log('[MP Webhook] Início:', { 
      dataIdFromQuery, 
      xRequestId, 
      signaturePresent: !!xSignature,
      body: rawBody.substring(0, 100) + '...'
    })

    if (!validateWebhookSignature(rawBody, xSignature, xRequestId, dataIdFromQuery)) {
      console.warn('[MP Webhook] Assinatura inválida')
      return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
    }

    let payload: { type?: string; data?: { id?: string | number } }
    try {
      payload = JSON.parse(rawBody)
    } catch {
      console.error('[MP Webhook] JSON inválido:', rawBody)
      return NextResponse.json({ error: 'invalid json' }, { status: 400 })
    }

    if (payload.type !== 'payment' || !payload.data?.id) {
      console.log('[MP Webhook] Ignorando tipo não-pagamento:', payload.type)
      return NextResponse.json({ ok: true })
    }

    const paymentId = String(payload.data.id)
    console.log('[MP Webhook] Buscando pagamento no MP:', paymentId)

    const mpClient = getMpClient()
    let payment: any
    try {
      payment = await new Payment(mpClient).get({ id: paymentId })
    } catch (err) {
      console.error('[MP Webhook] Erro ao buscar pagamento no MP:', err)
      return NextResponse.json({ error: 'failed to fetch payment' }, { status: 500 })
    }

    console.log('[MP Webhook] Status MP:', payment.status)

    if (payment.status !== 'approved') {
      return NextResponse.json({ ok: true })
    }

    const userId = payment.metadata?.user_id as string | undefined
    const sku = payment.metadata?.sku as ProductSku | undefined

    if (!userId || !sku || !PRODUCTS[sku]) {
      console.error('[MP Webhook] Metadados ausentes:', payment.metadata)
      return NextResponse.json({ error: 'missing metadata' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Idempotência
    const { data: existing, error: existingError } = await supabase
      .from('payments')
      .select('id')
      .eq('mp_payment_id', paymentId)
      .maybeSingle()

    if (existingError) {
      console.error('[MP Webhook] Erro ao verificar idempotência:', existingError)
      throw existingError
    }

    if (existing) {
      console.log('[MP Webhook] Pagamento já processado:', paymentId)
      return NextResponse.json({ ok: true })
    }

    const product = PRODUCTS[sku]
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + product.expirationDays)

    console.log('[MP Webhook] Gravando pagamento e concedendo créditos:', { userId, sku, credits: product.credits })

    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        mp_payment_id: paymentId,
        mp_preference_id: (payment as any).preference_id ?? null,
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
      if (paymentError?.code === '23505') return NextResponse.json({ ok: true })
      console.error('[MP Webhook] Erro ao inserir pagamento:', paymentError)
      return NextResponse.json({ error: 'failed to save payment' }, { status: 500 })
    }

    await grantCredits(userId, product.credits, `purchase:${sku}`, paymentRecord.id, expiresAt)

    // Opcionais (Cupons, Referrals)
    try {
      const couponCode = (payment.metadata as any)?.coupon_code
      if (couponCode) {
        const { data: coupon } = await supabase.from('coupons').select('id, uses_count').ilike('code', couponCode).maybeSingle()
        if (coupon) await supabase.from('coupons').update({ uses_count: coupon.uses_count + 1 }).eq('id', coupon.id)
      }

      const { count: prevPayments } = await supabase.from('payments').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'approved').neq('id', paymentRecord.id)
      if ((prevPayments ?? 0) === 0) {
        const { data: referral } = await supabase.from('referrals').select('id, referrer_id').eq('referred_id', userId).eq('credit_granted', false).maybeSingle()
        if (referral) {
          const rExp = new Date(); rExp.setDate(rExp.getDate() + 30)
          await grantCredits(referral.referrer_id, 1, 'referral', referral.id, rExp)
          await supabase.from('referrals').update({ credit_granted: true }).eq('id', referral.id)
        }
      }
    } catch (optErr) {
      console.error('[MP Webhook] Erro em tarefas opcionais:', optErr)
      // Não falha a requisição se o crédito principal já foi dado
    }

    console.log('[MP Webhook] Sucesso total:', paymentId)
    return NextResponse.json({ ok: true })

  } catch (err: any) {
    console.error('[MP Webhook] CRASH FATAL:', err)
    return NextResponse.json(
      { error: 'internal server error', message: err?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
