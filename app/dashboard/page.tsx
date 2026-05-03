// app/dashboard/page.tsx
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getBalance } from '@/lib/credits'
import { generateReferralCode } from '@/lib/referral'
import { getDynamicProducts } from '@/lib/mercadopago'
import { ReferralCopy } from './referral-copy'
import { CRMBoard } from './crm-board'
import { DashboardPurchaseButton } from './purchase-button'
import { MainNav } from '@/components/main-nav'
import { Gift, Coins, FileText, Plus, ArrowRight, Sparkles } from 'lucide-react'

export const metadata = { title: 'Dashboard — Alinhei' }

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const serviceClient = createServiceClient()
  const sessionId = cookies().get('session_id')?.value
  
  const adminEmails = (process.env.ADMIN_EMAIL ?? '').split(',').map(e => e.trim().toLowerCase())
  const isAdmin = user.email ? adminEmails.includes(user.email.toLowerCase()) : false

  const orFilter = sessionId
    ? `user_id.eq.${user.id},session_id.eq.${sessionId}`
    : `user_id.eq.${user.id}`

  const [balance, analysesRes, referralsRes, profileRes, products] = await Promise.all([
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
      .maybeSingle(),
    getDynamicProducts(),
  ])

  let referralCode = profileRes.data?.referral_code

  if (!referralCode) {
    referralCode = generateReferralCode()
    const { error } = await serviceClient
      .from('profiles')
      .insert({ user_id: user.id, referral_code: referralCode })
    
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
      <MainNav isAdmin={isAdmin} />

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col gap-1 animate-fade-up">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Olá! 👋
          </h1>
          <p className="text-muted-foreground">
            Acompanhe suas candidaturas e gerencie seus créditos.
          </p>
        </div>

        <div className="grid sm:grid-cols-5 gap-6">
          {/* Saldo - Col 2 */}
          <div className="sm:col-span-2 bg-card rounded-2xl border border-border p-6 flex flex-col justify-between gap-4 animate-fade-up shadow-sm group hover:border-primary/20 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Coins className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Saldo</p>
                <p className="font-display text-3xl font-bold">{balance}</p>
              </div>
            </div>
            <DashboardPurchaseButton balance={balance} products={products} />
          </div>

          {/* Indicação - Col 3 */}
          <div className="sm:col-span-3 bg-card rounded-2xl border border-border p-6 animate-fade-up delay-100 shadow-sm hover:border-primary/20 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Gift className="w-4 h-4 text-amber-500" />
              </div>
              <h2 className="font-display font-bold text-sm">Indique e ganhe</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Ao indicar um amigo que realizar a primeira compra, você ganha <span className="text-foreground font-bold">1 crédito grátis</span>.
            </p>
            <ReferralCopy referralCode={referralCode} />
            {referrals.length > 0 && (
              <div className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <Sparkles className="w-3 h-3 text-amber-500" />
                {referrals.length} {referrals.length === 1 ? 'indicação' : 'indicações'}
                {referralConverted > 0 && ` · ${referralConverted} crédito${referralConverted > 1 ? 's' : ''} ganho${referralConverted > 1 ? 's' : ''}`}
              </div>
            )}
          </div>
        </div>

        {/* Histórico */}
        <div className="animate-fade-up delay-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-500" />
              </div>
              <h2 className="font-display font-bold text-xl">Suas candidaturas</h2>
            </div>
            <Link
              href="/analise"
              className="text-sm font-bold bg-primary/10 text-primary px-4 py-2 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova análise
            </Link>
          </div>

          {analyses.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center border-dashed">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <p className="text-muted-foreground text-sm mb-6">Nenhuma análise realizada ainda.</p>
              <Link
                href="/analise"
                className="inline-flex items-center gap-2 text-sm font-bold bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
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
