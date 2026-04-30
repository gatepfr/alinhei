import { MercadoPagoConfig, Preference } from 'mercadopago'
import crypto from 'crypto'

export const PRODUCTS = {
  single: { label: '1 análise completa', price: 9.90, credits: 1, expirationDays: 30 },
  pack3: { label: '3 análises completas', price: 19.90, credits: 3, expirationDays: 30 },
  pack10: { label: '10 análises completas', price: 49.90, credits: 10, expirationDays: 90 },
} as const

export type ProductSku = keyof typeof PRODUCTS

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export async function createPreference(opts: {
  sku: ProductSku
  userId: string
  userEmail: string
  notificationUrl: string
  successUrl: string
  failureUrl: string
}) {
  const product = PRODUCTS[opts.sku]
  const preference = new Preference(client)

  const result = await preference.create({
    body: {
      items: [{ id: opts.sku, title: `VagaCerta — ${product.label}`, unit_price: product.price, quantity: 1 }],
      payer: { email: opts.userEmail },
      payment_methods: { excluded_payment_methods: [], excluded_payment_types: [], installments: 1 },
      notification_url: opts.notificationUrl,
      back_urls: { success: opts.successUrl, failure: opts.failureUrl, pending: opts.successUrl },
      auto_return: 'approved',
      metadata: { user_id: opts.userId, sku: opts.sku },
    },
  })

  return result
}

export function validateWebhookSignature(rawBody: string, xSignature: string, xRequestId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) return false

  const parts = xSignature.split(',').reduce<Record<string, string>>((acc, part) => {
    const [k, v] = part.split('=')
    if (k && v) acc[k.trim()] = v.trim()
    return acc
  }, {})

  const ts = parts['ts']
  const v1 = parts['v1']
  if (!ts || !v1) return false

  const manifest = `id:;request-id:${xRequestId};ts:${ts};`
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1))
}
