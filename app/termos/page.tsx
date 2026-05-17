import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description: 'Termos de Uso do Alinhei — leia as condições para uso da plataforma.',
}

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-40 border-b border-border/40 bg-background/85 backdrop-blur-xl px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="Alinhei" width={110} height={32} className="h-8 w-auto" priority />
          </Link>
          <Link
            href="/analise"
            className={cn(buttonVariants({ size: 'sm' }), 'bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs')}
          >
            Analisar grátis
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Termos de Uso</h1>
        <p className="text-sm text-muted-foreground mb-12">Última atualização: 17 de maio de 2026</p>

        <Section title="1. Aceitação dos Termos">
          <p>Ao acessar ou usar o Alinhei, você concorda com estes Termos de Uso. Se não concordar com qualquer parte destes Termos, não utilize o serviço.</p>
        </Section>

        <Section title="2. Descrição do Serviço">
          <p>O Alinhei é uma plataforma online que analisa currículos em relação a descrições de vagas usando inteligência artificial e entrega:</p>
          <ul>
            <li>Diagnóstico de aderência com nota, pontos fortes e gaps críticos;</li>
            <li>Currículo reescrito e otimizado para sistemas ATS;</li>
            <li>Carta de apresentação para LinkedIn e e-mail;</li>
            <li>Simulado de entrevista com 5 perguntas no formato STAR.</li>
          </ul>
          <p>O diagnóstico inicial é gratuito e não requer cadastro. A entrega do pacote completo exige pagamento de créditos.</p>
        </Section>

        <Section title="3. Conta e Créditos">
          <ul>
            <li>Créditos são adquiridos por pagamento e debitados no momento da geração do pacote completo.</li>
            <li>Créditos não utilizados expiram conforme informado no momento da compra.</li>
            <li>Créditos não são transferíveis entre contas.</li>
          </ul>
        </Section>

        <Section title="4. Pagamento e Reembolso">
          <ul>
            <li>Pagamentos são processados pelo Mercado Pago (PIX ou cartão de crédito).</li>
            <li>Após a geração do pacote completo, o crédito é consumido e não há reembolso, pois o serviço foi integralmente prestado.</li>
            <li>
              Em caso de falha técnica comprovada que impeça a entrega, o crédito é estornado automaticamente ou mediante
              solicitação para{' '}
              <a href="mailto:suporte@alinhei.com.br" className="text-primary hover:underline">
                suporte@alinhei.com.br
              </a>.
            </li>
          </ul>
        </Section>

        <Section title="5. Uso Aceitável">
          <p>É proibido:</p>
          <ul>
            <li>Usar o serviço para fins ilegais ou fraudulentos;</li>
            <li>Realizar scraping, engenharia reversa ou reprodução não autorizada da plataforma;</li>
            <li>Revender ou sublicenciar o serviço a terceiros;</li>
            <li>Submeter conteúdo de terceiros sem autorização.</li>
          </ul>
        </Section>

        <Section title="6. Propriedade Intelectual">
          <ul>
            <li>O conteúdo gerado pela IA (currículo reescrito, cartas, simulado) é de propriedade do usuário que o gerou.</li>
            <li>A plataforma, marca, código e design do Alinhei são de propriedade de PAULO FABRICIO MAGRI DOS REIS.</li>
          </ul>
        </Section>

        <Section title="7. Isenção de Garantias e Limitação de Responsabilidade">
          <p>
            O Alinhei é fornecido &ldquo;como está&rdquo;. Não garantimos que o uso do serviço resultará em entrevistas ou
            contratações. O conteúdo gerado pela IA é uma sugestão baseada no material fornecido — a decisão final de uso
            é do usuário.
          </p>
          <p>Não somos responsáveis por danos indiretos, perda de oportunidades ou resultados de processos seletivos.</p>
        </Section>

        <Section title="8. Alterações nos Termos">
          <p>
            Podemos alterar estes Termos a qualquer momento. Alterações significativas serão comunicadas por e-mail ou
            aviso na plataforma. O uso continuado após a notificação implica aceitação dos novos Termos.
          </p>
        </Section>

        <Section title="9. Contato e Foro">
          <p>
            Dúvidas:{' '}
            <a href="mailto:suporte@alinhei.com.br" className="text-primary hover:underline">
              suporte@alinhei.com.br
            </a>
          </p>
          <p>Fica eleito o foro da Comarca de Apucarana — PR para dirimir quaisquer controvérsias decorrentes destes Termos.</p>
        </Section>
      </main>

      <footer className="border-t border-border/40 py-10 px-4 mt-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <Image src="/logo.png" alt="Alinhei" width={80} height={24} className="h-6 w-auto opacity-60" />
          <p>© 2025 Alinhei. Feito no Brasil para brasileiros.</p>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-display text-lg font-semibold text-foreground mt-10 mb-3">{title}</h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed [&_ul]:list-disc [&_ul]:list-outside [&_ul]:ml-5 [&_ul]:space-y-1.5 [&_p]:mb-0">
        {children}
      </div>
    </section>
  )
}
