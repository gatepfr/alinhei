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

    console.log('[MP Webhook] Início do processamento:', { 
      dataId: dataIdFromQuery, 
      requestId: xRequestId 
    })

    // 1. Validar Assinatura (Bloqueante para segurança em produção)
    if (!validateWebhookSignature(rawBody, xSignature, xRequestId, dataIdFromQuery)) {
      console.warn('[MP Webhook] Assinatura INVÁLIDA. Rejeitando requisição.')
      return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
    } else {
      console.log('[MP Webhook] Assinatura validada com sucesso!')
    }

    // 2. Parse do Payload
    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'invalid json' }, { status: 400 })
    }

    // 3. Verificar se é um evento de pagamento
    if (payload.type !== 'payment' || !payload.data?.id) {
      console.log('[MP Webhook] Ignorando evento tipo:', payload.type)
      return NextResponse.json({ ok: true })
    }

    const paymentId = String(payload.data.id)
    console.log('[MP Webhook] Buscando detalhes do pagamento:', paymentId)

    // 4. Buscar detalhes no Mercado Pago
    const mpClient = getMpClient()
    let payment: any
    try {
      payment = await new Payment(mpClient).get({ id: paymentId })
    } catch (err) {
      console.error('[MP Webhook] Erro ao buscar pagamento no MP:', err)
      return NextResponse.json({ error: 'failed to fetch payment' }, { status: 500 })
    }

    console.log('[MP Webhook] Status atual:', payment.status)

    // 5. Só processa se estiver aprovado
    if (payment.status !== 'approved') {
      return NextResponse.json({ ok: true })
    }

    // 6. Extrair metadados (garantir que existem)
    const userId = payment.metadata?.user_id
    const sku = payment.metadata?.sku as ProductSku

    if (!userId || !sku || !PRODUCTS[sku]) {
      console.error('[MP Webhook] Metadados cruciais ausentes:', payment.metadata)
      return NextResponse.json({ error: 'missing metadata' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // 7. Checar Idempotência (se já processamos esse pagamento)
    const { data: existing, error: existingError } = await supabase
      .from('payments')
      .select('id')
      .eq('mp_payment_id', paymentId)
      .maybeSingle()

    if (existingError) throw existingError
    if (existing) {
      console.log('[MP Webhook] Pagamento já processado anteriormente:', paymentId)
      return NextResponse.json({ ok: true })
    }

    // 8. Preparar dados do produto
    const product = PRODUCTS[sku]
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + product.expirationDays)

    console.log('[MP Webhook] Registrando pagamento e concedendo', product.credits, 'créditos ao usuário', userId)

    // 9. Registrar pagamento e conceder créditos (Fluxo principal)
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
      console.error('[MP Webhook] Erro ao salvar pagamento:', paymentError)
      return NextResponse.json({ error: 'failed to save payment' }, { status: 500 })
    }

    // Conceder os créditos de fato
    await grantCredits(userId, product.credits, `purchase:${sku}`, paymentRecord.id, expiresAt)

    // 10. Tarefas Secundárias (não travam o processo principal)
    try {
      // Atualizar cupom
      const couponCode = (payment.metadata as any)?.coupon_code
      if (couponCode) {
        const { data: coupon } = await supabase.from('coupons').select('id, uses_count').ilike('code', couponCode).maybeSingle()
        if (coupon) {
          await supabase.from('coupons').update({ uses_count: coupon.uses_count + 1 }).eq('id', coupon.id)
        }
      }

      // Referral (Indicação)
      const { count: prevPayments } = await supabase.from('payments').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'approved').neq('id', paymentRecord.id)
      if ((prevPayments ?? 0) === 0) {
        const { data: referral } = await supabase.from('referrals').select('id, referrer_id').eq('referred_id', userId).eq('credit_granted', false).maybeSingle()
        if (referral) {
          const rExp = new Date(); rExp.setDate(rExp.getDate() + 30)
          await grantCredits(referral.referrer_id, 1, 'referral', referral.id, rExp)
          await supabase.from('referrals').update({ credit_granted: true }).eq('id', referral.id)
        }
      }
    } catch (secErr) {
      console.error('[MP Webhook] Erro em tarefas secundárias:', secErr)
    }

    console.log('[MP Webhook] Processamento concluído com sucesso para o pagamento:', paymentId)
    return NextResponse.json({ ok: true })

  } catch (err: any) {
    console.error('[MP Webhook] ERRO FATAL NO WORKER:', err)
    return NextResponse.json(
      { error: 'internal server error', message: err?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
