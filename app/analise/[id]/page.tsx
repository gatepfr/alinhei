// app/analise/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PreviewResult } from '@/components/preview-result'
import { CheckoutPolling } from '@/components/checkout-polling'
import { DiagnosticoSchema } from '@/lib/schemas'
import { getBalance } from '@/lib/credits'

interface Props {
  params: { id: string }
  searchParams: { checkout?: string }
}

export const metadata = {
  title: 'Resultado da análise — Alinhei',
}

export default async function AnaliseResultPage({ params, searchParams }: Props) {
  const serviceClient = createServiceClient()

  const { data: analysis } = await serviceClient
    .from('analyses')
    .select('id, diagnostic')
    .eq('id', params.id)
    .maybeSingle()

  if (!analysis) notFound()

  const parsed = DiagnosticoSchema.safeParse(analysis.diagnostic)
  if (!parsed.success) notFound()

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const balance = user ? await getBalance(user.id) : 0
  const showPolling = searchParams.checkout === 'success' && !!user && balance === 0

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-bold text-lg tracking-tight">
            Alinhei
          </Link>
          <Link href="/analise" className="text-sm text-muted-foreground hover:text-foreground">
            Nova análise
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Resultado da análise</h1>
          <p className="text-muted-foreground mt-1">
            Veja abaixo o diagnóstico gratuito. Desbloqueie o pacote completo para o currículo reescrito e mais.
          </p>
        </div>

        {showPolling && <CheckoutPolling analysisId={params.id} />}

        <PreviewResult
          diagnostic={parsed.data}
          analysisId={analysis.id}
          userId={user?.id ?? null}
          balance={balance}
        />
      </div>
    </div>
  )
}
