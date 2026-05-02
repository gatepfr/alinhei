import { UploadForm } from '@/components/upload-form'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/logout-button'

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

  const initialVaga = typeof searchParams.vaga === 'string' ? searchParams.vaga : ''

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/60 bg-background/80 backdrop-blur-md px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-lg tracking-tight">
            Alinhei
          </Link>
          {user ? (
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Minhas análises
              </Link>
              <LogoutButton />
            </div>
          ) : (
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Entrar
            </Link>
          )}
        </div>
      </nav>

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

        <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 animate-fade-up delay-100">
          <UploadForm initialVaga={initialVaga} />
        </div>
      </div>
    </div>
  )
}
