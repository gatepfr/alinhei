// components/checkout-polling.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

/**
 * Componente que fica verificando se o saldo do usuário mudou
 * após ele ter sido redirecionado de volta do Mercado Pago.
 * Útil porque o Webhook pode demorar alguns segundos para processar.
 */
export function CheckoutPolling({ analysisId }: { analysisId: string }) {
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/balance')
        const data = await res.json()
        
        // Se o saldo for maior que zero, o pagamento foi processado!
        if (data.ok && data.balance > 0) {
          clearInterval(interval)
          trackEvent('payment_completed')
          router.refresh()
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 3000) // Verifica a cada 3 segundos

    // Timeout de segurança: para de verificar após 2 minutos
    const timeout = setTimeout(() => {
      clearInterval(interval)
    }, 120000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [analysisId, router])

  return (
    <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
      <Loader2 className="w-4 h-4 text-primary animate-spin" />
      <p className="text-sm font-medium text-primary-foreground/80">
        Aguardando confirmação do pagamento... Seu pacote será liberado automaticamente em instantes.
      </p>
    </div>
  )
}
