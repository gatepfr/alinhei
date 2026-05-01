import Link from 'next/link'
import Image from 'next/image'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, FileText, Zap, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/logout-button'

export default async function LandingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Image src="/logo.png" alt="Alinhei" width={120} height={32} className="h-8 w-auto" priority />
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                  Minhas análises
                </Link>
                <LogoutButton />
              </>
            ) : (
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
                Entrar
              </Link>
            )}
            <Link href="/analise" className={cn(buttonVariants({ size: 'sm' }))}>
              Analisar grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            Powered by IA · Resultado em 30 segundos
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-6">
            Seu currículo está pronto<br />para a vaga dos seus sonhos?
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Suba seu currículo, cole a descrição da vaga e receba um diagnóstico honesto
            com nota de aderência, pontos fortes e gaps críticos — <strong>gratuitamente</strong>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/analise" className={cn(buttonVariants({ size: 'lg' }), 'text-base h-12 px-8')}>
              Analisar meu currículo grátis →
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Sem cadastro para o diagnóstico. Pacote completo por R$ 9,90.
          </p>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">Como funciona</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <StepCard
              step="1"
              icon={<FileText className="w-6 h-6" />}
              title="Suba seu currículo"
              description="Faça upload do PDF ou cole o texto do currículo. Cole também a descrição da vaga que você quer."
            />
            <StepCard
              step="2"
              icon={<Zap className="w-6 h-6" />}
              title="IA analisa em 30s"
              description="Nossa IA compara seu perfil com os requisitos da vaga e calcula uma nota de aderência precisa."
            />
            <StepCard
              step="3"
              icon={<Star className="w-6 h-6" />}
              title="Receba o pacote completo"
              description="Diagnóstico, currículo reescrito para ATS, carta de apresentação e 5 perguntas com respostas STAR."
            />
          </div>
        </div>
      </section>

      {/* O que você recebe */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">O que está incluído no pacote completo</h2>
          <p className="text-muted-foreground mb-10">
            Por R$ 9,90 — o que um coach cobraria R$ 300
          </p>
          <div className="grid sm:grid-cols-2 gap-4 text-left">
            {[
              'Diagnóstico completo com 3 pontos fortes e 3 gaps',
              'Currículo reescrito e otimizado para ATS',
              'Carta de apresentação para LinkedIn',
              'Carta de apresentação para e-mail',
              '5 perguntas de entrevista com respostas STAR',
              'PDF pronto para download',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 p-4 rounded-lg border border-gray-100">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
          <Link href="/analise" className={cn(buttonVariants({ size: 'lg' }), 'mt-10 text-base h-12 px-8')}>
            Começar análise grátis →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-4 text-center text-sm text-muted-foreground">
        <p>© 2025 Alinhei. Feito no Brasil para brasileiros.</p>
      </footer>
    </div>
  )
}

function StepCard({
  step,
  icon,
  title,
  description,
}: {
  step: string
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center text-center gap-3 p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
        {step}
      </div>
      <div className="text-primary">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
