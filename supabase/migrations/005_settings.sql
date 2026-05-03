-- Migration 005: Settings
-- Adiciona suporte a configurações dinâmicas no banco de dados.

create table if not exists public.settings (
  id      text primary key,
  value   jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

create policy "anyone can read settings"
  on public.settings for select
  using (true);

-- writes só via service role (admin)

-- Inserir preços padrão
insert into public.settings (id, value)
values ('prices', '{
  "single": { "label": "1 análise completa", "price": 9.90, "credits": 1, "expirationDays": 30 },
  "pack3": { "label": "3 análises completas", "price": 19.90, "credits": 3, "expirationDays": 30 },
  "pack10": { "label": "10 análises completas", "price": 49.90, "credits": 10, "expirationDays": 90 }
}')
on conflict (id) do nothing;
