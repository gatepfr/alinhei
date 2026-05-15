// app/api/coupon/[code]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.trim().toUpperCase()
  if (!code) {
    return NextResponse.json(
      { ok: false, error: { code: 'INVALID_INPUT', message: 'Código inválido' } },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()
  const { data: coupon } = await supabase
    .from('coupons')
    .select('discount_type, discount_value, max_uses, uses_count, valid_until, is_active')
    .eq('is_active', true)
    .ilike('code', code)
    .maybeSingle()

  // Use a single generic error for all invalid states to prevent coupon enumeration
  const genericInvalid = NextResponse.json(
    { ok: false, error: { code: 'INVALID_COUPON', message: 'Cupom inválido ou expirado' } },
    { status: 422 }
  )

  if (!coupon) {
    return genericInvalid
  }

  if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
    return genericInvalid
  }

  if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
    return genericInvalid
  }

  return NextResponse.json({
    ok: true,
    discount: {
      type: coupon.discount_type as 'percent' | 'fixed',
      value: Number(coupon.discount_value),
    },
  })
}
