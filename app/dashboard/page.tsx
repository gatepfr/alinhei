// app/dashboard/page.tsx
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getBalance } from '@/lib/credits'
import { generateReferralCode } from '@/lib/referral'
import { LogoutButton } from '@/components/logout-button'
import { ReferralCopy } from './referral-copy'
import { CRMBoard } from './crm-board'
import { Gift, Coins, FileText, Plus, ArrowRight } from 'lucide-react'

export const metadata = { title: 'Dashboard — Alinhei' }

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const serviceClient = createServiceClient()
  const sessionId = cookies().get('session_id')?.value

  const orFilter = sessionId
    ? `user_id.eq.${user.id},session_id.eq.${sessionId}`
    : `user_id.eq.${user.id}`

  const [balance, analysesRes, referralsRes, profileRes] = await Promise.all([
    getBalance(user.id),
    serviceClient
      .from('analyses')
      .select('id, created_at, diagnostic, status, job_title, company_name')
      .or(orFilter)
      .order('created_at', { ascending: false })
      .limit(20),
    serviceClient
      .from('referrals')
      .select('id, credit_granted')
      .eq('referrer_id', user.id),
    serviceClient
      .from('profiles')
      .select('referral_code')
      .eq('user_id', user.id)
      .single(),
  ])

  let referralCode = profileRes.data?.referral_code

  if (!referralCode) {
    referralCode = generateReferralCode()
    const { error } = await serviceClient
      .from('profiles')
      .insert({ user_id: user.id, referral_code: referralCode })
    
    // Se falhar por colisão (raro), tentamos mais uma vez
    if (error) {
      referralCode = generateReferralCode()
      await serviceClient
        .from('profiles')
        .insert({ user_id: user.id, referral_code: referralCode })
    }
  }

  const analyses = analysesRes.data ?? []
  const referrals = referralsRes.data ?? []
  const referralConverted = referrals.filter((r) => r.credit_granted).length

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/60 bg-background/80 backdrop-blur-md px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-lg tracking-tight">Alinhei</Link>
          <div className="flex items-center gap-4">
            <Link href="/analise" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Nova análise
            </Link>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">

        {/* Saldo */}
        <div className="bg-card rounded-2xl border border-border p-6 flex items-center gap-4 animate-fade-up">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Créditos disponíveis</p>
            <p className="font-display text-3xl font-bold">{balance}</p>
          </div>
          <Link
            href={analyses[0] ? `/analise/${analyses[0].id}?buy=true` : '/analise'}
            className="ml-auto flex items-center gap-2 text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {balance === 0 ? 'Comprar créditos' : 'Comprar mais'}
          </Link>
        </div>

        {/* Indicação */}
        <div className="bg-card rounded-2xl border border-border p-6 animate-fade-up delay-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Gift className="w-3.5 h-3.5 text-primary" />
            </div>
            <h2 className="font-display font-semibold">Indique e ganhe</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4 ml-9">
            Compartilhe seu link. Quando um amigo comprar pela primeira vez, você ganha 1 crédito grátis.
          </p>
          <ReferralCopy referralCode={referralCode} />
          {referrals.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3 ml-9">
              {referrals.length} {referrals.length === 1 ? 'pessoa indicada' : 'pessoas indicadas'}
              {referralConverted > 0 && ` · ${referralConverted} ${referralConverted === 1 ? 'converteu' : 'converteram'} (${referralConverted} crédito${referralConverted > 1 ? 's' : ''} ganho${referralConverted > 1 ? 's' : ''})`}
            </p>
          )}
        </div>

        {/* Histórico */}
        <div className="animate-fade-up delay-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Suas análises
            </h2>
            <Link
              href="/analise"
              className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1 font-medium"
            >
              Nova análise <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {analyses.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-10 text-center">
              <p className="text-muted-foreground text-sm mb-4">Nenhuma análise ainda.</p>
              <Link
                href="/analise"
                className="inline-flex items-center gap-2 text-sm font-semibold bg-primary text-primary-foreground px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Fazer primeira análise
              </Link>
            </div>
          ) : (
            <CRMBoard analyses={analyses as any} />
          )}
        </div>

      </div>
    </div>
  )
}
