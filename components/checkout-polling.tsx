// components/checkout-polling.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Loader2 } from 'lucide-react'

interface CheckoutPollingProps {
  analysisId: string
}

const POLL_INTERVAL_MS = 3000
const MAX_POLLS = 40  // 40 × 3s = 2 minutos

export function CheckoutPolling({ analysisId: _analysisId }: CheckoutPollingProps) {
  const [status, setStatus] = useState<'polling' | 'confirmed' | 'timeout'>('polling')
  const router = useRouter()

  useEffect(() => {
    let polls = 0
    let stopped = false

    async function poll() {
      if (stopped) return
      polls++

      try {
        const res = await fetch('/api/balance')
        const data = await res.json() as { ok: boolean; balance: number }
        if (data.ok && data.balance > 0) {
          setStatus('confirmed')
          setTimeout(() => router.refresh(), 1500)
          return
        }
      } catch {
        // erro de rede — tentar novamente
      }

      if (polls >= MAX_POLLS) {
        setStatus('timeout')
        return
      }

      setTimeout(poll, POLL_INTERVAL_MS)
    }

    setTimeout(poll, POLL_INTERVAL_MS)
    return () => { stopped = true }
  }, [router])

  if (status === 'confirmed') {
    return (
      <div className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
        <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
        <p className="text-sm font-medium text-green-700">
          Pagamento confirmado! Carregando seu crédito...
        </p>
      </div>
    )
  }

  if (status === 'timeout') {
    return (
      <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
        <p className="font-medium mb-1">Pagamento ainda não confirmado</p>
        <p>
          O pagamento pode demorar alguns minutos. Recarregue a página ou acesse
          seu histórico em breve.
        </p>
      </div>
    )
  }

  return (
    <div className="mb-6 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
      <Loader2 className="w-5 h-5 text-blue-500 shrink-0 animate-spin" />
      <p className="text-sm font-medium text-blue-700">
        Verificando confirmação do pagamento...
      </p>
    </div>
  )
}
