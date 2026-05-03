import Link from 'next/link'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/logout-button'
import { UserRow } from './user-row'
import { CouponsSection } from './coupons-section'
import { PriceEditor } from './price-editor'
import { DEFAULT_PRODUCTS } from '@/lib/products'
import { Users, BarChart2, Coins, FileText, Settings } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin — Alinhei' }

function adminClient() {
  return createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function AdminPage() {
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
    service.from('payments').select('user_id, amount_brl_cents, status, credits_granted'),
    service.from('credits').select('user_id, amount, expires_at'),
    service.from('coupons').select('*').order('created_at', { ascending: false }),
    service.from('settings').select('value').eq('id', 'prices').maybeSingle(),
  ])

  const currentPrices = (settingsRes?.value as any) || DEFAULT_PRODUCTS

  // Compute per-user balance from credits rows
  const now = new Date()
  const balanceByUser = new Map<string, number>()
  for (const row of creditRows ?? []) {
    const cur = balanceByUser.get(row.user_id) ?? 0
    if (row.amount > 0 && row.expires_at && new Date(row.expires_at) <= now) continue
    balanceByUser.set(row.user_id, cur + row.amount)
  }

  // Analysis count per user
  const analysisByUser = new Map<string, number>()
  for (const a of analyses ?? []) {
    if (a.user_id) analysisByUser.set(a.user_id, (analysisByUser.get(a.user_id) ?? 0) + 1)
  }

  // Payment count per user
  const paymentByUser = new Map<string, number>()
  for (const p of payments ?? []) {
    if (p.status === 'approved') paymentByUser.set(p.user_id, (paymentByUser.get(p.user_id) ?? 0) + 1)
  }

  // Stats
  const totalRevenueCents = (payments ?? [])
    .filter(p => p.status === 'approved')
    .reduce((sum, p) => sum + (p.amount_brl_cents ?? 0), 0)

  const userRows = (users ?? []).map(u => ({
    id: u.id,
    email: u.email ?? '(sem email)',
    createdAt: new Date(u.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    balance: Math.max(0, balanceByUser.get(u.id) ?? 0),
    analysisCount: analysisByUser.get(u.id) ?? 0,
    paymentCount: paymentByUser.get(u.id) ?? 0,
  })).sort((a, b) => b.paymentCount - a.paymentCount || b.analysisCount - a.analysisCount)

  const stats = [
    { label: 'Usuários', value: users?.length ?? 0, icon: Users },
    { label: 'Análises', value: analyses?.length ?? 0, icon: FileText },
    { label: 'Pagamentos', value: (payments ?? []).filter(p => p.status === 'approved').length, icon: BarChart2 },
    { label: 'Receita', value: `R$ ${(totalRevenueCents / 100).toFixed(2)}`, icon: Coins },
  ]

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/60 bg-background/80 backdrop-blur-md px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-bold text-lg tracking-tight">Alinhei</Link>
            <span className="text-muted-foreground text-sm">/</span>
            <span className="text-sm font-medium text-muted-foreground">Admin</span>
          </div>
          <LogoutButton />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-12">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(s => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <s.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{s.label}</p>
                <p className="font-bold text-lg leading-tight">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Preços */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-display font-bold text-xl">Configurações de Venda</h2>
          </div>
          <PriceEditor initialPrices={currentPrices} />
        </section>

        {/* Usuários */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-display font-bold text-xl">Usuários</h2>
          </div>
          {userRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum usuário ainda.</p>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
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
