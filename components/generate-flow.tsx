'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { trackEvent } from '@/lib/analytics'

interface GenerateFlowProps {
  analysisId: string
}

export function GenerateFlow({ analysisId }: GenerateFlowProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function generate() {
      trackEvent('generation_started')
      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analysis_id: analysisId }),
        })
        const data = await res.json()
        if (cancelled) return

        if (!data.ok) {
          setError(data.error?.message ?? 'Erro ao gerar o pacote.')
          return
        }

        trackEvent('generation_completed')
        router.refresh()
      } catch {
        if (!cancelled) setError('Erro de conexão. Tente novamente.')
      }
    }

    generate()
    return () => { cancelled = true }
  }, [analysisId, router])

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-red-600 font-medium mb-4">{error}</p>
        <Button variant="outline" onClick={() => router.push(`/analise/${analysisId}`)}>
          Voltar para análise
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-indigo-500" />
      <h2 className="text-xl font-bold mb-2">Gerando seu pacote completo…</h2>
      <p className="text-muted-foreground text-sm">
        Estamos reescrevendo seu currículo, criando as cartas e preparando o simulado de entrevista.
        Isso leva cerca de 30 segundos.
      </p>
    </div>
  )
}
