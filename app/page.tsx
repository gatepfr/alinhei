import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { CheckCircle, FileText, Zap, Star, ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/logout-button'

import Image from 'next/image'

export default async function LandingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image 
              src="/logo.png" 
              alt="Alinhei" 
              width={110} 
              height={32} 
              className="h-8 w-auto" 
              priority
            />
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Minhas análises
                </Link>
                <LogoutButton />
              </>
            ) : (
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Entrar
              </Link>
            )}
            <Link
              href="/analise"
              className={cn(buttonVariants({ size: 'sm' }), 'bg-primary text-primary-foreground hover:bg-primary/90 font-semibold')}
            >
              Analisar grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-28 px-4 overflow-hidden">
        {/* Atmospheric glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[700px] rounded-full bg-primary/[0.07] blur-[120px]" />
          <div className="absolute bottom-0 left-[20%] w-[400px] h-[300px] rounded-full bg-primary/[0.04] blur-[80px]" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-1.5 mb-8 animate-fade-up">
            <Sparkles className="w-3 h-3" />
            Powered by IA · Resultado em 30 segundos
          </div>

          <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight text-foreground mb-6 leading-[1.08] text-balance animate-fade-up delay-100">
            Seu currículo está pronto<br />
            <span className="text-primary">para a vaga dos seus sonhos?</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto text-balance animate-fade-up delay-200">
            Suba seu currículo, cole a descrição da vaga e receba um diagnóstico honesto
            com nota de aderência, pontos fortes e gaps críticos —{' '}
            <span className="text-foreground font-medium">gratuitamente</span>.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-up delay-300">
            <Link
              href="/analise"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'bg-primary text-primary-foreground hover:bg-primary/90 h-13 px-8 text-base font-semibold group gap-2 amber-glow'
              )}
            >
              Analisar meu currículo grátis
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <p className="text-sm text-muted-foreground mt-5 animate-fade-up delay-400">
            Sem cadastro para o diagnóstico. Pacote completo a partir de R$ 9,90.
          </p>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest text-center mb-3">Como funciona</p>
          <h2 className="font-display text-3xl font-bold text-center mb-14">Três passos. Trinta segundos.</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <StepCard
              step="01"
              icon={<FileText className="w-5 h-5" />}
              title="Suba seu currículo"
              description="Faça upload do PDF ou cole o texto. Cole também a descrição da vaga que você quer conquistar."
            />
            <StepCard
              step="02"
              icon={<Zap className="w-5 h-5" />}
              title="IA analisa em 30s"
              description="Nossa IA compara seu perfil com os requisitos da vaga e calcula uma nota de aderência precisa."
            />
            <StepCard
              step="03"
              icon={<Star className="w-5 h-5" />}
              title="Receba o pacote"
              description="Diagnóstico, currículo reescrito para ATS, carta de apresentação e 5 perguntas com respostas STAR."
            />
          </div>
        </div>
      </section>

      {/* O que está incluído */}
      <section className="py-20 px-4 bg-card/40">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Pacote completo</p>
          <h2 className="font-display text-3xl font-bold mb-3">
            O que um coach cobraria R$ 300
          </h2>
          <p className="text-muted-foreground mb-12">
            Você paga <span className="text-foreground font-semibold">R$ 9,90</span>
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-left mb-12">
            {[
              'Diagnóstico completo com 3 pontos fortes e 3 gaps',
              'Currículo reescrito e otimizado para ATS',
              'Carta de apresentação para LinkedIn',
              'Carta de apresentação para e-mail',
              '5 perguntas de entrevista com respostas STAR',
              'PDF pronto para download',
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card card-glow"
              >
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
          <Link
            href="/analise"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'bg-primary text-primary-foreground hover:bg-primary/90 h-13 px-8 text-base font-semibold group gap-2'
            )}
          >
            Começar análise grátis
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 text-center text-sm text-muted-foreground">
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
    <div className="flex flex-col gap-4 p-6 bg-card rounded-2xl border border-border card-glow">
      <div className="flex items-center gap-3">
        <span className="font-display text-3xl font-bold text-primary/30">{step}</span>
        <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="font-display font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
