import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserRow } from './user-row'
import { CouponsSection } from './coupons-section'
import { PriceEditor } from './price-editor'
import { MainNav } from '@/components/main-nav'
import { DEFAULT_PRODUCTS, type Products } from '@/lib/products'
import { Users, BarChart2, Coins, FileText, Settings, TrendingUp, Receipt } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin — Alinhei' }

function adminClient() {
  return createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const SKU_LABELS: Record<string, string> = {
  single: '1 crédito',
  pack3: 'Pack 3',
  pack10: 'Pack 10',
}

function fmtBRL(cents: number) {
  return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default async function AdminPage() {
  // Server-side admin guard — defence-in-depth beyond middleware
  const { data: { user: currentUser } } = await createClient().auth.getUser()
  const adminEmails = (process.env.ADMIN_EMAIL ?? '').split(',').map(e => e.trim().toLowerCase())
  if (!currentUser?.email || !adminEmails.includes(currentUser.email.toLowerCase())) {
    redirect('/')
  }

  const supabase = adminClient()
  const service = createServiceClient()

  const [
    { data: { users } },
    { data: analyses },
    { data: payments },
    { data: creditRows },
    { data: coupons },
    { data: settingsRes },
  ] = await Promise.all([
    supabase.auth.admin.listUsers({ perPage: 200 }),
    service.from('analyses').select('user_id').not('user_id', 'is', null),
    service.from('payments').select('id, user_id, amount_brl_cents, status, credits_granted, product_sku, created_at, payer_email'),
    service.from('credits').select('user_id, amount, expires_at'),
    service.from('coupons').select('*').order('created_at', { ascending: false }),
    service.from('settings').select('value').eq('id', 'prices').maybeSingle(),
  ])

  const currentPrices = (settingsRes?.value as Products) || DEFAULT_PRODUCTS

  // Balance por usuário
  const now = new Date()
  const balanceByUser = new Map<string, number>()
  for (const row of creditRows ?? []) {
    const cur = balanceByUser.get(row.user_id) ?? 0
    if (row.amount > 0 && row.expires_at && new Date(row.expires_at) <= now) continue
    balanceByUser.set(row.user_id, cur + row.amount)
  }

  // Análises por usuário
  const analysisByUser = new Map<string, number>()
  for (const a of analyses ?? []) {
    if (a.user_id) analysisByUser.set(a.user_id, (analysisByUser.get(a.user_id) ?? 0) + 1)
  }

  const approvedPayments = (payments ?? []).filter(p => p.status === 'approved')

  // Receita e pagamentos por usuário
  const paymentCountByUser = new Map<string, number>()
  const revenueByUser = new Map<string, number>()
  for (const p of approvedPayments) {
    paymentCountByUser.set(p.user_id, (paymentCountByUser.get(p.user_id) ?? 0) + 1)
    revenueByUser.set(p.user_id, (revenueByUser.get(p.user_id) ?? 0) + (p.amount_brl_cents ?? 0))
  }

  // Receita total e por SKU
  const totalRevenueCents = approvedPayments.reduce((sum, p) => sum + (p.amount_brl_cents ?? 0), 0)

  const revenueBySku = new Map<string, { count: number; cents: number }>()
  for (const p of approvedPayments) {
    const sku = p.product_sku ?? 'unknown'
    const cur = revenueBySku.get(sku) ?? { count: 0, cents: 0 }
    revenueBySku.set(sku, { count: cur.count + 1, cents: cur.cents + (p.amount_brl_cents ?? 0) })
  }

  // Últimos 15 pagamentos
  const recentPayments = [...approvedPayments]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 15)
    .map(p => ({
      ...p,
      email: (users ?? []).find(u => u.id === p.user_id)?.email ?? p.payer_email ?? '—',
    }))

  const userRows = (users ?? []).map(u => ({
    id: u.id,
    email: u.email ?? '(sem email)',
    createdAt: new Date(u.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    balance: Math.max(0, balanceByUser.get(u.id) ?? 0),
    analysisCount: analysisByUser.get(u.id) ?? 0,
    paymentCount: paymentCountByUser.get(u.id) ?? 0,
    revenueCents: revenueByUser.get(u.id) ?? 0,
  })).sort((a, b) => b.revenueCents - a.revenueCents || b.analysisCount - a.analysisCount)

  const stats = [
    { label: 'Usuários', value: String(users?.length ?? 0), icon: Users, sub: `${userRows.filter(u => u.paymentCount > 0).length} pagantes` },
    { label: 'Análises', value: String(analyses?.length ?? 0), icon: FileText, sub: 'todas as análises' },
    { label: 'Pagamentos', value: String(approvedPayments.length), icon: BarChart2, sub: 'aprovados' },
    { label: 'Receita', value: fmtBRL(totalRevenueCents), icon: Coins, sub: `${(totalRevenueCents / Math.max(approvedPayments.length, 1) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} por venda` },
  ]

  return (
    <div className="min-h-screen bg-background">
      <MainNav isAdmin={true} />

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">

        {/* Header */}
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Superadmin</p>
          <h1 className="font-display text-2xl font-bold">Painel de Controle</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(s => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <s.icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</p>
              </div>
              <p className="font-display font-bold text-2xl leading-tight">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Receita por produto */}
        {revenueBySku.size > 0 && (
          <section>
            <SectionHeader icon={<TrendingUp className="w-4 h-4" />} title="Receita por Produto" />
            <div className="grid sm:grid-cols-3 gap-3">
              {(['single', 'pack3', 'pack10'] as const).map(sku => {
                const data = revenueBySku.get(sku) ?? { count: 0, cents: 0 }
                const pct = totalRevenueCents > 0 ? Math.round((data.cents / totalRevenueCents) * 100) : 0
                return (
                  <div key={sku} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">{SKU_LABELS[sku] ?? sku}</span>
                      <span className="text-xs text-muted-foreground">{data.count} venda{data.count !== 1 ? 's' : ''}</span>
                    </div>
                    <p className="font-display font-bold text-xl mb-2">{fmtBRL(data.cents)}</p>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{pct}% da receita total</p>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Pagamentos recentes */}
        {recentPayments.length > 0 && (
          <section>
            <SectionHeader icon={<Receipt className="w-4 h-4" />} title="Pagamentos Recentes" />
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Produto</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((p, i) => (
                    <tr key={p.id} className={`border-b border-border/50 last:border-0 ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                      <td className="px-4 py-2.5 text-xs truncate max-w-[180px] font-medium">{p.email}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground hidden sm:table-cell">
                        <span className="bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                          {SKU_LABELS[p.product_sku ?? ''] ?? p.product_sku ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-right font-semibold text-emerald-400">{fmtBRL(p.amount_brl_cents ?? 0)}</td>
                      <td className="px-4 py-2.5 text-xs text-right text-muted-foreground hidden sm:table-cell">
                        {new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Preços */}
        <section>
          <SectionHeader icon={<Settings className="w-4 h-4" />} title="Configurações de Venda" />
          <PriceEditor initialPrices={currentPrices} />
        </section>

        {/* Usuários */}
        <section>
          <SectionHeader icon={<Users className="w-4 h-4" />} title={`Usuários (${userRows.length})`} />
          {userRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum usuário ainda.</p>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="border-b border-border bg-secondary/30 hidden sm:grid grid-cols-[1fr_80px_72px_72px_100px_72px] px-4 py-2">
                {['Email', 'Saldo', 'Análises', 'Pgtos', 'Receita', ''].map(h => (
                  <p key={h} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</p>
                ))}
              </div>
              {userRows.map(u => (
                <UserRow key={u.id} user={u} />
              ))}
            </div>
          )}
        </section>

        {/* Cupons */}
        <CouponsSection coupons={(coupons ?? []) as Parameters<typeof CouponsSection>[0]['coupons']} />

      </div>
    </div>
  )
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="text-primary">{icon}</div>
      <h2 className="font-display font-bold text-lg">{title}</h2>
    </div>
  )
}
