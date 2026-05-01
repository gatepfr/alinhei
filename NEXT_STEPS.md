# Próximos passos — VagaCerta

## 1. Ativar Sprint 1 em produção

### 1.1 Criar projeto Supabase
1. Acesse https://supabase.com/dashboard e crie um novo projeto
2. Anote: URL do projeto, `anon key` e `service_role key` (em Settings → API)
3. No SQL Editor, cole e execute o conteúdo de `supabase/migrations/001_initial.sql`

### 1.2 Configurar variáveis de ambiente locais
Edite `.env.local` com os valores reais:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 1.3 Testar localmente
```bash
pnpm dev
```
Fluxo a validar:
- [ ] Landing carrega sem erros
- [ ] Upload/cole currículo + cole vaga → clica "Analisar"
- [ ] Redireciona para `/analise/[id]` com nota, ponto forte e gap
- [ ] Dados aparecem na tabela `analyses` do Supabase

### 1.4 Configurar env vars no Vercel para deploy de produção
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add ANTHROPIC_API_KEY production
vercel env add NEXT_PUBLIC_APP_URL production
# Depois:
vercel --prod
```

---

## 2. Sprint 2 — Paywall e pagamento

### 2.1 Auth Supabase
- Ativar Auth no dashboard (Email + Google OAuth)
- Criar `app/login/page.tsx` com formulário email/senha e botão Google
- Criar middleware (`middleware.ts`) para proteger `/analise/[id]/completo`
- Vincular `analyses.user_id` quando usuário logar após análise anônima

### 2.2 Modal de paywall
- Criar `components/paywall-modal.tsx` com 3 SKUs:
  - R$ 9,90 — 1 crédito
  - R$ 19,90 — 3 créditos
  - R$ 49,90 — 10 créditos
- Abrir modal ao clicar no CTA da página `/analise/[id]`

### 2.3 Integração Mercado Pago
Adicionar ao `.env.local`:
```
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_WEBHOOK_SECRET=...
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
```
- Implementar `app/api/checkout/route.ts` — cria preferência MP e retorna `init_point`
- Implementar `app/api/webhook/mercadopago/route.ts`:
  - Valida assinatura com `validateWebhookSignature` (já em `lib/mercadopago.ts`)
  - Verifica idempotência por `mp_payment_id`
  - Insere em `payments` + chama `grantCredits` em transação atômica
- Configurar URL do webhook no painel Mercado Pago: `https://seu-dominio/api/webhook/mercadopago`
- Polling no client: após retorno do checkout, verificar saldo a cada 3s por até 2min

### 2.4 Verificação de saldo no fluxo
- Após login, checar se usuário tem crédito disponível (`getBalance`)
- Se sim, pular checkout e ir direto para geração

---

## 3. Sprint 3 — Entrega completa

### 3.1 Rota `/api/generate`
- Debita 1 crédito com `debitCredit`
- Dispara 3 prompts em paralelo (`Promise.all`):
  - Currículo otimizado (markdown)
  - Cartas (LinkedIn + email)
  - 5 perguntas STAR
- Salva resultado em `generations`
- Envia email com PDF via Resend

### 3.2 Página `/analise/[id]/completo`
- Exibir diagnóstico completo (3 fortes + 3 gaps)
- Aba currículo reescrito (markdown renderizado + botão copiar)
- Aba cartas (LinkedIn e email)
- Aba perguntas STAR (acordeão)
- Botão "Baixar PDF"
- Botão "Compartilhar no LinkedIn"

### 3.3 Geração de PDF
- Implementar `lib/pdf-generator.tsx` com `@react-pdf/renderer`
- Seções: diagnóstico, currículo, cartas, perguntas
- Servir em `app/api/pdf/[generationId]/route.ts`

### 3.4 Email transacional
```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=ola@vagacerta.com.br
```
- Template HTML simples com link para página completa + PDF anexo

---

## Ordem recomendada

```
Hoje:       1.1 → 1.2 → 1.3 (validar análise grátis funcionando)
Sessão 2:   1.4 (deploy prod) + 2.1 (auth) + 2.2 (modal paywall)
Sessão 3:   2.3 (MP checkout + webhook) + 2.4 (polling)
Sessão 4:   3.1 (generate API) + 3.2 (tela completo) + 3.3 (PDF)
Sessão 5:   3.4 (email) + refinamentos + deploy prod final
```
