// app/dashboard/page.tsx
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getBalance } from '@/lib/credits'
import { LogoutButton } from '@/components/logout-button'
import { ReferralCopy } from './referral-copy'
import { Gift, Coins, FileText, CheckCircle } from 'lucide-react'

export const metadata = { title: 'Dashboard — Alinhei' }

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null // middleware redireciona antes de chegar aqui

  const serviceClient = createServiceClient()
  const sessionId = cookies().get('session_id')?.value

  // Busca análises pelo user_id (análises feitas logado) OU session_id (feitas antes do login)
  const orFilter = sessionId
    ? `user_id.eq.${user.id},session_id.eq.${sessionId}`
    : `user_id.eq.${user.id}`

  const [balance, analysesRes, referralsRes] = await Promise.all([
    getBalance(user.id),
    serviceClient
      .from('analyses')
      .select('id, created_at, diagnostic')
      .or(orFilter)
      .order('created_at', { ascending: false })
      .limit(20),
    serviceClient
      .from('referrals')
      .select('id, credit_granted')
      .eq('referrer_id', user.id),
  ])

  const analyses = analysesRes.data ?? []
  const referrals = referralsRes.data ?? []
  const referralConverted = referrals.filter((r) => r.credit_granted).length

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-bold text-lg tracking-tight">Alinhei</Link>
          <div className="flex items-center gap-4">
            <Link href="/analise" className="text-sm text-muted-foreground hover:text-foreground">
              Nova análise
            </Link>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        {/* Saldo */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Coins className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Créditos disponíveis</p>
            <p className="text-3xl font-bold">{balance}</p>
          </div>
          {balance === 0 && (
            <Link
              href={analyses[0] ? `/analise/${analyses[0].id}` : '/analise'}
              className="ml-auto text-sm px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Comprar créditos
            </Link>
          )}
        </div>

        {/* Indicação */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-1">
            <Gift className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Indique e ganhe</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Compartilhe seu link. Quando um amigo comprar pela primeira vez, você ganha 1 crédito grátis.
          </p>
          <ReferralCopy userId={user.id} />
          {referrals.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3">
              {referrals.length} {referrals.length === 1 ? 'pessoa indicada' : 'pessoas indicadas'}
              {referralConverted > 0 && ` · ${referralConverted} ${referralConverted === 1 ? 'converteu' : 'converteram'} (${referralConverted} crédito${referralConverted > 1 ? 's' : ''} ganho${referralConverted > 1 ? 's' : ''})`}
            </p>
          )}
        </div>

        {/* Histórico de análises */}
        <div>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            Suas análises
          </h2>

          {analyses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <p className="text-muted-foreground text-sm">Nenhuma análise ainda.</p>
              <Link
                href="/analise"
                className="mt-3 inline-block text-sm px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                Fazer primeira análise
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {analyses.map((analysis) => {
                const diagnostic = analysis.diagnostic as {
                  nota_aderencia?: number
                  preview_publico?: { nota?: number; ponto_forte_destaque?: string }
                } | null

                const nota = diagnostic?.nota_aderencia ?? diagnostic?.preview_publico?.nota
                const cargo = diagnostic?.preview_publico?.ponto_forte_destaque ?? 'Análise de currículo'
                const date = new Date(analysis.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: '2-digit', year: 'numeric'
                })

                return (
                  <Link
                    key={analysis.id}
                    href={`/analise/${analysis.id}`}
                    className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-5 py-4 hover:border-gray-300 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">
                          {cargo}
                        </p>
                        <p className="text-xs text-muted-foreground">{date}</p>
                      </div>
                    </div>
                    {nota !== undefined && (
                      <span className={[
                        'text-sm font-bold px-2 py-0.5 rounded-full',
                        nota >= 70 ? 'bg-green-100 text-green-700' :
                        nota >= 50 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      ].join(' ')}>
                        {nota}%
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
