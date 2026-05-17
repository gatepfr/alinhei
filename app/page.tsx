import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { CheckCircle, FileText, Zap, Star, ArrowRight, Sparkles, Lock, TrendingUp, AlertTriangle, Shield, Clock, XCircle, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/logout-button'
import Image from 'next/image'

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://alinhei.com.br/#organization',
      name: 'Alinhei',
      url: 'https://alinhei.com.br',
      description:
        'Plataforma de análise de currículo com IA que entrega diagnóstico de aderência, currículo reescrito para ATS, carta de apresentação e simulado de entrevista.',
      foundingDate: '2025',
      areaServed: { '@type': 'Country', name: 'Brazil' },
      inLanguage: 'pt-BR',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://alinhei.com.br/#app',
      name: 'Alinhei',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: 'https://alinhei.com.br',
      description:
        'Analise seu currículo contra uma vaga com IA e receba diagnóstico, currículo reescrito, carta de apresentação e simulado de entrevista em menos de 1 minuto.',
      inLanguage: 'pt-BR',
      offers: [
        {
          '@type': 'Offer',
          name: 'Análise única',
          price: '9.90',
          priceCurrency: 'BRL',
          description: '1 análise completa: currículo reescrito, cartas de apresentação e simulado STAR.',
        },
        {
          '@type': 'Offer',
          name: 'Pacote 3 análises',
          price: '19.90',
          priceCurrency: 'BRL',
          description: '3 análises completas — R$ 6,63 por vaga.',
        },
        {
          '@type': 'Offer',
          name: 'Pacote 10 análises',
          price: '49.90',
          priceCurrency: 'BRL',
          description: '10 análises completas — R$ 4,99 por vaga.',
        },
      ],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '2400',
      },
    },
    {
      '@type': 'HowTo',
      name: 'Como analisar seu currículo com o Alinhei',
      description:
        'Analise a aderência do seu currículo a uma vaga específica usando IA em três passos simples.',
      step: [
        {
          '@type': 'HowToStep',
          position: 1,
          name: 'Suba seu currículo',
          text: 'Faça upload do PDF ou cole o texto do seu currículo. Cole também a descrição da vaga que você quer conquistar.',
        },
        {
          '@type': 'HowToStep',
          position: 2,
          name: 'IA analisa em 30 segundos',
          text: 'Nossa IA compara seu perfil com os requisitos da vaga e calcula uma nota de aderência precisa.',
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'Receba o pacote completo',
          text: 'Diagnóstico, currículo reescrito para ATS, carta de apresentação e 5 perguntas de entrevista com respostas no formato STAR.',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'A análise é genérica ou considera a vaga que quero?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'É 100% específica para a vaga. Nossa IA compara seu currículo linha por linha com a descrição da vaga que você colou. Não existe diagnóstico genérico — cada análise é única para aquela combinação de currículo + vaga.',
          },
        },
        {
          '@type': 'Question',
          name: 'O currículo reescrito vai ter experiências que não tenho?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Não. Nunca inventamos ou fabricamos informações. O currículo reescrito reorganiza e reformula o que você já tem, usando a linguagem exata que a vaga pede. Sua história permanece 100% verdadeira.',
          },
        },
        {
          '@type': 'Question',
          name: 'O que está incluído no pacote completo?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Diagnóstico com nota de aderência, 3 pontos fortes e 3 gaps críticos com como resolver; currículo reescrito e otimizado para ATS; carta de apresentação para LinkedIn (até 300 caracteres); carta de apresentação para e-mail; e 5 perguntas de entrevista com respostas completas no formato STAR. Tudo disponível para download em PDF.',
          },
        },
        {
          '@type': 'Question',
          name: 'Em quanto tempo fico com os resultados?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'O diagnóstico gratuito fica pronto em aproximadamente 30 segundos. Após o pagamento, o pacote completo é gerado em 1 a 2 minutos. O PDF fica disponível imediatamente para download.',
          },
        },
        {
          '@type': 'Question',
          name: 'Posso usar para vagas diferentes?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sim. Cada análise é para uma vaga específica. Se você tem 3 vagas em vista, o pacote de 3 análises por R$ 19,90 sai a R$ 6,63 por vaga.',
          },
        },
      ],
    },
  ],
}

export default async function LandingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-background noise-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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

      <ProblemSection />

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

      {/* Comparação */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/[0.04] blur-[100px] rounded-full" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">O que você recebe</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">
              De candidato invisível a candidato preparado
            </h2>
            <p className="text-muted-foreground">
              Tudo que um coach de carreira cobraria R$ 300+ — por{' '}
              <span className="text-primary font-bold text-xl">R$ 9,90</span>
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-10">
            {/* Sem Alinhei */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-2 mb-5">
                <XCircle className="w-4 h-4 text-destructive/60" />
                <h3 className="font-semibold text-sm text-muted-foreground">Sem o Alinhei</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Currículo genérico para todas as vagas',
                  'Sem saber se passa pelo filtro ATS',
                  'Sem identificar os gaps críticos',
                  'Entrevista sem preparação específica',
                  'Sem carta de apresentação personalizada',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground/70">
                    <XCircle className="w-3.5 h-3.5 text-destructive/40 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Com Alinhei */}
            <div className="bg-primary/[0.05] rounded-2xl border border-primary/20 p-6">
              <div className="flex items-center gap-2 mb-5">
                <CheckCircle className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm text-primary">Com o Alinhei</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Currículo reescrito para essa vaga específica',
                  'Nota de aderência + gaps com como resolver',
                  '3 pontos fortes e 3 gaps críticos detalhados',
                  '5 perguntas de entrevista com respostas STAR',
                  '2 cartas de apresentação (LinkedIn + e-mail)',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                    <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="text-center">
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
            <p className="text-xs text-muted-foreground mt-3">
              Diagnóstico gratuito · Pacote completo a partir de R$ 9,90
            </p>
          </div>
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

      <FaqSection />

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
          <p>© 2026 Alinhei. Feito no Brasil para brasileiros.</p>
          <div className="flex items-center gap-4">
            <Link href="/termos" className="hover:text-foreground transition-colors">Termos de Uso</Link>
            <Link href="/privacidade" className="hover:text-foreground transition-colors">Privacidade</Link>
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

function FaqSection() {
  const faqs = [
    {
      q: 'A análise é genérica ou considera a vaga que quero?',
      a: 'É 100% específica para a vaga. Nossa IA compara seu currículo linha por linha com a descrição da vaga que você colou. Não existe diagnóstico genérico — cada análise é única para aquela combinação de currículo + vaga.',
    },
    {
      q: 'O currículo reescrito vai ter experiências que não tenho?',
      a: 'Não. Nunca inventamos ou fabricamos informações. O currículo reescrito reorganiza e reformula o que você já tem, usando a linguagem exata que a vaga pede. Sua história permanece 100% verdadeira.',
    },
    {
      q: 'O que está incluído no pacote completo?',
      a: 'Diagnóstico com nota de aderência, 3 pontos fortes e 3 gaps críticos com como resolver; currículo reescrito e otimizado para ATS; carta de apresentação para LinkedIn (até 300 caracteres); carta de apresentação para e-mail; e 5 perguntas de entrevista com respostas completas no formato STAR. Tudo disponível para download em PDF.',
    },
    {
      q: 'Em quanto tempo fico com os resultados?',
      a: 'O diagnóstico gratuito fica pronto em ~30 segundos. Após o pagamento, o pacote completo (currículo reescrito + cartas + simulado de entrevista) é gerado em 1–2 minutos. O PDF fica disponível imediatamente para download.',
    },
    {
      q: 'Posso usar para vagas diferentes?',
      a: 'Sim. Cada análise é para uma vaga específica — é exatamente esse o ponto. Se você tem 3 vagas em vista, o pacote de 3 análises por R$ 19,90 sai a R$ 6,63 por vaga.',
    },
  ]

  return (
    <section className="py-24 px-4 border-t border-border/40">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Dúvidas</p>
          <h2 className="font-display text-3xl font-bold">Perguntas frequentes</h2>
        </div>
        <div className="space-y-2">
          {faqs.map(({ q, a }) => (
            <details
              key={q}
              className="group bg-card border border-border rounded-xl overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer px-5 py-4 text-sm font-semibold text-foreground select-none [&::-webkit-details-marker]:hidden list-none">
                {q}
                <span className="shrink-0 text-muted-foreground text-base group-open:rotate-180 transition-transform duration-200 inline-block">
                  ↓
                </span>
              </summary>
              <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/60 pt-3">
                {a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProblemSection() {
  const problems = [
    {
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      title: 'Filtros ATS invisíveis',
      description:
        '3 em cada 4 vagas passam por sistemas automáticos que rejeitam currículos sem as palavras certas — antes de qualquer recrutador ver.',
    },
    {
      icon: <XCircle className="w-4 h-4" />,
      color: 'bg-red-500/10 border-red-500/20 text-red-400',
      title: 'Keywords da vaga ausentes',
      description:
        'Você pode ter toda a experiência necessária. Mas se as palavras exatas da vaga não aparecem no currículo, o filtro te elimina.',
    },
    {
      icon: <FileText className="w-4 h-4" />,
      color: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
      title: 'Currículo genérico',
      description:
        'Um currículo mandado para 20 vagas diferentes tem ~5% de conversão. Personalizado para a vaga: até 3x mais chances de entrevista.',
    },
    {
      icon: <Users className="w-4 h-4" />,
      color: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
      title: 'Concorrência já usa IA',
      description:
        'Candidatos que otimizam currículo com IA para cada vaga saem na frente. O campo de jogo mudou — mas você pode equilibrar agora.',
    },
  ]

  return (
    <section className="py-24 px-4 border-t border-border/40">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">O problema</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">
            Por que bons candidatos perdem vagas
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Não é falta de qualificação. É a forma como o currículo é apresentado para o sistema errado.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {problems.map((p) => (
            <div key={p.title} className="flex gap-4 p-5 bg-card rounded-2xl border border-border card-glow">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${p.color}`}>
                {p.icon}
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
