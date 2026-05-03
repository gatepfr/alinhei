import { MercadoPagoConfig, Preference } from 'mercadopago'
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { DEFAULT_PRODUCTS, type ProductSku, type Products } from './products'

export { DEFAULT_PRODUCTS, type ProductSku, type Products }
export const PRODUCTS = DEFAULT_PRODUCTS // Legacy support

export async function getDynamicProducts(): Promise<Products> {
  try {
    const supabase = createServiceClient()
    const { data } = await supabase.from('settings').select('value').eq('id', 'prices').maybeSingle()
    if (data?.value) return data.value as Products
  } catch (err) {
    console.error('[getDynamicProducts] Error fetching prices, using defaults:', err)
  }
  return DEFAULT_PRODUCTS
}

export function getMpClient() {
  const token = (process.env.MERCADOPAGO_ACCESS_TOKEN ?? '').trim()
  if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado')
  return new MercadoPagoConfig({ accessToken: token })
}

export async function createPreference(opts: {
  sku: ProductSku
  userId: string
  userEmail: string
  notificationUrl: string
  successUrl: string
  failureUrl: string
  discountedPrice?: number
  couponCode?: string
}) {
  const products = await getDynamicProducts()
  const product = products[opts.sku]
  const preference = new Preference(getMpClient())
  const unitPrice = opts.discountedPrice ?? product.price

  const result = await preference.create({
    body: {
      items: [{ id: opts.sku, title: `Alinhei — ${product.label}`, currency_id: 'BRL', unit_price: unitPrice, quantity: 1 }],
      payer: { email: opts.userEmail },
      payment_methods: { 
        excluded_payment_methods: [], 
        excluded_payment_types: []
      },
      notification_url: opts.notificationUrl,
      back_urls: { success: opts.successUrl, failure: opts.failureUrl, pending: opts.successUrl },
      auto_return: 'approved',
      metadata: { user_id: opts.userId, sku: opts.sku, ...(opts.couponCode ? { coupon_code: opts.couponCode } : {}) },
    },
  })

  return result
}

export function validateWebhookSignature(
  rawBody: string,
  xSignature: string,
  xRequestId: string,
  dataIdFromQuery: string,
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) {
    console.error('[MP Webhook] Secret não configurado (MERCADOPAGO_WEBHOOK_SECRET)')
    return false
  }

  // 1. Extrair ID do body se não vier na query
  let dataId = dataIdFromQuery
  if (!dataId) {
    try {
      const payload = JSON.parse(rawBody)
      dataId = String(payload.data?.id || payload.id || '')
    } catch (e) {
      // Ignora erro de parse, tentaremos com a string vazia
    }
  }

  // Se o ID for string, deve ser lowercase para o manifesto v2
  if (dataId) dataId = dataId.toLowerCase()

  const parts = xSignature.split(',').reduce<Record<string, string>>((acc, part) => {
    const [k, v] = part.split('=')
    if (k && v) acc[k.trim()] = v.trim()
    return acc
  }, {})

  const ts = parts['ts']
  const v1 = parts['v1']
  if (!ts || !v1) {
    console.error('[MP Webhook] Assinatura incompleta no header:', { xSignature })
    return false
  }

  // O manifesto v2 exige id, request-id e ts, com ponto e vírgula final
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  const hmac = crypto.createHmac('sha256', secret)
  const expected = hmac.update(manifest).digest('hex')
  
  const isValid = expected === v1
  if (!isValid) {
    console.error('[MP Webhook] Assinatura INVÁLIDA!', {
      expected,
      received: v1,
      manifest,
      dataId,
      xRequestId,
      ts
    })
  } else {
    console.log('[MP Webhook] Assinatura validada com sucesso:', { dataId, xRequestId })
  }

  return isValid
}
