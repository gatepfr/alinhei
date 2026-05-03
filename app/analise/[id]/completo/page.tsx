import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { DiagnosticoSchema, CartaSchema, PerguntasSchema } from '@/lib/schemas'
import { GenerateFlow } from '@/components/generate-flow'
import { CompleteResult } from '@/components/complete-result'

interface Props {
  params: { id: string }
}

export const metadata = {
  title: 'Pacote completo — Alinhei',
}

export default async function CompletePage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/analise/${params.id}/completo`)

  const serviceClient = createServiceClient()

  const { id } = params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    notFound()
  }

  const { data: analysis } = await serviceClient
    .from('analyses')
    .select('id, diagnostic')
    .eq('id', id)
    .maybeSingle()

  if (!analysis) notFound()

  const diagnosticoResult = DiagnosticoSchema.safeParse(analysis.diagnostic)
  if (!diagnosticoResult.success) {
    console.error(`[analise/${id}/completo] Invalid diagnostic data:`, diagnosticoResult.error.format())
  }

  const diagnosticoData = diagnosticoResult.success ? diagnosticoResult.data : (analysis.diagnostic as any)

  const { data: generation } = await serviceClient
    .from('generations')
    .select('id, curriculo_otimizado, carta, perguntas')
    .eq('analysis_id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  const nav = (
    <nav className="border-b border-border/60 bg-background/80 backdrop-blur-md px-4 py-3">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <Link href="/" className="font-display font-bold text-lg tracking-tight">
          Alinhei
        </Link>
        <Link href="/analise" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Nova análise
        </Link>
      </div>
    </nav>
  )

  if (!generation || (!generation.curriculo_otimizado && !generation.carta && !generation.perguntas)) {
    return (
      <div className="min-h-screen bg-background">
        {nav}
        <GenerateFlow analysisId={params.id} userEmail={user.email ?? ''} />
      </div>
    )
  }

  const cartaResult = CartaSchema.safeParse(generation.carta)
  const perguntasResult = PerguntasSchema.safeParse(generation.perguntas)

  return (
    <div className="min-h-screen bg-background">
      {nav}
      <CompleteResult
        diagnostico={diagnosticoData}
        curriculoOtimizado={generation.curriculo_otimizado as string | null}
        carta={cartaResult.success ? cartaResult.data : null}
        perguntas={perguntasResult.success ? perguntasResult.data : null}
        generationId={generation.id}
        analysisId={params.id}
      />
    </div>
  )
}
