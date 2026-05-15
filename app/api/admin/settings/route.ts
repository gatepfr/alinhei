import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  const adminEmails = (process.env.ADMIN_EMAIL ?? '').split(',').map(e => e.trim().toLowerCase())
  return adminEmails.includes(email.toLowerCase())
}

const ProductEntrySchema = z.object({
  label: z.string().min(1).max(200),
  price: z.number().positive(),
  credits: z.number().int().positive(),
  expirationDays: z.number().int().positive(),
})

const SettingsSchema = z.object({
  // Allowlist of valid setting keys — prevents arbitrary row writes
  id: z.enum(['prices']),
  value: z.record(ProductEntrySchema),
})

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

  const parsed = SettingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.errors[0].message },
      { status: 400 }
    )
  }

  const { id, value } = parsed.data

  const serviceClient = createServiceClient()
  const { error } = await serviceClient
    .from('settings')
    .upsert({ id, value, updated_at: new Date().toISOString() })

  if (error) {
    console.error('[admin/settings] Error:', error)
    return NextResponse.json({ ok: false, error: 'Erro interno ao salvar configuração.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
