'use client'

import { useEffect, useState } from 'react'
import { X, Zap, Tag, CheckCircle, AlertCircle } from 'lucide-react'
import { PRODUCTS, type ProductSku } from '@/lib/mercadopago'
import { trackEvent } from '@/lib/analytics'

const SKUS: Array<{ sku: ProductSku; highlight?: boolean }> = [
  { sku: 'single' },
  { sku: 'pack3', highlight: true },
  { sku: 'pack10' },
]

const COPY = {
  A: {
    title: 'Desbloqueie o pacote completo',
    subtitle: 'Currículo reescrito para ATS, 2 cartas e 5 perguntas STAR',
  },
  B: {
    title: 'Candidatos mais preparados já estão à sua frente',
    subtitle: 'Mostre que você se preparou: currículo para ATS + carta personalizada + simulado STAR',
  },
}

function getAbVariant(): 'A' | 'B' {
  if (typeof document === 'undefined') return 'A'
  const match = document.cookie.match(/(?:^|;\s*)ab_paywall=([AB])/)
  return (match?.[1] as 'A' | 'B') ?? 'A'
}

interface Discount {
  type: 'percent' | 'fixed'
  value: number
}

interface PaywallModalProps {
  analysisId: string
  onClose: () => void
}

export function PaywallModal({ analysisId, onClose }: PaywallModalProps) {
  const [loading, setLoading] = useState<ProductSku | null>(null)
  const [showCoupon, setShowCoupon] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: Discount } | null>(null)
  const [variant, setVariant] = useState<'A' | 'B'>('A')

  useEffect(() => {
    const v = getAbVariant()
    setVariant(v)
    trackEvent('paywall_shown', { variant: v })

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function applyDiscount(basePrice: number, discount: Discount): number {
    if (discount.type === 'percent') {
      return +(basePrice * (1 - discount.value / 100)).toFixed(2)
    }
    return Math.max(0.01, +(basePrice - discount.value).toFixed(2))
  }

  async function handleApplyCoupon() {
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    setCouponLoading(true)
    setCouponError(null)
    try {
      const res = await fetch(`/api/coupon/${encodeURIComponent(code)}`)
      const data = await res.json() as { ok: boolean; discount?: Discount; error?: { message: string } }
      if (data.ok && data.discount) {
        setAppliedCoupon({ code, discount: data.discount })
        trackEvent('coupon_applied', { code, type: data.discount.type, value: data.discount.value })
      } else {
        setCouponError(data.error?.message ?? 'Cupom inválido')
      }
    } catch {
      setCouponError('Erro ao validar cupom. Tente novamente.')
    }
    setCouponLoading(false)
  }

  async function handleCheckout(sku: ProductSku) {
    setLoading(sku)
    trackEvent('checkout_started', { sku, variant, coupon: appliedCoupon?.code ?? '' })
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku,
          analysisId,
          ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
        }),
      })
      const data = await res.json() as { ok: boolean; initPoint?: string; error?: { message: string } }
      if (data.ok && data.initPoint) {
        window.location.href = data.initPoint
      } else {
        alert(data.error?.message ?? 'Erro ao iniciar pagamento. Tente novamente.')
        setLoading(null)
      }
    } catch {
      alert('Erro de rede. Tente novamente.')
      setLoading(null)
    }
  }

  const copy = COPY[variant]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <Zap className="w-8 h-8 mx-auto mb-2 text-primary" />
          <h2 className="text-xl font-bold">{copy.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{copy.subtitle}</p>
        </div>

        <div className="space-y-3">
          {SKUS.map(({ sku, highlight }) => {
            const product = PRODUCTS[sku]
            const basePrice = product.price
            const finalPrice = appliedCoupon ? applyDiscount(basePrice, appliedCoupon.discount) : basePrice
            const isLoading = loading === sku
            return (
              <button
                key={sku}
                type="button"
                onClick={() => handleCheckout(sku)}
                disabled={loading !== null}
                className={[
                  'w-full p-4 rounded-xl border-2 text-left transition-all',
                  highlight
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-gray-200 hover:border-gray-300',
                  'disabled:opacity-60',
                ].join(' ')}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm">
                      {product.label}
                      {highlight && (
                        <span className="ml-2 text-xs text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">
                          Mais popular
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Válido por {product.expirationDays} dias
                    </p>
                  </div>
                  <div className="text-right">
                    {appliedCoupon && finalPrice < basePrice && (
                      <p className="text-xs text-muted-foreground line-through">
                        R$ {basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                    <p className={['font-bold text-lg', appliedCoupon ? 'text-green-600' : ''].join(' ')}>
                      R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                {isLoading && (
                  <p className="text-xs text-muted-foreground mt-1 animate-pulse">
                    Redirecionando para pagamento...
                  </p>
                )}
              </button>
            )
          })}
        </div>

        {/* Cupom */}
        <div className="mt-4">
          {!appliedCoupon ? (
            <>
              {!showCoupon ? (
                <button
                  type="button"
                  onClick={() => setShowCoupon(true)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Tag className="w-3 h-3" />
                  Tenho um cupom de desconto
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCoupon() }}
                    placeholder="CÓDIGO"
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/30"
                    disabled={couponLoading}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    className="text-sm px-3 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
                  >
                    {couponLoading ? '...' : 'Aplicar'}
                  </button>
                </div>
              )}
              {couponError && (
                <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  {couponError}
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                Cupom {appliedCoupon.code} aplicado
                {appliedCoupon.discount.type === 'percent'
                  ? ` — ${appliedCoupon.discount.value}% de desconto`
                  : ` — R$ ${appliedCoupon.discount.value.toFixed(2)} de desconto`}
              </span>
              <button
                type="button"
                onClick={() => { setAppliedCoupon(null); setCouponInput('') }}
                className="text-muted-foreground hover:text-foreground"
              >
                Remover
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          PIX ou cartão · Pagamento seguro via Mercado Pago
        </p>
      </div>
    </div>
  )
}
