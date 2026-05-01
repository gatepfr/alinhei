-- Sprint 4: coupons + referrals

-- ============================================================
-- COUPONS
-- ============================================================
create table public.coupons (
  id              uuid primary key default gen_random_uuid(),
  code            text not null,
  discount_type   text not null check (discount_type in ('percent', 'fixed')),
  discount_value  numeric not null check (discount_value > 0),
  max_uses        integer,                    -- null = ilimitado
  uses_count      integer not null default 0,
  valid_until     timestamptz,               -- null = nunca expira
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

-- Case-insensitive unique index no código
create unique index coupons_code_idx on public.coupons(lower(code));

alter table public.coupons enable row level security;
-- Sem política pública — apenas service role acessa

-- ============================================================
-- REFERRALS
-- ============================================================
create table public.referrals (
  id              uuid primary key default gen_random_uuid(),
  referrer_id     uuid not null references auth.users(id) on delete cascade,
  referred_id     uuid not null references auth.users(id) on delete cascade,
  credit_granted  boolean not null default false,
  created_at      timestamptz not null default now(),
  constraint referrals_referred_unique unique (referred_id),
  constraint referrals_no_self_referral check (referrer_id != referred_id)
);

create index referrals_referrer_id_idx on public.referrals(referrer_id);
create index referrals_referred_id_idx on public.referrals(referred_id) where credit_granted = false;

alter table public.referrals enable row level security;

create policy "users read own referrals"
  on public.referrals for select
  using (auth.uid() = referrer_id);
