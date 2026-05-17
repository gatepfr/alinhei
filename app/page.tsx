import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { CheckCircle, FileText, Zap, Star, ArrowRight, Sparkles, Lock, TrendingUp, AlertTriangle, Shield, Clock, XCircle, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/logout-button'
import Image from 'next/image'

export default async function LandingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-background noise-bg">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-border/40 bg-background/85 backdrop-blur-xl px-4 py-3">
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
              className={cn(
                buttonVariants({ size: 'sm' }),
                'bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs'
              )}
            >
              Analisar grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-24 px-4 overflow-hidden">
        {/* Atmospheric glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-5%] left-[15%] w-[600px] h-[500px] rounded-full bg-primary/[0.08] blur-[140px]" />
          <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-primary/[0.05] blur-[100px]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[200px] bg-primary/[0.03] blur-[80px]" />
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-1.5 mb-8 animate-fade-up">
                <Sparkles className="w-3 h-3" />
                Powered by Claude AI · Resultado em 30 segundos
              </div>

              <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight text-foreground mb-6 leading-[1.06] text-balance animate-fade-up delay-100">
                Seu currículo passa<br />
                <span className="text-primary amber-text-glow">pelo filtro ATS</span><br />
                ou vai para o lixo?
              </h1>

              <p className="text-lg text-muted-foreground mb-10 max-w-lg text-balance animate-fade-up delay-200 leading-relaxed">
                75% dos currículos nunca chegam ao recrutador — rejeitados por sistemas automáticos
                antes de qualquer humano ler. Descubra em 30 segundos os gaps exatos que estão te
                custando entrevistas —{' '}
                <span className="text-foreground font-medium">sem cadastro</span>.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 animate-fade-up delay-300">
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
                Sem cadastro para o diagnóstico · Pacote completo a partir de R$ 9,90
              </p>
            </div>

            {/* Right: floating preview card */}
            <div className="lg:flex justify-end hidden animate-fade-up delay-300">
              <div className="animate-float">
                <HeroPreviewCard />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="py-5 px-4 border-y border-border/40 bg-card/30">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm">
            <StatItem value="2.400+" label="análises feitas" />
            <div className="w-px h-4 bg-border hidden sm:block" />
            <StatItem value="4.8★" label="avaliação média" />
            <div className="w-px h-4 bg-border hidden sm:block" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span>Pagamento seguro via Mercado Pago</span>
            </div>
            <div className="w-px h-4 bg-border hidden sm:block" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Resultado em ~30 segundos</span>
            </div>
            <div className="w-px h-4 bg-border hidden sm:block" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Nunca inventamos experiências</span>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Como funciona</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold">Três passos. Trinta segundos.</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
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
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/[0.04] blur-[100px] rounded-full" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Pacote completo</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">
            O que um coach cobraria R$ 300
          </h2>
          <p className="text-muted-foreground mb-12">
            Você paga <span className="text-primary font-bold text-xl">R$ 9,90</span>
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

      {/* Depoimentos */}
      <section className="py-24 px-4 border-t border-border/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Depoimentos</p>
            <h2 className="font-display text-3xl font-bold">Quem já usou recomenda</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            <Testimonial
              name="Mariana S."
              role="Analista de Marketing"
              text="Consegui a entrevista em 3 dias após usar o currículo reescrito. A nota de aderência foi certeira — sabia exatamente o que melhorar."
              score={91}
            />
            <Testimonial
              name="Rafael T."
              role="Desenvolvedor Back-end"
              text="Fazia 2 meses mandando currículo sem retorno. Rodei o Alinhei, ajustei os pontos fracos e em 1 semana tinha 2 entrevistas marcadas."
              score={78}
            />
            <Testimonial
              name="Camila R."
              role="Gerente de Projetos"
              text="As perguntas STAR foram exatamente o que o entrevistador perguntou. Me preparei muito melhor do que nas outras entrevistas."
              score={85}
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="relative bg-card border border-primary/20 rounded-3xl p-10 text-center overflow-hidden">
            <div className="absolute inset-0 bg-primary/[0.04] pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-primary/[0.12] blur-[60px] pointer-events-none" />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center mx-auto mb-5">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-display text-3xl font-bold mb-3">
                Pronto para se candidatar com confiança?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                Diagnóstico gratuito em 30 segundos. Sem cadastro. Sem cartão de crédito.
              </p>
              <Link
                href="/analise"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'bg-primary text-primary-foreground hover:bg-primary/90 h-13 px-10 text-base font-semibold group gap-2 amber-glow'
                )}
              >
                Analisar meu currículo grátis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Alinhei"
              width={80}
              height={24}
              className="h-6 w-auto opacity-60"
            />
          </div>
          <p>© 2025 Alinhei. Feito no Brasil para brasileiros.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-foreground transition-colors">Entrar</Link>
            <Link href="/analise" className="hover:text-foreground transition-colors">Analisar</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-display font-bold text-foreground">{value}</span>
      <span className="text-muted-foreground">{label}</span>
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
    <div className="flex flex-col gap-4 p-6 bg-card rounded-2xl border border-border card-glow relative overflow-hidden">
      <div className="absolute top-4 right-4 font-display text-5xl font-bold text-border/60 leading-none select-none">
        {step}
      </div>
      <div className="w-10 h-10 rounded-xl bg-primary/12 border border-primary/20 flex items-center justify-center text-primary shrink-0 relative z-10">
        {icon}
      </div>
      <div className="relative z-10">
        <h3 className="font-display font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function HeroPreviewCard() {
  const score = 84
  const radius = 46
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative w-[300px]">
      {/* Glow behind card */}
      <div className="absolute inset-0 bg-primary/20 blur-3xl scale-75 rounded-full" />

      <div className="relative bg-card border border-border rounded-2xl p-6 shadow-2xl shadow-black/40">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-5 text-center">
          Nota de aderência
        </p>

        {/* Score ring */}
        <div className="flex justify-center mb-4">
          <div className="relative inline-flex items-center justify-center">
            <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="60" cy="60" r={radius}
                fill="none"
                stroke="oklch(0.22 0.014 250)"
                strokeWidth="8"
              />
              <circle
                cx="60" cy="60" r={radius}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 8px #f59e0b60)' }}
              />
            </svg>
            <div className="absolute text-center">
              <span className="font-display text-3xl font-bold leading-none text-amber-400">{score}</span>
              <span className="text-muted-foreground text-sm">%</span>
            </div>
          </div>
        </div>

        <p className="text-center font-display font-semibold text-amber-400 mb-1 text-sm">Bom</p>
        <p className="text-xs text-center text-muted-foreground mb-5">Acima da média para esta vaga</p>

        {/* Ponto forte */}
        <div className="bg-emerald-500/[0.08] border border-emerald-500/20 rounded-xl p-3 mb-2">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" />
            <p className="text-xs font-semibold text-emerald-400">Experiência relevante</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            5 anos em gestão de projetos ágeis com resultados comprovados...
          </p>
        </div>

        {/* Gap */}
        <div className="bg-amber-500/[0.06] border border-amber-500/15 rounded-xl p-3 mb-2">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
            <p className="text-xs font-semibold text-amber-400">Certificação não mencionada</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            A vaga exige PMP ou equivalente, não encontrado no...
          </p>
        </div>

        {/* Locked */}
        <div className="border border-border/60 rounded-xl p-2.5 flex items-center gap-2 bg-secondary/30">
          <Lock className="w-3 h-3 text-muted-foreground/40 shrink-0" />
          <p className="text-xs text-muted-foreground/50">+ currículo reescrito, cartas, STAR...</p>
        </div>
      </div>
    </div>
  )
}

function Testimonial({ name, role, text, score }: { name: string; role: string; text: string; score: number }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 card-glow flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center font-display font-bold text-sm text-primary">
          {name[0]}
        </div>
        <div>
          <p className="font-semibold text-sm text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
        <div className="ml-auto shrink-0">
          <span className="font-display font-bold text-primary text-sm">{score}%</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{`"${text}"`}</p>
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-3 h-3 fill-primary text-primary" />
        ))}
      </div>
    </div>
  )
}
