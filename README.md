# VagaCerta

> Avaliador de currículo + carta de apresentação + simulado de entrevista. Mercado: Brasil.

## Documentação interna

- [`prd.md`](./prd.md) — visão de produto, fluxo, métricas, escopo
- [`CLAUDE.md`](./CLAUDE.md) — instruções para Claude Code (stack, estrutura, convenções, sprints)
- [`prompts.md`](./prompts.md) — prompts do sistema (fonte de verdade)
- [`schema.sql`](./schema.sql) — schema inicial do Supabase

## Quick start

```bash
# 1. Inicializar projeto Next.js (se ainda não criado)
pnpm create next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias='@/*'

# 2. Instalar dependências do projeto
pnpm add @anthropic-ai/sdk @supabase/supabase-js @supabase/ssr mercadopago resend zod pdf-parse @react-pdf/renderer

pnpm add -D @types/pdf-parse

# 3. Configurar shadcn/ui
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card input textarea dialog toast progress

# 4. Copiar variáveis de ambiente
cp .env.example .env.local
# (preencher com chaves reais)

# 5. Rodar migration no Supabase
# - Cole o conteúdo de schema.sql no SQL Editor do dashboard
# - OU use a CLI: supabase migration up

# 6. Desenvolvimento local
pnpm dev
```

## Como pedir features ao Claude Code

Abra a sessão na raiz do projeto. O Claude Code vai ler `CLAUDE.md` automaticamente.

Exemplos de prompts pra Sprint 1:

> "Implemente o Sprint 1 conforme `CLAUDE.md`. Comece pela landing page seguindo as práticas do shadcn e o copy do `prd.md` seção 5."

> "Crie a rota `/api/analyze` usando o prompt 1 de `prompts.md`. Valide input com zod, chame Claude Haiku, valide JSON de saída com zod, salve em `analyses` e retorne só o `preview_publico`."

> "Crie o componente `<UploadForm />` com 2 abas (PDF / texto), usando shadcn. Limites: 15.000 chars currículo, 5.000 chars vaga, com contador visível."

## Próximos passos antes de codar

- [ ] Decidir nome final do produto (VagaCerta é placeholder).
- [ ] Comprar domínio e configurar DNS.
- [ ] Criar conta no Supabase, Mercado Pago (sandbox + produção), Resend, Vercel.
- [ ] Subir as chaves no `.env.local` e na Vercel.
- [ ] Rodar migration no Supabase.
- [ ] Iniciar Sprint 1 com o Claude Code.
