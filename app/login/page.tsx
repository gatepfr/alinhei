import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LoginForm } from './login-form'

export const metadata = { title: 'Entrar — VagaCerta' }

interface Props {
  searchParams: { next?: string }
}

export default async function LoginPage({ searchParams }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const safeNext = searchParams.next?.startsWith('/') ? searchParams.next : '/analise'
  if (user) redirect(safeNext)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="font-bold text-lg tracking-tight">
            VagaCerta
          </Link>
        </div>
      </nav>
      <div className="flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold">
              {searchParams.next ? 'Faça login para continuar' : 'Acesse sua conta'}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Diagnóstico grátis sem cadastro. Login para o pacote completo.
            </p>
          </div>
          <LoginForm next={searchParams.next} />
        </div>
      </div>
    </div>
  )
}
