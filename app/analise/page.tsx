import { UploadForm } from '@/components/upload-form'
import { createClient } from '@/lib/supabase/server'
import { MainNav } from '@/components/main-nav'

export const metadata = {
  title: 'Analisar currículo — Alinhei',
}

export default async function AnalisePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const adminEmails = (process.env.ADMIN_EMAIL ?? '').split(',').map(e => e.trim().toLowerCase())
  const isAdmin = user?.email ? adminEmails.includes(user.email.toLowerCase()) : false

  const initialVaga = typeof searchParams.vaga === 'string' ? searchParams.vaga : ''

  return (
    <div className="min-h-screen bg-background">
      <MainNav isAdmin={isAdmin} />

      <div className="max-w-3xl mx-auto px-4 py-14">
        <div className="mb-10 text-center animate-fade-up">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Diagnóstico gratuito</p>
          <h1 className="font-display text-3xl font-bold tracking-tight mb-2">
            Analisar currículo
          </h1>
          <p className="text-muted-foreground">
            Resultado em ~30 segundos. Sem cadastro necessário.
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 animate-fade-up delay-100 shadow-sm">
          <UploadForm initialVaga={initialVaga} />
        </div>
      </div>
    </div>
  )
}
