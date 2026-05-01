import { UploadForm } from '@/components/upload-form'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/logout-button'

export const metadata = {
  title: 'Analisar currículo — Alinhei',
}

export default async function AnalisePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-bold text-lg tracking-tight">
            Alinhei
          </Link>
          {user ? (
            <LogoutButton />
          ) : (
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Entrar
            </Link>
          )}
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Analisar currículo
          </h1>
          <p className="text-muted-foreground">
            Diagnóstico gratuito em ~30 segundos. Sem cadastro necessário.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <UploadForm />
        </div>
      </div>
    </div>
  )
}
