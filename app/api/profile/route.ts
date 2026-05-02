import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  const meta = user.user_metadata ?? {}
  return NextResponse.json({
    ok: true,
    profile: {
      email: user.email,
      full_name: meta.full_name ?? null,
      phone: meta.phone ?? null,
      linkedin_url: meta.linkedin_url ?? null,
      city: meta.city ?? null,
    },
  })
}

const PatchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().min(1).max(50).optional(),
  linkedin_url: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
})

export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ ok: false, error: { code: 'INVALID_JSON' } }, { status: 400 })
  }

  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0].message } },
      { status: 400 }
    )
  }

  const { name, phone, linkedin_url, city } = parsed.data
  const updates: Record<string, string> = {}
  if (name) updates.full_name = name
  if (phone) updates.phone = phone
  if (linkedin_url !== undefined) updates.linkedin_url = linkedin_url
  if (city !== undefined) updates.city = city

  if (Object.keys(updates).length > 0) {
    const serviceClient = createServiceClient()
    await serviceClient.auth.admin.updateUserById(user.id, {
      user_metadata: { ...(user.user_metadata ?? {}), ...updates },
    })
  }

  return NextResponse.json({ ok: true })
}
