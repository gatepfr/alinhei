-- Migration 006: Atomic coupon use increment
-- Prevents race condition when two webhooks apply the same coupon concurrently.

create or replace function public.increment_coupon_uses(coupon_id uuid)
returns void
language sql
security definer
as $$
  update public.coupons
  set uses_count = uses_count + 1
  where id = coupon_id;
$$;
