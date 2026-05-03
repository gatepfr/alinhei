'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Zap, Tag, CheckCircle, AlertCircle, ArrowRight, Loader2 } from 'lucide-react'
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
  analysisId?: string
  products?: typeof DEFAULT_PRODUCTS
  onClose: () => void
}

export function PaywallModal({ analysisId, products: dynamicProducts, onClose }: PaywallModalProps) {
  const [loading, setLoading] = useState<ProductSku | null>(null)
  const [showCoupon, setShowCoupon] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: Discount } | null>(null)
  const [variant, setVariant] = useState<'A' | 'B'>('A')
  const [paymentOpened, setPaymentOpened] = useState(false)
  const [mounted, setMounted] = useState(false)

  const activeProducts = dynamicProducts || PRODUCTS

  useEffect(() => {
    setMounted(true)
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
          ...(analysisId ? { analysisId } : {}),
          ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
        }),
      })
      const data = await res.json() as { ok: boolean; initPoint?: string; error?: { message: string } }
      if (data.ok && data.initPoint) {
        window.open(data.initPoint, '_blank', 'noopener,noreferrer')
        setPaymentOpened(true)
        setLoading(null)
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

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 w-full sm:max-w-md mx-0 sm:mx-4 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-7 pr-6">
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-display text-xl font-bold mb-1">{copy.title}</h2>
          <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
        </div>

        {/* SKUs */}
        <div className="space-y-2.5 mb-5">
          {SKUS.map(({ sku, highlight }) => {
            const product = activeProducts[sku]
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
                  'w-full p-4 rounded-xl border-2 text-left transition-all disabled:opacity-60',
                  highlight
                    ? 'border-primary bg-primary/[0.07] ring-1 ring-primary/30'
                    : 'border-border hover:border-border/80 bg-secondary/30 hover:bg-secondary/50',
                ].join(' ')}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-display font-semibold text-sm flex items-center gap-2">
                      {product.label}
                      {highlight && (
                        <span className="text-[10px] text-primary font-bold bg-primary/15 border border-primary/20 px-2 py-0.5 rounded-full">
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
                    <p className={['font-display font-bold text-lg', appliedCoupon ? 'text-emerald-400' : 'text-foreground'].join(' ')}>
                      R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                {isLoading && (
                  <div className="flex items-center gap-2 mt-2">
                    <Loader2 className="w-3 h-3 animate-spin text-primary" />
                    <p className="text-xs text-muted-foreground">Redirecionando para pagamento...</p>
                  </div>
                )}
                {highlight && !isLoading && (
                  <div className="flex items-center gap-1 mt-2 text-primary">
                    <ArrowRight className="w-3 h-3" />
                    <p className="text-xs font-medium">Melhor custo-benefício</p>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Pagamento Aberto */}
        {paymentOpened && (
          <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground mb-1">Pagamento aberto em nova aba</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  Conclua o pagamento e retorne aqui. Pode levar alguns segundos para confirmar.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors"
                  >
                    Já paguei — verificar
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentOpened(false)}
                    className="w-full py-2 bg-secondary text-muted-foreground rounded-lg text-xs font-medium hover:text-foreground transition-colors"
                  >
                    Tentar outro método
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cupom */}
        <div className="mb-5">
          {!appliedCoupon ? (
            <>
              {!showCoupon ? (
                <button
                  type="button"
                  onClick={() => setShowCoupon(true)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
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
                    className="flex-1 text-sm bg-secondary border border-border rounded-lg px-3 py-2 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground/50"
                    disabled={couponLoading}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    className="text-sm px-3 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50 font-semibold hover:bg-primary/90 transition-colors"
                  >
                    {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Aplicar'}
                  </button>
                </div>
              )}
              {couponError && (
                <p className="flex items-center gap-1 text-xs text-destructive mt-1.5">
                  <AlertCircle className="w-3 h-3" />
                  {couponError}
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                Cupom {appliedCoupon.code} aplicado
                {appliedCoupon.discount.type === 'percent'
                  ? ` — ${appliedCoupon.discount.value}% de desconto`
                  : ` — R$ ${appliedCoupon.discount.value.toFixed(2)} de desconto`}
              </span>
              <button
                type="button"
                onClick={() => { setAppliedCoupon(null); setCouponInput('') }}
                className="text-muted-foreground hover:text-foreground transition-colors ml-2"
              >
                Remover
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          PIX ou cartão · Pagamento seguro via Mercado Pago
        </p>
      </div>
    </div>,
    document.body
  )
}
