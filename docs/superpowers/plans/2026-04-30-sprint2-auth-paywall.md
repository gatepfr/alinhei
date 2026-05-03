# Sprint 2 — Auth + Paywall + Mercado Pago

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar autenticação Supabase (email + Google), modal de paywall com 3 SKUs, integração Mercado Pago checkout + webhook e polling pós-pagamento — completando o funil de conversão do VagaCerta.

**Architecture:** Auth gerida pelo Supabase via cookies (@supabase/ssr). A página `/analise/[id]` é um server component que lê a session e o saldo de créditos e passa como props para o PreviewResult (client component). O CTA varia conforme estado: anônimo → login, sem crédito → PaywallModal, com crédito → gerar. O checkout cria uma preferência MP e redireciona o usuário; o webhook processa o retorno de forma idempotente. Polling no client verifica saldo a cada 3s após retorno do MP.

**Tech Stack:** Next.js 14 App Router, @supabase/ssr ^0.5, mercadopago SDK v2, Tailwind CSS, Zod, TypeScript strict

---

## Mapa de arquivos

**Criar:**
- `middleware.ts` — atualiza session e protege `/analise/[id]/completo` + `/dashboard`
- `app/login/page.tsx` — server component (checa login, renderiza form)
- `app/login/login-form.tsx` — client component com estado do form
- `app/auth/callback/route.ts` — troca código OAuth por session
- `components/paywall-modal.tsx` — modal overlay com 3 SKUs + botão checkout
- `components/checkout-polling.tsx` — polling de saldo após retorno MP
- `app/api/checkout/route.ts` — valida usuário, cria preferência MP
- `app/api/webhook/mercadopago/route.ts` — valida assinatura, concede créditos
- `app/api/balance/route.ts` — retorna saldo do usuário autenticado

**Modificar:**
- `app/analise/[id]/page.tsx` — passa `userId` e `balance` ao PreviewResult; mostra CheckoutPolling se `?checkout=success`
- `components/preview-result.tsx` — CTA condicional + integra PaywallModal

---

## Tarefa 1: middleware.ts

**Arquivos:**
- Criar: `middleware.ts`

- [ ] **Passo 1: Criar o middleware**

```ts
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isProtected =
    (request.nextUrl.pathname.startsWith('/analise') &&
      request.nextUrl.pathname.endsWith('/completo')) ||
    request.nextUrl.pathname.startsWith('/dashboard')

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/analise/:path*/completo', '/dashboard/:path*'],
}
```

- [ ] **Passo 2: Verificar typecheck**

```bash
pnpm typecheck
```

Esperado: 0 erros.

- [ ] **Passo 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: Supabase session middleware com proteção de rotas"
```

---

## Tarefa 2: Login page

**Arquivos:**
- Criar: `app/login/login-form.tsx`
- Criar: `app/login/page.tsx`

- [ ] **Passo 1: Criar o login form (client component)**

```tsx
// app/login/login-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Mode = 'signin' | 'signup'

interface LoginFormProps {
  next?: string
}

export function LoginForm({ next }: LoginFormProps) {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('E-mail ou senha incorretos.')
      } else {
        router.push(next ?? '/analise')
        router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) {
        setError(error.message)
      } else {
        setMessage('Confirme seu e-mail para ativar a conta.')
      }
    }

    setLoading(false)
  }

  async function handleGoogle() {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next ?? '/analise')}`,
      },
    })
  }

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogle}
        disabled={loading}
      >
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Entrar com Google
      </Button>

      <div className="flex items-center gap-2">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-xs text-muted-foreground">ou</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="voce@exemplo.com"
            disabled={loading}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="mínimo 6 caracteres"
            minLength={6}
            disabled={loading}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Aguarde...' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {mode === 'signin' ? (
          <>
            Não tem conta?{' '}
            <button
              type="button"
              onClick={() => setMode('signup')}
              className="underline text-foreground"
            >
              Criar agora
            </button>
          </>
        ) : (
          <>
            Já tem conta?{' '}
            <button
              type="button"
              onClick={() => setMode('signin')}
              className="underline text-foreground"
            >
              Entrar
            </button>
          </>
        )}
      </p>
    </div>
  )
}
```

- [ ] **Passo 2: Criar a login page (server component)**

```tsx
// app/login/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LoginForm } from './login-form'

export const metadata = { title: 'Entrar — VagaCerta' }

interface Props {
  searchParams: { next?: string }
}

export default async function LoginPage({ searchParams }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect(searchParams.next ?? '/analise')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="font-bold text-lg tracking-tight">
            VagaCerta
          </Link>
        </div>
      </nav>
      <div className="flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold">
              {searchParams.next ? 'Faça login para continuar' : 'Acesse sua conta'}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Diagnóstico grátis sem cadastro. Login para o pacote completo.
            </p>
          </div>
          <LoginForm next={searchParams.next} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Passo 3: Typecheck**

```bash
pnpm typecheck
```

Esperado: 0 erros.

- [ ] **Passo 4: Commit**

```bash
git add app/login/
git commit -m "feat: login page com email/senha e Google OAuth"
```

---

## Tarefa 3: Auth callback route

**Arquivos:**
- Criar: `app/auth/callback/route.ts`

- [ ] **Passo 1: Criar a route**

```ts
// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/analise'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
```

- [ ] **Passo 2: Typecheck**

```bash
pnpm typecheck
```

- [ ] **Passo 3: Commit**

```bash
git add app/auth/
git commit -m "feat: OAuth callback route"
```

---

## Tarefa 4: Atualizar analise/[id]/page.tsx

**Arquivos:**
- Modificar: `app/analise/[id]/page.tsx`

- [ ] **Passo 1: Substituir o conteúdo da página**

```tsx
// app/analise/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PreviewResult } from '@/components/preview-result'
import { CheckoutPolling } from '@/components/checkout-polling'
import { DiagnosticoSchema } from '@/lib/schemas'
import { getBalance } from '@/lib/credits'

interface Props {
  params: { id: string }
  searchParams: { checkout?: string }
}

export const metadata = {
  title: 'Resultado da análise — VagaCerta',
}

export default async function AnaliseResultPage({ params, searchParams }: Props) {
  const serviceClient = createServiceClient()

  const { data: analysis } = await serviceClient
    .from('analyses')
    .select('id, diagnostic')
    .eq('id', params.id)
    .maybeSingle()

  if (!analysis) notFound()

  const parsed = DiagnosticoSchema.safeParse(analysis.diagnostic)
  if (!parsed.success) notFound()

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const balance = user ? await getBalance(user.id) : 0
  const showPolling = searchParams.checkout === 'success' && !!user && balance === 0

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-bold text-lg tracking-tight">
            VagaCerta
          </Link>
          <Link href="/analise" className="text-sm text-muted-foreground hover:text-foreground">
            Nova análise
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Resultado da análise</h1>
          <p className="text-muted-foreground mt-1">
            Veja abaixo o diagnóstico gratuito. Desbloqueie o pacote completo para o currículo reescrito e mais.
          </p>
        </div>

        {showPolling && <CheckoutPolling analysisId={params.id} />}

        <PreviewResult
          diagnostic={parsed.data}
          analysisId={analysis.id}
          userId={user?.id ?? null}
          balance={balance}
        />
      </div>
    </div>
  )
}
```

- [ ] **Passo 2: Typecheck**

```bash
pnpm typecheck
```

Esperado: erros de tipo nas props do PreviewResult (userId/balance ainda não aceitos) — normais, serão resolvidos na próxima tarefa.

---

## Tarefa 5: PaywallModal + atualizar PreviewResult

**Arquivos:**
- Criar: `components/paywall-modal.tsx`
- Modificar: `components/preview-result.tsx`

- [ ] **Passo 1: Criar PaywallModal**

```tsx
// components/paywall-modal.tsx
'use client'

import { useEffect, useState } from 'react'
import { X, Zap } from 'lucide-react'
import { PRODUCTS, type ProductSku } from '@/lib/mercadopago'
import { trackEvent } from '@/lib/analytics'

const SKUS: Array<{ sku: ProductSku; highlight?: boolean }> = [
  { sku: 'single' },
  { sku: 'pack3', highlight: true },
  { sku: 'pack10' },
]

interface PaywallModalProps {
  analysisId: string
  onClose: () => void
}

export function PaywallModal({ analysisId, onClose }: PaywallModalProps) {
  const [loading, setLoading] = useState<ProductSku | null>(null)

  useEffect(() => {
    trackEvent('paywall_shown')
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleCheckout(sku: ProductSku) {
    setLoading(sku)
    trackEvent('checkout_started', { sku })
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku, analysisId }),
      })
      const data = await res.json() as { ok: boolean; initPoint?: string; error?: { message: string } }
      if (data.ok && data.initPoint) {
        window.location.href = data.initPoint
      } else {
        alert(data.error?.message ?? 'Erro ao iniciar pagamento. Tente novamente.')
        setLoading(null)
      }
    } catch {
      alert('Erro de rede. Tente novamente.')
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <Zap className="w-8 h-8 mx-auto mb-2 text-primary" />
          <h2 className="text-xl font-bold">Desbloqueie o pacote completo</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Currículo reescrito para ATS, 2 cartas e 5 perguntas STAR
          </p>
        </div>

        <div className="space-y-3">
          {SKUS.map(({ sku, highlight }) => {
            const product = PRODUCTS[sku]
            const isLoading = loading === sku
            return (
              <button
                key={sku}
                type="button"
                onClick={() => handleCheckout(sku)}
                disabled={loading !== null}
                className={[
                  'w-full p-4 rounded-xl border-2 text-left transition-all',
                  highlight
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-gray-200 hover:border-gray-300',
                  'disabled:opacity-60',
                ].join(' ')}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm">
                      {product.label}
                      {highlight && (
                        <span className="ml-2 text-xs text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">
                          Mais popular
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Válido por {product.expirationDays} dias
                    </p>
                  </div>
                  <p className="font-bold text-lg">
                    R${' '}
                    {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                {isLoading && (
                  <p className="text-xs text-muted-foreground mt-1 animate-pulse">
                    Redirecionando para pagamento...
                  </p>
                )}
              </button>
            )
          })}
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          PIX ou cartão · Pagamento seguro via Mercado Pago
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Passo 2: Substituir components/preview-result.tsx**

```tsx
// components/preview-result.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Lock, TrendingUp, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PaywallModal } from '@/components/paywall-modal'
import type { Diagnostico } from '@/lib/schemas'

interface PreviewResultProps {
  diagnostic: Diagnostico
  analysisId: string
  userId: string | null
  balance: number
}

function scoreColor(nota: number) {
  if (nota >= 75) return 'text-green-600'
  if (nota >= 60) return 'text-yellow-600'
  return 'text-red-500'
}

function scoreLabel(nota: number) {
  if (nota >= 90) return 'Excelente'
  if (nota >= 75) return 'Bom'
  if (nota >= 60) return 'Razoável'
  if (nota >= 40) return 'Fraco'
  return 'Muito fraco'
}

export function PreviewResult({ diagnostic, analysisId, userId, balance }: PreviewResultProps) {
  const { preview_publico, pontos_fortes, gaps_criticos, resumo_nota } = diagnostic
  const [showPaywall, setShowPaywall] = useState(false)

  return (
    <div className="space-y-6">
      {showPaywall && (
        <PaywallModal analysisId={analysisId} onClose={() => setShowPaywall(false)} />
      )}

      {/* Score */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center mb-4">
            <div className={`text-6xl font-bold ${scoreColor(preview_publico.nota)}`}>
              {preview_publico.nota}
            </div>
            <div className="text-lg font-medium mt-1">
              {scoreLabel(preview_publico.nota)} · Nota de aderência
            </div>
            <p className="text-sm text-muted-foreground mt-2">{resumo_nota}</p>
          </div>
          <Progress value={preview_publico.nota} className="h-3" />
        </CardContent>
      </Card>

      {/* Ponto forte (preview — só 1) */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <h3 className="font-semibold">Ponto forte destacado</h3>
          <Badge variant="secondary" className="text-xs">grátis</Badge>
        </div>
        <Card className="border-green-100">
          <CardContent className="pt-4">
            <p className="font-medium text-green-700">{pontos_fortes[0].titulo}</p>
            <p className="text-sm text-muted-foreground mt-1">{pontos_fortes[0].explicacao}</p>
          </CardContent>
        </Card>
        <LockedItems count={2} label="pontos fortes" color="green" />
      </div>

      <Separator />

      {/* Gap crítico (preview — só 1) */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold">Gap crítico identificado</h3>
          <Badge variant="secondary" className="text-xs">grátis</Badge>
        </div>
        <Card className="border-amber-100">
          <CardContent className="pt-4">
            <p className="font-medium text-amber-700">{gaps_criticos[0].titulo}</p>
            <p className="text-sm text-muted-foreground mt-1">{gaps_criticos[0].explicacao}</p>
          </CardContent>
        </Card>
        <LockedItems count={2} label="gaps críticos com como resolver" color="amber" />
      </div>

      <Separator />

      {/* CTA condicional */}
      <PaywallCTA
        analysisId={analysisId}
        userId={userId}
        balance={balance}
        onOpenPaywall={() => setShowPaywall(true)}
      />
    </div>
  )
}

function PaywallCTA({
  analysisId,
  userId,
  balance,
  onOpenPaywall,
}: {
  analysisId: string
  userId: string | null
  balance: number
  onOpenPaywall: () => void
}) {
  // Logado com crédito → ir direto para gerar
  if (userId && balance > 0) {
    return (
      <div className="bg-green-50 rounded-xl p-6 text-center border border-green-100">
        <h3 className="font-bold text-lg mb-2">
          Você tem {balance} crédito{balance > 1 ? 's' : ''}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Clique para gerar o currículo reescrito, as cartas e as perguntas STAR.
        </p>
        <Link
          href={`/analise/${analysisId}/completo`}
          className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto text-base h-12 px-8')}
        >
          Gerar meu pacote completo →
        </Link>
      </div>
    )
  }

  // Anônimo → convidar a fazer login
  // Logado sem crédito → abrir paywall modal
  return (
    <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200">
      <Lock className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
      <h3 className="font-bold text-lg mb-2">Pacote completo bloqueado</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Desbloqueie o currículo reescrito para ATS, as 2 cartas de apresentação
        e as 5 perguntas de entrevista com respostas STAR.
      </p>
      {userId ? (
        <Button
          size="lg"
          className="w-full sm:w-auto text-base h-12 px-8"
          onClick={onOpenPaywall}
        >
          Liberar pacote completo — R$ 9,90 no PIX →
        </Button>
      ) : (
        <Link
          href={`/login?next=/analise/${analysisId}`}
          className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto text-base h-12 px-8')}
        >
          Entrar para liberar o pacote completo →
        </Link>
      )}
      <p className="text-xs text-muted-foreground mt-3">
        Também disponível: 3 análises por R$ 19,90 · 10 análises por R$ 49,90
      </p>
    </div>
  )
}

function LockedItems({
  count,
  label,
  color,
}: {
  count: number
  label: string
  color: 'green' | 'amber'
}) {
  const borderColor = color === 'green' ? 'border-green-100' : 'border-amber-100'
  return (
    <div className={`mt-2 border ${borderColor} rounded-lg p-3 flex items-center gap-2 bg-gray-50`}>
      <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
      <p className="text-sm text-muted-foreground">
        + {count} outros {label} no pacote completo
      </p>
    </div>
  )
}
```

- [ ] **Passo 3: Typecheck**

```bash
pnpm typecheck
```

Esperado: 0 erros.

- [ ] **Passo 4: Commit**

```bash
git add components/paywall-modal.tsx components/preview-result.tsx app/analise/
git commit -m "feat: paywall modal e CTA condicional no preview"
```

---

## Tarefa 6: Checkout API

**Arquivos:**
- Criar: `app/api/checkout/route.ts`

- [ ] **Passo 1: Criar a route**

```ts
// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createPreference } from '@/lib/mercadopago'

const BodySchema = z.object({
  sku: z.enum(['single', 'pack3', 'pack10']),
  analysisId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Login necessário' } },
      { status: 401 }
    )
  }

  const body = await request.json()
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: 'INVALID_INPUT', message: parsed.error.message } },
      { status: 400 }
    )
  }

  const { sku, analysisId } = parsed.data
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  try {
    const result = await createPreference({
      sku,
      userId: user.id,
      userEmail: user.email!,
      notificationUrl: `${appUrl}/api/webhook/mercadopago`,
      successUrl: `${appUrl}/analise/${analysisId}?checkout=success`,
      failureUrl: `${appUrl}/analise/${analysisId}?checkout=failure`,
    })

    return NextResponse.json({ ok: true, initPoint: result.init_point })
  } catch (err) {
    console.error('MP checkout error:', err)
    return NextResponse.json(
      { ok: false, error: { code: 'MP_ERROR', message: 'Erro ao criar preferência de pagamento' } },
      { status: 500 }
    )
  }
}
```

- [ ] **Passo 2: Typecheck**

```bash
pnpm typecheck
```

- [ ] **Passo 3: Commit**

```bash
git add app/api/checkout/
git commit -m "feat: checkout API cria preferência Mercado Pago"
```

---

## Tarefa 7: Webhook Mercado Pago

**Arquivos:**
- Criar: `app/api/webhook/mercadopago/route.ts`

**Nota:** O Mercado Pago usa HMAC-SHA256, mas o manifesto inclui o `id` da notificação (não o payment id). A função `validateWebhookSignature` existente usa `id:;` — suficiente para desenvolvimento. Em produção, verifique o formato exato no painel MP e ajuste o manifesto se necessário.

- [ ] **Passo 1: Criar a route**

```ts
// app/api/webhook/mercadopago/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { validateWebhookSignature, PRODUCTS, type ProductSku } from '@/lib/mercadopago'
import { createServiceClient } from '@/lib/supabase/server'
import { grantCredits } from '@/lib/credits'

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const xSignature = request.headers.get('x-signature') ?? ''
  const xRequestId = request.headers.get('x-request-id') ?? ''

  if (!validateWebhookSignature(rawBody, xSignature, xRequestId)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  let payload: { type?: string; data?: { id?: string | number } }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  if (payload.type !== 'payment' || !payload.data?.id) {
    return NextResponse.json({ ok: true })
  }

  const paymentId = String(payload.data.id)

  let payment: Awaited<ReturnType<InstanceType<typeof Payment>['get']>>
  try {
    payment = await new Payment(mpClient).get({ id: paymentId })
  } catch {
    return NextResponse.json({ error: 'failed to fetch payment' }, { status: 500 })
  }

  if (payment.status !== 'approved') {
    return NextResponse.json({ ok: true })
  }

  const userId = payment.metadata?.user_id as string | undefined
  const sku = payment.metadata?.sku as ProductSku | undefined

  if (!userId || !sku || !PRODUCTS[sku]) {
    return NextResponse.json({ error: 'missing metadata' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Idempotência
  const { data: existing } = await supabase
    .from('payments')
    .select('id')
    .eq('mp_payment_id', paymentId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ ok: true })
  }

  const product = PRODUCTS[sku]
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + product.expirationDays)

  const { data: paymentRecord, error: paymentError } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      mp_payment_id: paymentId,
      mp_preference_id: payment.preference_id ?? null,
      status: 'approved',
      product_sku: sku,
      amount_brl_cents: Math.round(product.price * 100),
      credits_granted: product.credits,
      payer_email: payment.payer?.email ?? null,
      payment_method: payment.payment_type_id ?? null,
      raw_webhook: payload,
      approved_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (paymentError || !paymentRecord) {
    console.error('Payment insert error:', paymentError)
    return NextResponse.json({ error: 'failed to save payment' }, { status: 500 })
  }

  await grantCredits(userId, product.credits, `purchase:${sku}`, paymentRecord.id, expiresAt)

  return NextResponse.json({ ok: true })
}
```

- [ ] **Passo 2: Typecheck**

```bash
pnpm typecheck
```

- [ ] **Passo 3: Commit**

```bash
git add app/api/webhook/
git commit -m "feat: webhook MP com idempotência e concessão de créditos"
```

---

## Tarefa 8: Balance API + CheckoutPolling

**Arquivos:**
- Criar: `app/api/balance/route.ts`
- Criar: `components/checkout-polling.tsx`

- [ ] **Passo 1: Criar balance API**

```ts
// app/api/balance/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBalance } from '@/lib/credits'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHENTICATED' } },
      { status: 401 }
    )
  }

  const balance = await getBalance(user.id)
  return NextResponse.json({ ok: true, balance })
}
```

- [ ] **Passo 2: Criar CheckoutPolling component**

```tsx
// components/checkout-polling.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Loader2 } from 'lucide-react'

interface CheckoutPollingProps {
  analysisId: string
}

const POLL_INTERVAL_MS = 3000
const MAX_POLLS = 40  // 40 × 3s = 2 minutos

export function CheckoutPolling({ analysisId: _analysisId }: CheckoutPollingProps) {
  const [status, setStatus] = useState<'polling' | 'confirmed' | 'timeout'>('polling')
  const router = useRouter()

  useEffect(() => {
    let polls = 0
    let stopped = false

    async function poll() {
      if (stopped) return
      polls++

      try {
        const res = await fetch('/api/balance')
        const data = await res.json() as { ok: boolean; balance: number }
        if (data.ok && data.balance > 0) {
          setStatus('confirmed')
          setTimeout(() => router.refresh(), 1500)
          return
        }
      } catch {
        // erro de rede — tentar novamente
      }

      if (polls >= MAX_POLLS) {
        setStatus('timeout')
        return
      }

      setTimeout(poll, POLL_INTERVAL_MS)
    }

    setTimeout(poll, POLL_INTERVAL_MS)
    return () => { stopped = true }
  }, [router])

  if (status === 'confirmed') {
    return (
      <div className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
        <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
        <p className="text-sm font-medium text-green-700">
          Pagamento confirmado! Carregando seu crédito...
        </p>
      </div>
    )
  }

  if (status === 'timeout') {
    return (
      <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
        <p className="font-medium mb-1">Pagamento ainda não confirmado</p>
        <p>
          O pagamento pode demorar alguns minutos. Recarregue a página ou acesse
          seu histórico em breve.
        </p>
      </div>
    )
  }

  return (
    <div className="mb-6 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
      <Loader2 className="w-5 h-5 text-blue-500 shrink-0 animate-spin" />
      <p className="text-sm font-medium text-blue-700">
        Verificando confirmação do pagamento...
      </p>
    </div>
  )
}
```

- [ ] **Passo 3: Typecheck final**

```bash
pnpm typecheck
```

Esperado: 0 erros em todo o projeto.

- [ ] **Passo 4: Build de verificação**

```bash
pnpm build
```

Esperado: build completo sem erros.

- [ ] **Passo 5: Commit**

```bash
git add app/api/balance/ components/checkout-polling.tsx
git commit -m "feat: balance API e polling pós-checkout"
```

---

## Checklist de configuração pós-implementação

Antes de testar o fluxo completo:

- [ ] **Supabase Auth** — Ativar Email + Google em Authentication → Providers
- [ ] **Google OAuth** — Adicionar `http://localhost:3000/auth/callback` e a URL de produção como Redirect URI no Google Cloud Console
- [ ] **Supabase Redirect URLs** — Adicionar `http://localhost:3000/auth/callback` em Authentication → URL Configuration
- [ ] **`.env.local`** — Preencher `MERCADOPAGO_ACCESS_TOKEN` (credenciais de sandbox) e `MERCADOPAGO_WEBHOOK_SECRET`
- [ ] **Webhook MP** — Configurar URL no painel MP (sandbox): `https://seu-ngrok.app/api/webhook/mercadopago`
- [ ] **Testar fluxo** — Análise → login → modal paywall → checkout sandbox → retorno → polling → crédito confirmado

---

## Notas de implementação

- **Webhook em dev local:** O MP não consegue acessar localhost. Use ngrok (`ngrok http 3000`) para expor a rota do webhook durante os testes.
- **Créditos de sandbox MP:** No painel de sandbox do MP, aprove manualmente o pagamento de teste para disparar o webhook.
- **Google OAuth sem NEXT_PUBLIC_APP_URL:** O `window.location.origin` no LoginForm garante a URL correta tanto em dev quanto em prod.
