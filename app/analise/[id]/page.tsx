// app/analise/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/logout-button'
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

  const { data: existingGen } = user
    ? await serviceClient
        .from('generations')
        .select('id')
        .eq('analysis_id', params.id)
        .eq('user_id', user.id)
        .not('curriculo_otimizado', 'is', null)
        .maybeSingle()
    : { data: null }

  const hasGeneration = !!existingGen

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/60 bg-background/80 backdrop-blur-md px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-lg tracking-tight">
            Alinhei
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/analise" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Nova análise
            </Link>
            {user && (
              <>
                <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Minhas análises
                </Link>
                <LogoutButton />
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8 animate-fade-up">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Diagnóstico gratuito</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">Resultado da análise</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Veja o diagnóstico abaixo. Desbloqueie o pacote completo para o currículo reescrito e mais.
          </p>
        </div>

        {showPolling && <CheckoutPolling analysisId={params.id} />}

        <PreviewResult
          diagnostic={parsed.data}
          analysisId={analysis.id}
          userId={user?.id ?? null}
          balance={balance}
          hasGeneration={hasGeneration}
        />
      </div>
    </div>
  )
}
