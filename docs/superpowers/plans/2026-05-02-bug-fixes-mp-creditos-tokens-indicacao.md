# Bug Fixes: MP Nova Aba, Créditos, Tokens IA, Link Indicação Curto

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir quatro problemas de UX/funcionalidade no Alinhei: (1) Mercado Pago deve abrir em nova aba para facilitar volta ao site; (2) botão "Comprar créditos" deve aparecer mesmo quando o usuário já tem créditos; (3) limites de tokens da IA precisam ser maiores para evitar erro com textos longos; (4) link de indicação deve ser curto em vez de UUID.

**Architecture:** Quatro fixes independentes no codebase existente. Um novo migration SQL para a tabela `profiles` (códigos de indicação). Uma nova rota `/r/[code]` que resolve o código curto para UUID e seta o cookie. Sem novas dependências npm.

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase (postgres + RLS), @anthropic-ai/sdk, Node.js crypto (built-in)

---

## File Map

| Arquivo | Status | Responsabilidade |
|---|---|---|
| `app/api/analyze/route.ts` | Modificar linha 69 | Aumentar maxTokens 1500→2500 |
| `app/api/generate/route.ts` | Modificar linha 180 | Aumentar perguntas maxTokens 2000→3000 |
| `components/upload-form.tsx` | Modificar | Contador de caracteres na vaga |
| `components/paywall-modal.tsx` | Modificar | Abrir MP em nova aba + UI "Já paguei" |
| `app/dashboard/page.tsx` | Modificar | Sempre mostrar botão comprar + gerar código de indicação |
| `app/dashboard/referral-copy.tsx` | Modificar | Usar URL `/r/{code}` no lugar do UUID |
| `supabase/migrations/003_referral_codes.sql` | Criar | Tabela `profiles` com `referral_code` |
| `app/r/[code]/route.ts` | Criar | Resolve código curto → UUID → seta cookie → redirect |

---

## Task 1: Aumentar Limites de Tokens da IA

**Files:**
- Modify: `app/api/analyze/route.ts:64-70`
- Modify: `app/api/generate/route.ts:164-184`

O `maxTokens` de 1500 para o diagnóstico é insuficiente com currículos longos (~15k chars): o JSON do response pode ser truncado, causando falha no parse. O maxTokens de 2000 para perguntas também é inconsistente com o código de regen parcial que já usa 3000.

- [ ] **Step 1: Aumentar maxTokens do diagnóstico**

Em `app/api/analyze/route.ts`, linha ~69, alterar `maxTokens: 1500` para `maxTokens: 2500`:

```ts
// app/api/analyze/route.ts — dentro de callWithJson(DiagnosticoSchema, {...})
const result = await callWithJson(DiagnosticoSchema, {
  system: DIAGNOSTICO_SYSTEM,
  user: DIAGNOSTICO_USER(curriculo, vaga),
  temperature: 0.3,
  maxTokens: 2500,  // era 1500 — insuficiente para CVs longos
})
```

- [ ] **Step 2: Aumentar maxTokens das perguntas STAR no generate**

Em `app/api/generate/route.ts`, na chamada `callWithJson(PerguntasSchema, {...})` da linha ~178 (a segunda, do fluxo completo, não a do partial regen), alterar `maxTokens: 2000` para `maxTokens: 3000`:

```ts
// app/api/generate/route.ts — dentro de Promise.allSettled([...])
callWithJson(PerguntasSchema, {
  system: PERGUNTAS_SYSTEM,
  user: PERGUNTAS_USER(curriculoText, vagaText),
  temperature: 0.5,
  maxTokens: 3000,  // era 2000 — agora consistente com o partial regen
}),
```

- [ ] **Step 3: Typecheck**

```bash
rtk pnpm typecheck
```
Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
rtk git add app/api/analyze/route.ts app/api/generate/route.ts
rtk git commit -m "fix: aumenta maxTokens (analyze 2500, perguntas 3000) para evitar truncamento com CVs longos"
```

---

## Task 2: Contador de Caracteres na Vaga

**Files:**
- Modify: `components/upload-form.tsx:139-148`

O usuário não sabe o limite de 5.000 chars e cola textos maiores sem feedback visual.

- [ ] **Step 1: Adicionar estado e contador no textarea de vaga**

Em `components/upload-form.tsx`, dentro da div `{/* Vaga */}` (linha ~139), substituir o bloco atual:

```tsx
{/* Vaga */}
<div className="space-y-3">
  <Label className="text-sm font-semibold text-foreground">Descrição da vaga</Label>
  <Textarea
    placeholder="Cole aqui a descrição completa da vaga (título, requisitos, responsabilidades)..."
    className="min-h-[140px] resize-y bg-secondary border-border focus-visible:ring-primary/40 placeholder:text-muted-foreground/50"
    value={vaga}
    onChange={(e) => setVaga(e.target.value)}
  />
  <div className="flex items-center justify-between">
    <p className="text-xs text-muted-foreground">Quanto mais detalhada a vaga, mais precisa a análise</p>
    <p className={[
      'text-xs tabular-nums',
      vaga.length > 4500 ? 'text-amber-500 font-medium' : 'text-muted-foreground/60',
    ].join(' ')}>
      {vaga.length.toLocaleString('pt-BR')}/5.000
    </p>
  </div>
  {vaga.length > 5000 && (
    <p className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
      Texto será cortado em 5.000 caracteres. A análise usará apenas os primeiros 5.000.
    </p>
  )}
</div>
```

- [ ] **Step 2: Typecheck**

```bash
rtk pnpm typecheck
```
Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
rtk git add components/upload-form.tsx
rtk git commit -m "feat: adiciona contador de caracteres (5000 limite) no campo de vaga"
```

---

## Task 3: Mercado Pago Abre em Nova Aba

**Files:**
- Modify: `components/paywall-modal.tsx:42-111` (state + handleCheckout + render)

Atualmente `window.location.href = data.initPoint` navega pra fora do site. Com `window.open`, o usuário paga na nova aba e volta ao site.

- [ ] **Step 1: Adicionar estado paymentOpened e modificar handleCheckout**

Em `components/paywall-modal.tsx`, adicionar o estado e atualizar a função `handleCheckout`:

```tsx
// Adicionar após os outros estados (linha ~48):
const [paymentOpened, setPaymentOpened] = useState(false)

// Substituir o trecho dentro de handleCheckout que faz o redirect (linha ~101-103):
if (data.ok && data.initPoint) {
  window.open(data.initPoint, '_blank', 'noopener,noreferrer')
  setPaymentOpened(true)
  setLoading(null)
} else {
  alert(data.error?.message ?? 'Erro ao iniciar pagamento. Tente novamente.')
  setLoading(null)
}
```

- [ ] **Step 2: Adicionar UI "aguardando pagamento" após os SKUs**

Em `components/paywall-modal.tsx`, após o bloco `{/* SKUs */}` (div com `space-y-2.5 mb-5`), adicionar:

```tsx
{/* Estado pós-abertura do pagamento */}
{paymentOpened && (
  <div className="mb-5 p-4 rounded-xl border border-primary/30 bg-primary/[0.05] text-center space-y-3">
    <p className="text-sm font-medium text-foreground">
      Pagamento aberto em nova aba
    </p>
    <p className="text-xs text-muted-foreground">
      Conclua o pagamento e retorne aqui. Pode levar alguns segundos para confirmar.
    </p>
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
    >
      Já paguei — verificar
    </button>
    <button
      type="button"
      onClick={() => setPaymentOpened(false)}
      className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
    >
      Tentar outro método
    </button>
  </div>
)}
```

- [ ] **Step 3: Typecheck**

```bash
rtk pnpm typecheck
```
Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
rtk git add components/paywall-modal.tsx
rtk git commit -m "feat: abre Mercado Pago em nova aba com botão 'Já paguei' para retornar ao site"
```

---

## Task 4: Botão Comprar Créditos Sempre Visível no Dashboard

**Files:**
- Modify: `app/dashboard/page.tsx:67-75`

O botão atual só aparece quando `balance === 0`. Usuários com crédito não conseguem comprar mais.

- [ ] **Step 1: Remover condição balance === 0 e ajustar label**

Em `app/dashboard/page.tsx`, dentro do card de saldo (linha ~59), substituir o bloco condicional:

```tsx
// Substituir:
{balance === 0 && (
  <Link
    href={analyses[0] ? `/analise/${analyses[0].id}` : '/analise'}
    className="ml-auto flex items-center gap-2 text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
  >
    <Plus className="w-4 h-4" />
    Comprar créditos
  </Link>
)}

// Por (sempre visível, label muda conforme saldo):
<Link
  href={analyses[0] ? `/analise/${analyses[0].id}` : '/analise'}
  className="ml-auto flex items-center gap-2 text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
>
  <Plus className="w-4 h-4" />
  {balance === 0 ? 'Comprar créditos' : 'Comprar mais'}
</Link>
```

- [ ] **Step 2: Typecheck**

```bash
rtk pnpm typecheck
```
Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
rtk git add app/dashboard/page.tsx
rtk git commit -m "fix: botão comprar créditos sempre visível no dashboard (não apenas quando saldo zero)"
```

---

## Task 5: Link de Indicação Curto

**Files:**
- Create: `supabase/migrations/003_referral_codes.sql`
- Create: `app/r/[code]/route.ts`
- Modify: `app/dashboard/page.tsx`
- Modify: `app/dashboard/referral-copy.tsx`

O link atual `/?ref={userId}` tem 36 chars de UUID. O novo formato `/r/XXXXXXXX` tem 8 chars alfanuméricos únicos.

### Sub-Task 5a: Migration — tabela profiles

- [ ] **Step 1: Criar migration**

Criar `supabase/migrations/003_referral_codes.sql`:

```sql
-- Sprint 4 fix: códigos curtos de indicação
-- Armazena um código único e legível por usuário, usado em /r/{code}

create table public.profiles (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  referral_code char(8) not null,
  created_at    timestamptz not null default now()
);

create unique index profiles_referral_code_idx on public.profiles(referral_code);

alter table public.profiles enable row level security;

create policy "users read own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

-- Apenas service role insere/atualiza (via dashboard page.tsx server-side)
```

- [ ] **Step 2: Commit**

```bash
rtk git add supabase/migrations/003_referral_codes.sql
rtk git commit -m "feat: migration 003 — tabela profiles com referral_code único de 8 chars"
```

### Sub-Task 5b: Rota /r/[code]

- [ ] **Step 3: Criar helper de geração de código em lib/referral.ts**

Criar `lib/referral.ts`:

```ts
import crypto from 'crypto'

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sem I, O, 0, 1 pra evitar confusão visual

export function generateReferralCode(): string {
  const bytes = crypto.randomBytes(8)
  return Array.from(bytes).map(b => CHARSET[b % CHARSET.length]).join('').slice(0, 8)
}
```

- [ ] **Step 4: Criar route handler app/r/[code]/route.ts**

Criar `app/r/[code]/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase().trim()

  // Só aceita formato válido: 8 chars alfanuméricos
  if (!/^[A-Z0-9]{6,10}$/.test(code)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('user_id')
    .eq('referral_code', code)
    .maybeSingle()

  const response = NextResponse.redirect(new URL('/', request.url))

  if (profile?.user_id) {
    response.cookies.set('vc_ref', profile.user_id, {
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    })
  }

  return response
}
```

- [ ] **Step 5: Commit**

```bash
rtk git add lib/referral.ts app/r/[code]/route.ts
rtk git commit -m "feat: rota /r/[code] resolve código curto de indicação para UUID e seta cookie vc_ref"
```

### Sub-Task 5c: Dashboard gera e exibe código curto

- [ ] **Step 6: Atualizar dashboard/page.tsx para buscar/gerar o código**

Em `app/dashboard/page.tsx`, adicionar import de `generateReferralCode` e fetch do profile. Substituir o bloco `Promise.all` e o fetch de `referralsRes` para incluir o profile:

```tsx
// Adicionar import no topo:
import { generateReferralCode } from '@/lib/referral'

// Substituir o Promise.all existente (linha ~24):
const [balance, analysesRes, referralsRes, profileRes] = await Promise.all([
  getBalance(user.id),
  serviceClient
    .from('analyses')
    .select('id, created_at, diagnostic')
    .or(orFilter)
    .order('created_at', { ascending: false })
    .limit(20),
  serviceClient
    .from('referrals')
    .select('id, credit_granted')
    .eq('referrer_id', user.id),
  serviceClient
    .from('profiles')
    .select('referral_code')
    .eq('user_id', user.id)
    .maybeSingle(),
])

const analyses = analysesRes.data ?? []
const referrals = referralsRes.data ?? []
const referralConverted = referrals.filter((r) => r.credit_granted).length

// Gerar código se ainda não existe:
let referralCode = profileRes.data?.referral_code ?? ''
if (!referralCode) {
  const newCode = generateReferralCode()
  const { data: inserted } = await serviceClient
    .from('profiles')
    .insert({ user_id: user.id, referral_code: newCode })
    .select('referral_code')
    .maybeSingle()
  // Se houve race condition (unique conflict), buscar o código existente
  if (!inserted) {
    const { data: existing } = await serviceClient
      .from('profiles')
      .select('referral_code')
      .eq('user_id', user.id)
      .maybeSingle()
    referralCode = existing?.referral_code ?? newCode
  } else {
    referralCode = inserted.referral_code
  }
}
```

- [ ] **Step 7: Passar referralCode para ReferralCopy**

Em `app/dashboard/page.tsx`, dentro do JSX, substituir o `<ReferralCopy userId={user.id} />` por:

```tsx
<ReferralCopy referralCode={referralCode} />
```

- [ ] **Step 8: Atualizar referral-copy.tsx para usar /r/{code}**

Substituir todo o conteúdo de `app/dashboard/referral-copy.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

interface ReferralCopyProps {
  referralCode: string
}

export function ReferralCopy({ referralCode }: ReferralCopyProps) {
  const [copied, setCopied] = useState(false)
  const referralUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${referralCode}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralUrl)
    } catch {
      const input = document.createElement('input')
      input.value = referralUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    setCopied(true)
    trackEvent('referral_link_copied')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex gap-2 mt-2">
      <input
        readOnly
        value={referralUrl}
        className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-muted-foreground font-mono truncate"
      />
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1.5 text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-green-600">Copiado!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Copiar link
          </>
        )}
      </button>
    </div>
  )
}
```

- [ ] **Step 9: Typecheck**

```bash
rtk pnpm typecheck
```
Esperado: sem erros. Se houver erro de tipo no `Promise.all` (tuple inference), adicionar `as const` ou tipar explicitamente.

- [ ] **Step 10: Commit final**

```bash
rtk git add app/dashboard/page.tsx app/dashboard/referral-copy.tsx lib/referral.ts
rtk git commit -m "feat: link de indicação curto (/r/XXXXXXXX) com código gerado automaticamente"
```

---

## Self-Review

### Spec Coverage

| Correção | Task | Status |
|---|---|---|
| MP abre em nova aba | Task 3 | ✅ |
| Botão comprar créditos sempre visível | Task 4 | ✅ |
| maxTokens diagnostico insuficiente | Task 1 step 1 | ✅ |
| maxTokens perguntas inconsistente | Task 1 step 2 | ✅ |
| Contador de chars na vaga | Task 2 | ✅ |
| Link de indicação curto | Task 5 | ✅ |
| Rota /r/[code] para resolver código | Task 5b | ✅ |
| Migration tabela profiles | Task 5a | ✅ |

### Placeholder Scan
- Nenhum TBD/TODO no plano
- Todos os steps têm código concreto
- Tipos e nomes consistentes entre tasks (ex: `referralCode` é `string` em todos os lugares)

### Type Consistency
- `ReferralCopy` muda de `{ userId: string }` para `{ referralCode: string }` — precisa que Task 5 step 7 e 8 sejam aplicados juntos (não separados)
- `generateReferralCode` retorna `string` e é chamada assim em Task 5 step 6 ✅
- `/r/[code]/route.ts` usa `createServiceClient()` de `@/lib/supabase/server` (já existente) ✅

---

## Notas de Deploy

Após implementar, rodar a migration no Supabase:
```sql
-- No Supabase SQL Editor ou via supabase CLI:
-- supabase migration up
```

Os links antigos `/?ref=UUID` continuam funcionando via middleware.ts (linha 64-71 já valida UUID).
