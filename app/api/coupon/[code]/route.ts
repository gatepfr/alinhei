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

  if (!coupon) {
    return NextResponse.json(
      { ok: false, error: { code: 'NOT_FOUND', message: 'Cupom não encontrado' } },
      { status: 404 }
    )
  }

  if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
    return NextResponse.json(
      { ok: false, error: { code: 'EXPIRED', message: 'Cupom expirado' } },
      { status: 422 }
    )
  }

  if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
    return NextResponse.json(
      { ok: false, error: { code: 'EXHAUSTED', message: 'Cupom esgotado' } },
      { status: 422 }
    )
  }

  return NextResponse.json({
    ok: true,
    discount: {
      type: coupon.discount_type as 'percent' | 'fixed',
      value: Number(coupon.discount_value),
    },
  })
}
