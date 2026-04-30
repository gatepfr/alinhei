import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { PreviewResult } from '@/components/preview-result'
import { DiagnosticoSchema } from '@/lib/schemas'

interface Props {
  params: { id: string }
}

export const metadata = {
  title: 'Resultado da análise — VagaCerta',
}

export default async function AnaliseResultPage({ params }: Props) {
  const supabase = createServiceClient()

  const { data: analysis } = await supabase
    .from('analyses')
    .select('id, diagnostic')
    .eq('id', params.id)
    .maybeSingle()

  if (!analysis) notFound()

  const parsed = DiagnosticoSchema.safeParse(analysis.diagnostic)
  if (!parsed.success) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-bold text-lg tracking-tight">
            VagaCerta
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

        <PreviewResult diagnostic={parsed.data} analysisId={analysis.id} />
      </div>
    </div>
  )
}
