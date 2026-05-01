'use client'

import { useEffect, useState } from 'react'
import { X, Zap } from 'lucide-react'
import { PRODUCTS, type ProductSku } from '@/lib/mercadopago'
import { trackEvent } from '@/lib/analytics'

const SKUS: Array<{ sku: ProductSku; highlight?: boolean }> = [
  { sku: 'single' },
  { sku: 'pack3', highlight: true },
  { sku: 'pack10' },
]

interface PaywallModalProps {
  analysisId: string
  onClose: () => void
}

export function PaywallModal({ analysisId, onClose }: PaywallModalProps) {
  const [loading, setLoading] = useState<ProductSku | null>(null)

  useEffect(() => {
    trackEvent('paywall_shown')
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleCheckout(sku: ProductSku) {
    setLoading(sku)
    trackEvent('checkout_started', { sku })
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku, analysisId }),
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
          <h2 className="text-xl font-bold">Desbloqueie o pacote completo</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Currículo reescrito para ATS, 2 cartas e 5 perguntas STAR
          </p>
        </div>

        <div className="space-y-3">
          {SKUS.map(({ sku, highlight }) => {
            const product = PRODUCTS[sku]
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
                  <p className="font-bold text-lg">
                    R${' '}
                    {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
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

        <p className="text-xs text-center text-muted-foreground mt-4">
          PIX ou cartão · Pagamento seguro via Mercado Pago
        </p>
      </div>
    </div>
  )
}
