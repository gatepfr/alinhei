// app/analise/[id]/page.tsx
import { notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PreviewResult } from '@/components/preview-result'
import { CheckoutPolling } from '@/components/checkout-polling'
import { MainNav } from '@/components/main-nav'
import { DiagnosticoSchema, type Diagnostico } from '@/lib/schemas'
import { getBalance } from '@/lib/credits'
import { getDynamicProducts } from '@/lib/mercadopago'

interface Props {
  params: { id: string }
  searchParams: { checkout?: string; buy?: string }
}

export const metadata = {
  title: 'Resultado da análise — Alinhei',
}

export default async function AnaliseResultPage({ params, searchParams }: Props) {
  const serviceClient = createServiceClient()
  const showPaywall = searchParams.buy === 'true'

  const { id } = params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    notFound()
  }

  const [analysisRes, products] = await Promise.all([
    serviceClient
      .from('analyses')
      .select('id, diagnostic')
      .eq('id', id)
      .maybeSingle(),
    getDynamicProducts(),
  ])

  const analysis = analysisRes.data
  if (!analysis) notFound()

  // Validação resiliente para evitar 404 em dados legados
  const parsed = DiagnosticoSchema.safeParse(analysis.diagnostic)
  if (!parsed.success) {
    console.error(`[analise/${id}] Invalid diagnostic data:`, parsed.error.format())
  }

  const diagnosticData = parsed.success ? parsed.data : (analysis.diagnostic as unknown as Diagnostico)

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const adminEmails = (process.env.ADMIN_EMAIL ?? '').split(',').map(e => e.trim().toLowerCase())
  const isAdmin = user?.email ? adminEmails.includes(user.email.toLowerCase()) : false

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
      <MainNav isAdmin={isAdmin} />

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
          diagnostic={diagnosticData}
          analysisId={analysis.id}
          userId={user?.id ?? null}
          balance={balance}
          hasGeneration={hasGeneration}
          showPaywallInitial={showPaywall}
          products={products}
        />
      </div>
    </div>
  )
}
