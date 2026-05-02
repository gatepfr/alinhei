import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const RequestSchema = z.object({
  code: z.string().min(2).max(30).regex(/^[A-Z0-9_-]+$/, 'Código deve conter apenas letras maiúsculas, números, _ ou -'),
  discountType: z.enum(['percent', 'fixed']),
  discountValue: z.number().positive(),
  maxUses: z.number().int().positive().nullable(),
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

  const { code, discountType, discountValue, maxUses } = parsed.data
  const serviceClient = createServiceClient()

  const { error } = await serviceClient.from('coupons').insert({
    code,
    discount_type: discountType,
    discount_value: discountValue,
    max_uses: maxUses,
    is_active: true,
  })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ ok: false, error: 'Código já existe.' }, { status: 409 })
    }
    console.error('[admin/create-coupon]', error)
    return NextResponse.json({ ok: false, error: 'Erro ao criar cupom.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
