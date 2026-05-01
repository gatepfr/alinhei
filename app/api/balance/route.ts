// app/api/balance/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBalance } from '@/lib/credits'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED' } },
      { status: 401 }
    )
  }

  const balance = await getBalance(user.id)
  return NextResponse.json({ ok: true, balance })
}
