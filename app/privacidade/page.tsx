import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Política de Privacidade do Alinhei — como coletamos, usamos e protegemos seus dados.',
}

export default function PrivacidadePage() {
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
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Política de Privacidade</h1>
        <p className="text-sm text-muted-foreground mb-12">Última atualização: 17 de maio de 2026</p>

        <Section title="1. Quem somos">
          <p>
            O Alinhei é operado por{' '}
            <strong className="text-foreground">PAULO FABRICIO MAGRI DOS REIS</strong>, inscrito no CNPJ sob o nº{' '}
            <strong className="text-foreground">66.301.043/0001-15</strong>, responsável pelo tratamento dos seus dados
            pessoais nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
          </p>
        </Section>

        <Section title="2. Dados coletados">
          <p>Coletamos apenas o necessário para prestar o serviço:</p>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-semibold text-foreground">Dado</th>
                  <th className="text-left py-2 pr-4 font-semibold text-foreground">Origem</th>
                  <th className="text-left py-2 font-semibold text-foreground">Finalidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {[
                  ['Endereço de e-mail', 'Cadastro / login social', 'Autenticação e e-mail transacional'],
                  ['Texto do currículo', 'Upload do usuário', 'Geração da análise pela IA'],
                  ['Descrição da vaga', 'Formulário', 'Geração da análise pela IA'],
                  ['Dados de pagamento', 'Mercado Pago', 'Processamento de cobrança (não armazenamos dados de cartão)'],
                  ['Dados de navegação', 'Google Analytics, Meta Pixel', 'Análise de desempenho e marketing'],
                ].map(([dado, origem, finalidade]) => (
                  <tr key={dado}>
                    <td className="py-2 pr-4 text-foreground font-medium align-top">{dado}</td>
                    <td className="py-2 pr-4 align-top">{origem}</td>
                    <td className="py-2 align-top">{finalidade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="3. Como usamos seus dados">
          <ul>
            <li>Gerar o diagnóstico e o pacote completo de análise;</li>
            <li>Enviar e-mails transacionais (confirmação de pagamento, entrega do PDF);</li>
            <li>Melhorar o serviço com base em métricas de uso agregadas;</li>
            <li>Cumprir obrigações legais.</li>
          </ul>
          <p>Não usamos seus dados para treinar modelos de IA sem consentimento explícito.</p>
        </Section>

        <Section title="4. Compartilhamento com terceiros">
          <p>Seus dados são compartilhados apenas com os fornecedores necessários para operar o serviço:</p>
          <ul>
            <li>
              <strong className="text-foreground">Supabase</strong> — banco de dados e autenticação (servidores nos EUA,
              com cláusulas de proteção adequadas);
            </li>
            <li>
              <strong className="text-foreground">Anthropic</strong> — processamento do texto do currículo e da vaga pela
              IA (dado enviado apenas no momento da análise; a Anthropic não armazena inputs por padrão);
            </li>
            <li>
              <strong className="text-foreground">Mercado Pago</strong> — processamento de pagamento;
            </li>
            <li>
              <strong className="text-foreground">Resend</strong> — envio de e-mails transacionais.
            </li>
          </ul>
          <p>Não vendemos, alugamos ou comercializamos seus dados.</p>
        </Section>

        <Section title="5. Retenção e Exclusão">
          <ul>
            <li>
              O texto do currículo é excluído automaticamente em até{' '}
              <strong className="text-foreground">30 dias</strong> após o upload;
            </li>
            <li>Dados de conta são mantidos enquanto a conta estiver ativa;</li>
            <li>
              Você pode solicitar a exclusão da sua conta e dados a qualquer momento pelo e-mail{' '}
              <a href="mailto:suporte@alinhei.com.br" className="text-primary hover:underline">
                suporte@alinhei.com.br
              </a>.
            </li>
          </ul>
        </Section>

        <Section title="6. Seus Direitos (LGPD — art. 18)">
          <p>Você tem direito a:</p>
          <ul>
            <li>Confirmar a existência de tratamento dos seus dados;</li>
            <li>Acessar seus dados;</li>
            <li>Corrigir dados incompletos ou desatualizados;</li>
            <li>Solicitar anonimização, bloqueio ou exclusão;</li>
            <li>Revogar consentimento;</li>
            <li>Portabilidade dos dados.</li>
          </ul>
          <p>
            Para exercer qualquer direito, envie e-mail para{' '}
            <a href="mailto:suporte@alinhei.com.br" className="text-primary hover:underline">
              suporte@alinhei.com.br
            </a>. Responderemos em até 15 dias úteis.
          </p>
        </Section>

        <Section title="7. Cookies e Rastreamento">
          <p>Usamos:</p>
          <ul>
            <li>
              <strong className="text-foreground">Google Analytics (GA4)</strong> — métricas de tráfego e comportamento
              agregado;
            </li>
            <li>
              <strong className="text-foreground">Meta Pixel</strong> — mensuração de anúncios no Facebook/Instagram.
            </li>
          </ul>
          <p>Você pode desativar cookies pelo seu navegador ou usar extensões de bloqueio de rastreadores.</p>
        </Section>

        <Section title="8. Segurança">
          <p>
            Adotamos medidas técnicas e organizacionais para proteger seus dados: comunicação criptografada (HTTPS/TLS),
            acesso restrito por autenticação e Row Level Security no banco de dados.
          </p>
        </Section>

        <Section title="9. Contato e Encarregado de Dados (DPO)">
          <p><strong className="text-foreground">PAULO FABRICIO MAGRI DOS REIS</strong></p>
          <p>CNPJ: 66.301.043/0001-15</p>
          <p>
            E-mail:{' '}
            <a href="mailto:suporte@alinhei.com.br" className="text-primary hover:underline">
              suporte@alinhei.com.br
            </a>
          </p>
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
