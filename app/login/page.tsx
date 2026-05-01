import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LoginForm } from './login-form'

export const metadata = { title: 'Entrar — Alinhei' }

interface Props {
  searchParams: { next?: string }
}

export default async function LoginPage({ searchParams }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const safeNext = /^\/[^/\\]/.test(searchParams.next ?? '') ? searchParams.next! : '/analise'
  if (user) redirect(safeNext)

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/60 bg-background/80 backdrop-blur-md px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="font-display font-bold text-lg tracking-tight">
            Alinhei
          </Link>
        </div>
      </nav>

      {/* Atmospheric glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.05] blur-[100px]" />
      </div>

      <div className="relative flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl font-bold">
              {searchParams.next ? 'Faça login para continuar' : 'Acesse sua conta'}
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              Diagnóstico grátis sem cadastro. Login para o pacote completo.
            </p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-8">
            <LoginForm next={searchParams.next} />
          </div>
        </div>
      </div>
    </div>
  )
}
