# CLAUDE.md — VagaCerta

> Instruções para Claude Code construir e manter este projeto.

## Contexto do projeto

VagaCerta é um SaaS one-shot que analisa currículo + vaga e entrega: diagnóstico, currículo reescrito, carta de apresentação e simulado de entrevista. Modelo freemium com paywall após preview. Pagamento via Mercado Pago (PIX + cartão). Mercado: Brasil, idioma único português brasileiro.

Para detalhes de produto, escopo e métricas, ler `prd.md` antes de qualquer feature nova.

## Stack e versões

- Node.js 20 LTS
- Next.js 14 com App Router e TypeScript estrito
- Tailwind CSS + shadcn/ui (componentes copiados, não dependência)
- Supabase (auth, postgres, storage)
- @anthropic-ai/sdk para chamadas LLM
- mercadopago (SDK oficial Node)
- pdf-parse para ler PDFs de entrada
- @react-pdf/renderer para gerar PDFs de saída
- resend para email transacional
- zod para validação de schemas em todas as rotas API

## Estrutura de pastas

```
vagacerta/
├── CLAUDE.md
├── prd.md
├── prompts.md                    # prompts do sistema, fonte de verdade
├── schema.sql                    # migration inicial Supabase
├── .env.example
├── package.json
├── app/
│   ├── layout.tsx
│   ├── page.tsx                  # landing
│   ├── analise/
│   │   ├── page.tsx              # form de upload
│   │   └── [id]/
│   │       ├── page.tsx          # preview grátis + paywall
│   │       └── completo/page.tsx # entrega após pagamento
│   ├── dashboard/page.tsx
│   ├── login/page.tsx
│   └── api/
│       ├── analyze/route.ts      # gera diagnóstico (preview grátis)
│       ├── generate/route.ts     # gera entregáveis pagos (debita crédito)
│       ├── checkout/route.ts     # cria preferência Mercado Pago
│       ├── webhook/mercadopago/route.ts
│       └── pdf/[generationId]/route.ts  # serve PDF gerado
├── components/
│   ├── upload-form.tsx
│   ├── preview-result.tsx
│   ├── paywall-modal.tsx
│   ├── share-card.tsx            # gera card de LinkedIn com a nota
│   └── ui/                       # shadcn
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # client-side
│   │   └── server.ts             # server-side (com auth helpers)
│   ├── anthropic.ts              # cliente único + helper para JSON
│   ├── prompts.ts                # exporta prompts do prompts.md como constantes
│   ├── pdf-parser.ts
│   ├── pdf-generator.tsx         # JSX do PDF de saída
│   ├── mercadopago.ts            # cria preferência + valida webhook
│   ├── credits.ts                # debit/grant créditos com transação atômica
│   └── analytics.ts              # eventos para Plausible/PostHog
└── supabase/
    └── migrations/
        └── 001_initial.sql       # cópia do schema.sql
```

## Convenções de código

- **TypeScript strict mode**, sem `any` exceto para libs sem tipos.
- **Server components por padrão**, `'use client'` só onde precisar de estado/efeito.
- **Validação:** toda rota API valida input com zod antes de qualquer lógica.
- **Erros:** sempre retornar `{ ok: false, error: { code, message } }` em vez de jogar exception pro cliente.
- **Comentários:** apenas para explicar "porquê", nunca "o quê".
- **Nomes:** variáveis e funções em inglês, strings de UI em português.
- **Datas:** sempre UTC no banco, conversão para America/Sao_Paulo só na exibição.
- **Limite de input:** currículo max 15.000 caracteres, vaga max 5.000 caracteres. Cortar e avisar.

## Variáveis de ambiente

Ver `.env.example`. Em produção, configurar na Vercel. Nunca commitar `.env.local`.

## Banco de dados

Schema completo em `schema.sql`. Tabelas principais:

- `auth.users` (gerenciada pelo Supabase Auth)
- `credits` — saldo de créditos do usuário, com expiração
- `analyses` — preview grátis (não consome crédito)
- `generations` — entrega completa paga (consome 1 crédito)
- `payments` — registros de pagamento Mercado Pago

Sempre usar Row Level Security (RLS). Nenhuma query feita direto no client sem RLS configurado.

## LLM e prompts

- Modelo: `claude-haiku-4-5-20251001` para todas as gerações (custo/qualidade ótimo).
- Temperature: 0.3 para diagnóstico, 0.5 para currículo, 0.7 para carta.
- Max tokens: 4000 para análise completa.
- **Todos os prompts vivem em `prompts.md`** e são importados como constantes em `lib/prompts.ts`. Editar prompts é editar `prompts.md` primeiro, depois sincronizar.
- Para JSON: pedir explicitamente "responda APENAS com JSON válido, sem markdown" e validar com zod no parse.
- Sempre logar token usage em produção para acompanhar custo por análise.

## Mercado Pago

- Usar Checkout Pro (preferência) no V1. Migrar para Checkout Transparente no V2 se conversão exigir.
- Produtos (SKUs): `single` (R$ 9,90 / 1 crédito), `pack3` (R$ 19,90 / 3 créditos), `pack10` (R$ 49,90 / 10 créditos).
- Webhook precisa: validar assinatura, checar idempotência por `mp_payment_id`, conceder créditos em transação atômica com o registro de pagamento.
- Em sandbox usar credenciais de teste; produção exige conta verificada do Mercado Pago.

## Sprints

Construir nesta ordem. Cada sprint termina em produção (mesmo que sem usuários).

### Sprint 1 — análise grátis funcionando
- [ ] Setup Next.js + Tailwind + shadcn
- [ ] Landing simples com hero + CTA + 3 prints de "como funciona"
- [ ] Form de upload (PDF ou texto colado) + campo de vaga
- [ ] Rota `/api/analyze` chamando Claude Haiku com prompt de diagnóstico
- [ ] Tela de resultado mostrando preview grátis (nota + 1 ponto forte + 1 gap)
- [ ] Deploy na Vercel

### Sprint 2 — paywall e pagamento
- [ ] Auth Supabase (email + Google)
- [ ] Tabelas `credits`, `payments`, `generations`
- [ ] Modal de paywall com 3 SKUs
- [ ] Integração Mercado Pago (checkout + webhook)
- [ ] Concessão de crédito via webhook idempotente
- [ ] Polling no client após retorno do checkout (caso webhook atrasar)

### Sprint 3 — entrega completa
- [ ] Rota `/api/generate` que debita 1 crédito e chama 3 prompts em paralelo (currículo, carta, perguntas)
- [ ] Tela `/analise/[id]/completo` mostrando tudo
- [ ] Geração de PDF com @react-pdf/renderer
- [ ] Email transacional com PDF anexo via Resend
- [ ] Botão "Compartilhar no LinkedIn" gerando OG image dinâmica

### Sprint 4 — refinos e crescimento
- [ ] Dashboard do usuário (histórico)
- [ ] Cupom de desconto
- [ ] Indicação ganha crédito (link único + validação)
- [ ] Eventos de analytics em todas as etapas do funil
- [ ] A/B test no copy do paywall

## Coisas a evitar

- Não usar `useEffect` para fetch inicial — usar Server Components ou route handlers.
- Não armazenar PDF original do currículo no Storage por mais de 30 dias (LGPD).
- Não confiar em metadata do PDF para nome/email do candidato — extrair do texto.
- Não fazer chamada ao Anthropic direto do client. Sempre via API route do Next.
- Não fazer webhook do Mercado Pago confiar no body sem validar assinatura.
- Não inserir o `MERCADOPAGO_ACCESS_TOKEN` em código client-side.

## Comandos comuns

```bash
# rodar local
pnpm dev

# rodar migrations no Supabase local
supabase migration up

# typecheck antes de qualquer commit
pnpm typecheck

# rodar lint
pnpm lint
```
