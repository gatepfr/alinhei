-- Migration 003: Referral Codes
create table public.profiles (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  referral_code   char(8) unique not null,
  created_at      timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "users read own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

-- index for fast lookup by referral_code
create index profiles_referral_code_idx on public.profiles(referral_code);
