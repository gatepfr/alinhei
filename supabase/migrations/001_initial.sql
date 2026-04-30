-- VagaCerta — Migration 001 (initial schema)
-- Roda no Supabase SQL Editor ou via supabase CLI: supabase migration up
--
-- Convenções:
--   - Todas as tabelas têm RLS ativado.
--   - Usuários só leem/escrevem suas próprias linhas.
--   - Webhooks e jobs server-side usam service_role key, que bypassa RLS.

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists pgcrypto;

-- ============================================================
-- CREDITS
-- Saldo de créditos do usuário, com expiração.
-- Cada compra cria 1 linha. Débito é uma nova linha negativa
-- (event-sourced) para auditoria — ver função debit_credit().
-- ============================================================
create table public.credits (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  amount          integer not null,                -- positivo = compra, negativo = débito
  expires_at      timestamptz,                     -- null em débitos
  source          text not null,                   -- 'purchase:single' | 'purchase:pack3' | 'purchase:pack10' | 'referral' | 'debit:generation'
  reference_id    uuid,                            -- id de payments (compra) ou generations (débito)
  created_at      timestamptz not null default now()
);

create index credits_user_id_idx on public.credits(user_id);
create index credits_expires_at_idx on public.credits(expires_at) where amount > 0;

alter table public.credits enable row level security;

create policy "users read own credits"
  on public.credits for select
  using (auth.uid() = user_id);

-- writes só via service role (webhook MP / rota generate)

-- ============================================================
-- ANALYSES
-- Análise grátis (preview). Não consome crédito.
-- Pode existir sem user_id (anônimo, antes do login).
-- ============================================================
create table public.analyses (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete set null,
  session_id        text,                           -- cookie do usuário anônimo
  curriculo_text    text not null,
  curriculo_hash    text not null,                  -- sha256, para cache
  vaga_text         text not null,
  vaga_hash         text not null,
  diagnostic        jsonb not null,                 -- { nota_aderencia, pontos_fortes, gaps_criticos, preview_publico, ... }
  tokens_input      integer,
  tokens_output     integer,
  cost_brl_cents    integer,
  created_at        timestamptz not null default now()
);

create index analyses_user_id_idx on public.analyses(user_id);
create index analyses_session_id_idx on public.analyses(session_id);
create index analyses_hash_idx on public.analyses(curriculo_hash, vaga_hash);

alter table public.analyses enable row level security;

create policy "users read own analyses"
  on public.analyses for select
  using (auth.uid() = user_id or session_id = current_setting('request.session_id', true));

-- ============================================================
-- GENERATIONS
-- Entrega completa paga (currículo, carta, perguntas).
-- Consome 1 crédito.
-- ============================================================
create table public.generations (
  id                  uuid primary key default gen_random_uuid(),
  analysis_id         uuid not null references public.analyses(id) on delete restrict,
  user_id             uuid not null references auth.users(id) on delete cascade,
  curriculo_otimizado text,                         -- markdown
  carta               jsonb,                        -- { linkedin, email }
  perguntas           jsonb,                        -- { perguntas: [...] }
  pdf_path            text,                         -- caminho no Supabase Storage
  email_sent_at       timestamptz,
  tokens_input        integer,
  tokens_output       integer,
  cost_brl_cents      integer,
  created_at          timestamptz not null default now()
);

create index generations_user_id_idx on public.generations(user_id);
create index generations_analysis_id_idx on public.generations(analysis_id);

alter table public.generations enable row level security;

create policy "users read own generations"
  on public.generations for select
  using (auth.uid() = user_id);

-- ============================================================
-- PAYMENTS
-- Registro de pagamentos Mercado Pago.
-- Idempotência via mp_payment_id único.
-- ============================================================
create table public.payments (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  mp_preference_id    text,
  mp_payment_id       text unique,                  -- vem do webhook
  status              text not null,                -- 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded'
  product_sku         text not null,                -- 'single' | 'pack3' | 'pack10'
  amount_brl_cents    integer not null,
  credits_granted     integer not null,
  payer_email         text,
  payment_method      text,                         -- 'pix' | 'credit_card' | 'debit_card'
  raw_webhook         jsonb,                        -- payload bruto pra debug
  approved_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index payments_user_id_idx on public.payments(user_id);
create index payments_status_idx on public.payments(status);
create unique index payments_mp_payment_id_idx on public.payments(mp_payment_id) where mp_payment_id is not null;

alter table public.payments enable row level security;

create policy "users read own payments"
  on public.payments for select
  using (auth.uid() = user_id);

-- ============================================================
-- HELPERS
-- ============================================================

-- Saldo atual de créditos (somente positivos não-expirados menos débitos)
create or replace function public.user_credit_balance(p_user_id uuid)
returns integer
language sql
stable
as $$
  select coalesce(sum(amount), 0)::integer
  from public.credits
  where user_id = p_user_id
    and (
      (amount > 0 and (expires_at is null or expires_at > now()))
      or amount < 0
    );
$$;

-- Debita 1 crédito atomicamente. Retorna o id do débito ou null se sem saldo.
create or replace function public.debit_credit(
  p_user_id uuid,
  p_reference_id uuid
)
returns uuid
language plpgsql
as $$
declare
  v_balance integer;
  v_debit_id uuid;
begin
  -- lock pessimista no usuário
  perform pg_advisory_xact_lock(hashtext(p_user_id::text));

  v_balance := public.user_credit_balance(p_user_id);
  if v_balance < 1 then
    return null;
  end if;

  insert into public.credits (user_id, amount, source, reference_id)
  values (p_user_id, -1, 'debit:generation', p_reference_id)
  returning id into v_debit_id;

  return v_debit_id;
end;
$$;

-- Trigger pra updated_at em payments
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();
