import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { grantCredits } from '@/lib/credits'

const RequestSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().min(-100).max(100).refine(n => n !== 0, 'Amount cannot be zero'),
  source: z.string().min(1).default('admin:grant'),
})

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  const adminEmails = (process.env.ADMIN_EMAIL ?? '').split(',').map(e => e.trim().toLowerCase())
  return adminEmails.includes(email.toLowerCase())
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ ok: false, error: 'Não autorizado.' }, { status: 403 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ ok: false, error: 'JSON inválido.' }, { status: 400 })
  }

  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { userId, amount, source } = parsed.data

  // Verificar que o usuário existe via auth admin (credits table may be empty for new users)
  const serviceClient = createServiceClient()
  const { data: authUser } = await serviceClient.auth.admin.getUserById(userId)
  if (!authUser.user) {
    return NextResponse.json({ ok: false, error: 'Usuário não encontrado.' }, { status: 404 })
  }

  try {
    await grantCredits(userId, amount, source, crypto.randomUUID(), null)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/give-credits]', err)
    return NextResponse.json({ ok: false, error: 'Erro ao conceder créditos.' }, { status: 500 })
  }
}
