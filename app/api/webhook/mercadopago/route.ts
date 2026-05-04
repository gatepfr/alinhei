// app/api/webhook/mercadopago/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Payment } from 'mercadopago'
import { validateWebhookSignature, PRODUCTS, getMpClient, type ProductSku } from '@/lib/mercadopago'
import { createServiceClient } from '@/lib/supabase/server'
import { grantCredits } from '@/lib/credits'

interface MPWebhookPayload {
  type: string
  data?: { id: string }
}

interface MPPayment {
  status: string
  metadata?: {
    user_id?: string
    sku?: string
    coupon_code?: string
  }
  preference_id?: string
  payer?: { email?: string }
  payment_type_id?: string
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || 'unknown'
  
  try {
    const rawBody = await request.text()
    const xSignature = request.headers.get('x-signature') ?? ''
    const dataIdFromQuery = request.nextUrl.searchParams.get('data.id') ?? ''

    console.log(`[MP Webhook][${requestId}] Início:`, { dataId: dataIdFromQuery })

    // 1. Validar Assinatura
    const isSignatureValid = validateWebhookSignature(rawBody, xSignature, requestId, dataIdFromQuery)
    if (!isSignatureValid) {
      console.warn(`[MP Webhook][${requestId}] Assinatura INVÁLIDA ou falha na validação.`)
      return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
    }

    // 2. Parse do Payload
    let payload: MPWebhookPayload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      console.error(`[MP Webhook][${requestId}] Falha no parse do JSON:`, rawBody.substring(0, 100))
      return NextResponse.json({ error: 'invalid json' }, { status: 400 })
    }

    // 3. Verificar tipo
    if (payload.type !== 'payment' || !payload.data?.id) {
      console.log(`[MP Webhook][${requestId}] Ignorando evento tipo: ${payload.type}`)
      return NextResponse.json({ ok: true })
    }

    const paymentId = String(payload.data.id)
    console.log(`[MP Webhook][${requestId}] Buscando pagamento:`, paymentId)

    // 4. Buscar detalhes no Mercado Pago
    const mpClient = getMpClient()
    let payment: MPPayment | null = null
    try {
      const paymentResponse = await new Payment(mpClient).get({ id: paymentId })
      // O SDK v2 pode retornar o objeto diretamente ou dentro de um body
      payment = ((paymentResponse as unknown as { body: MPPayment }).body || paymentResponse) as MPPayment
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[MP Webhook][${requestId}] Erro ao buscar pagamento no MP:`, msg)
      return NextResponse.json({ error: 'failed to fetch payment' }, { status: 500 })
    }

    if (!payment || payment.status !== 'approved') {
      console.log(`[MP Webhook][${requestId}] Status não aprovado: ${payment?.status || 'null'}`)
      return NextResponse.json({ ok: true })
    }

    // 6. Extrair metadados
    const metadata = payment.metadata || {}
    const userId = metadata.user_id
    const sku = metadata.sku as ProductSku

    if (!userId || !sku || !PRODUCTS[sku]) {
      console.error(`[MP Webhook][${requestId}] Metadados incompletos:`, metadata)
      return NextResponse.json({ error: 'missing metadata' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // 7. Checar Idempotência
    const { data: existing, error: existingError } = await supabase
      .from('payments')
      .select('id')
      .eq('mp_payment_id', paymentId)
      .maybeSingle()

    if (existingError) {
      console.error(`[MP Webhook][${requestId}] Erro ao checar idempotência:`, existingError.message)
      throw existingError
    }

    if (existing) {
      console.log(`[MP Webhook][${requestId}] Já processado:`, paymentId)
      return NextResponse.json({ ok: true })
    }

    // 8. Preparar dados
    const product = PRODUCTS[sku]
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + product.expirationDays)

    console.log(`[MP Webhook][${requestId}] Registrando pagamento para ${userId} (${sku})`)

    // 9. Registrar e conceder créditos
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        mp_payment_id: paymentId,
        mp_preference_id: payment.preference_id || null,
        status: 'approved',
        product_sku: sku,
        amount_brl_cents: Math.round(product.price * 100),
        credits_granted: product.credits,
        payer_email: payment.payer?.email || null,
        payment_method: payment.payment_type_id || null,
        raw_webhook: payload,
        approved_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (paymentError || !paymentRecord) {
      // 23505 = unique_violation
      if (paymentError?.code === '23505') return NextResponse.json({ ok: true })
      console.error(`[MP Webhook][${requestId}] Erro ao salvar registro:`, paymentError?.message || 'null record')
      return NextResponse.json({ error: 'failed to save payment' }, { status: 500 })
    }

    // Créditos
    await grantCredits(userId, product.credits, `purchase:${sku}`, paymentRecord.id, expiresAt)

    // 10. Tarefas Secundárias
    try {
      // Cupom
      const couponCode = metadata.coupon_code
      if (couponCode) {
        const { data: coupon } = await supabase.from('coupons').select('id, uses_count').ilike('code', couponCode).maybeSingle()
        if (coupon) {
          await supabase.from('coupons').update({ uses_count: coupon.uses_count + 1 }).eq('id', coupon.id)
        }
      }

      // Referral
      const { count: prevPayments } = await supabase
        .from('payments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'approved')
        .neq('id', paymentRecord.id)

      if ((prevPayments || 0) === 0) {
        const { data: referral } = await supabase
          .from('referrals')
          .select('id, referrer_id')
          .eq('referred_id', userId)
          .eq('credit_granted', false)
          .maybeSingle()

        if (referral) {
          const rExp = new Date(); rExp.setDate(rExp.getDate() + 30)
          await grantCredits(referral.referrer_id, 1, 'referral', referral.id, rExp)
          await supabase.from('referrals').update({ credit_granted: true }).eq('id', referral.id)
        }
      }
    } catch (secErr) {
      console.error(`[MP Webhook][${requestId}] Erro tarefas secundárias:`, secErr)
    }

    console.log(`[MP Webhook][${requestId}] Sucesso!`)
    return NextResponse.json({ ok: true })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[MP Webhook][${requestId}] ERRO FATAL:`, msg)
    return NextResponse.json(
      { error: 'internal server error', message: msg },
      { status: 500 }
    )
  }
}

