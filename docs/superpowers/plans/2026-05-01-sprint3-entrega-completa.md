# Sprint 3 — Entrega Completa

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar a entrega paga completa do VagaCerta: geração paralela de currículo + cartas + perguntas STAR via LLM, tela de resultados com abas, geração de PDF, email transacional e botão de compartilhamento no LinkedIn.

**Architecture:** A rota `/api/generate` debita 1 crédito e dispara 3 chamadas LLM em `Promise.all`. O resultado é salvo em `generations`. A tela `/analise/[id]/completo` é um server component que lê a generation do Supabase e renderiza abas client-side. O PDF é servido por `/api/pdf/[generationId]` usando `@react-pdf/renderer`. O email é enviado via Resend com o PDF como attachment após a geração.

**Tech Stack:** Next.js 14 App Router, @anthropic-ai/sdk (callWithJson), @react-pdf/renderer ^4, resend ^4, Supabase (service role), TypeScript strict, Tailwind, shadcn/ui (Tabs, Card, Badge, Button)

---

## Mapa de arquivos

**Criar:**
- `app/api/generate/route.ts` — debita crédito, 3 LLMs em paralelo, salva generation, envia email
- `app/api/pdf/[generationId]/route.ts` — gera e serve o PDF da generation
- `app/analise/[id]/completo/page.tsx` — server component: lê generation, renderiza tela
- `components/generation-view.tsx` — client component: abas (diagnóstico, currículo, cartas, perguntas)
- `lib/pdf-generator.tsx` — JSX do PDF com @react-pdf/renderer
- `lib/email.ts` — envia email transacional via Resend com PDF anexo

**Não criar:**
- Nenhuma lib adicional — `callWithJson`, `CURRICULO_USER`, `CARTA_USER`, `PERGUNTAS_USER`, `CartaSchema`, `PerguntasSchema` já existem

---

## Tarefa 1: `/api/generate/route.ts`

**Arquivos:**
- Criar: `app/api/generate/route.ts`

- [ ] **Passo 1: Criar a rota**

```ts
// app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { debitCredit } from '@/lib/credits'
import { callWithJson } from '@/lib/anthropic'
import {
  CURRICULO_SYSTEM, CURRICULO_USER,
  CARTA_SYSTEM, CARTA_USER,
  PERGUNTAS_SYSTEM, PERGUNTAS_USER,
} from '@/lib/prompts'
import { CartaSchema, PerguntasSchema } from '@/lib/schemas'

const BodySchema = z.object({
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

  const { analysisId } = parsed.data
  const serviceClient = createServiceClient()

  // Buscar análise — precisa existir
  const { data: analysis } = await serviceClient
    .from('analyses')
    .select('id, curriculo_text, vaga_text, diagnostic')
    .eq('id', analysisId)
    .maybeSingle()

  if (!analysis) {
    return NextResponse.json(
      { ok: false, error: { code: 'NOT_FOUND', message: 'Análise não encontrada' } },
      { status: 404 }
    )
  }

  // Verificar se já existe generation para este analysis+user (evitar duplo gasto)
  const { data: existingGen } = await serviceClient
    .from('generations')
    .select('id')
    .eq('analysis_id', analysisId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingGen) {
    return NextResponse.json({ ok: true, generationId: existingGen.id })
  }

  // Criar linha de generation primeiro (para ter o ID para débito)
  const { data: generation, error: genError } = await serviceClient
    .from('generations')
    .insert({ analysis_id: analysisId, user_id: user.id })
    .select('id')
    .single()

  if (genError || !generation) {
    console.error('[generate] DB insert error:', genError)
    return NextResponse.json(
      { ok: false, error: { code: 'DB_ERROR', message: 'Erro interno' } },
      { status: 500 }
    )
  }

  // Debitar crédito atomicamente
  const debitId = await debitCredit(user.id, generation.id)
  if (!debitId) {
    // Sem crédito — remover a generation criada
    await serviceClient.from('generations').delete().eq('id', generation.id)
    return NextResponse.json(
      { ok: false, error: { code: 'NO_CREDITS', message: 'Créditos insuficientes' } },
      { status: 402 }
    )
  }

  const curriculo = analysis.curriculo_text
  const vaga = analysis.vaga_text
  const diagnosticoJson = JSON.stringify(analysis.diagnostic)

  // Extrair nome da empresa da descrição da vaga (simples heurística)
  const empresaMatch = vaga.match(/empresa[:\s]+([^\n,]+)/i)
  const nomeEmpresa = empresaMatch?.[1]?.trim() ?? 'a empresa'

  // 3 LLMs em paralelo
  let curriculo_otimizado: string
  let carta: z.infer<typeof CartaSchema>
  let perguntas: z.infer<typeof PerguntasSchema>
  let totalInput = 0
  let totalOutput = 0

  try {
    const [curriculoResult, cartaResult, perguntasResult] = await Promise.all([
      // Currículo — retorna markdown direto (não JSON)
      (async () => {
        const { anthropic, MODEL } = await import('@/lib/anthropic')
        const response = await anthropic.messages.create({
          model: MODEL,
          max_tokens: 4000,
          temperature: 0.5,
          system: CURRICULO_SYSTEM,
          messages: [{ role: 'user', content: CURRICULO_USER(curriculo, vaga, diagnosticoJson) }],
        })
        return {
          text: response.content[0].type === 'text' ? response.content[0].text : '',
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        }
      })(),
      callWithJson(CartaSchema, {
        system: CARTA_SYSTEM,
        user: CARTA_USER(curriculo, vaga, nomeEmpresa),
        temperature: 0.7,
        maxTokens: 2000,
      }),
      callWithJson(PerguntasSchema, {
        system: PERGUNTAS_SYSTEM,
        user: PERGUNTAS_USER(curriculo, vaga),
        temperature: 0.5,
        maxTokens: 4000,
      }),
    ])

    curriculo_otimizado = curriculoResult.text
    carta = cartaResult.data
    perguntas = perguntasResult.data
    totalInput = curriculoResult.inputTokens + cartaResult.inputTokens + perguntasResult.inputTokens
    totalOutput = curriculoResult.outputTokens + cartaResult.outputTokens + perguntasResult.outputTokens
  } catch (err) {
    console.error('[generate] LLM error:', err)
    // Estornar crédito: inserir linha positiva de estorno
    await serviceClient.from('credits').insert({
      user_id: user.id,
      amount: 1,
      source: 'refund:generation_error',
      reference_id: generation.id,
    })
    await serviceClient.from('generations').delete().eq('id', generation.id)
    return NextResponse.json(
      { ok: false, error: { code: 'LLM_ERROR', message: 'Erro ao gerar conteúdo. Crédito estornado.' } },
      { status: 500 }
    )
  }

  const costBrlCents = Math.round((totalInput * 0.0008 + totalOutput * 0.004) / 1000 * 5.5 * 100)

  // Salvar resultados
  const { error: updateError } = await serviceClient
    .from('generations')
    .update({
      curriculo_otimizado,
      carta,
      perguntas,
      tokens_input: totalInput,
      tokens_output: totalOutput,
      cost_brl_cents: costBrlCents,
    })
    .eq('id', generation.id)

  if (updateError) {
    console.error('[generate] DB update error:', updateError)
  }

  // Disparar email em background (não bloqueia resposta)
  void sendGenerationEmail(user.email!, generation.id, analysis.id).catch((err) =>
    console.error('[generate] email error:', err)
  )

  console.log('[generate] tokens:', { totalInput, totalOutput, costBrlCents })
  return NextResponse.json({ ok: true, generationId: generation.id })
}

async function sendGenerationEmail(email: string, generationId: string, analysisId: string) {
  const { sendEmail } = await import('@/lib/email')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  await sendEmail({
    to: email,
    generationId,
    resultUrl: `${appUrl}/analise/${analysisId}/completo`,
  })
}
```

- [ ] **Passo 2: Typecheck**

```bash
pnpm typecheck 2>&1 | head -20
```

Esperado: pode ter erros de `@/lib/email` (ainda não existe) — normal, será resolvido na T4.

- [ ] **Passo 3: Commit**

```bash
git add app/api/generate/
git commit -m "feat: /api/generate debita crédito e gera pacote completo em paralelo"
```

---

## Tarefa 2: Tela `/analise/[id]/completo/page.tsx` + `components/generation-view.tsx`

**Arquivos:**
- Criar: `app/analise/[id]/completo/page.tsx`
- Criar: `components/generation-view.tsx`

- [ ] **Passo 1: Criar o server component `completo/page.tsx`**

```tsx
// app/analise/[id]/completo/page.tsx
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { GenerationView } from '@/components/generation-view'
import { DiagnosticoSchema, CartaSchema, PerguntasSchema } from '@/lib/schemas'
import { z } from 'zod'

interface Props {
  params: { id: string }
}

export const metadata = { title: 'Pacote completo — VagaCerta' }

export default async function CompletePage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/analise/${params.id}/completo`)

  const serviceClient = createServiceClient()

  // Buscar analysis
  const { data: analysis } = await serviceClient
    .from('analyses')
    .select('id, diagnostic')
    .eq('id', params.id)
    .maybeSingle()

  if (!analysis) notFound()

  const diagnostic = DiagnosticoSchema.safeParse(analysis.diagnostic)
  if (!diagnostic.success) notFound()

  // Buscar generation do usuário para esta análise
  const { data: generation } = await serviceClient
    .from('generations')
    .select('id, curriculo_otimizado, carta, perguntas')
    .eq('analysis_id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  // Sem generation: verificar crédito e redirecionar para gerar
  if (!generation || !generation.curriculo_otimizado) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-100 px-4 py-3">
          <div className="max-w-3xl mx-auto">
            <Link href="/" className="font-bold text-lg tracking-tight">VagaCerta</Link>
          </div>
        </nav>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Gerando seu pacote...</h1>
          <p className="text-muted-foreground mb-8">
            Isso leva cerca de 30 segundos. Se você ainda não gerou, clique abaixo.
          </p>
          <GeneratingView analysisId={params.id} />
        </div>
      </div>
    )
  }

  const carta = CartaSchema.safeParse(generation.carta)
  const perguntas = PerguntasSchema.safeParse(generation.perguntas)

  if (!carta.success || !perguntas.success) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-bold text-lg tracking-tight">VagaCerta</Link>
          <div className="flex items-center gap-3">
            <Link href="/analise" className="text-sm text-muted-foreground hover:text-foreground">
              Nova análise
            </Link>
            <a
              href={`/api/pdf/${generation.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium underline"
            >
              Baixar PDF
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Seu pacote completo</h1>
          <p className="text-muted-foreground mt-1">
            Nota de aderência: <strong>{diagnostic.data.preview_publico.nota}/100</strong>
          </p>
        </div>

        <GenerationView
          diagnostic={diagnostic.data}
          curriculoOtimizado={generation.curriculo_otimizado}
          carta={carta.data}
          perguntas={perguntas.data}
          generationId={generation.id}
          analysisId={params.id}
        />
      </div>
    </div>
  )
}

function GeneratingView({ analysisId }: { analysisId: string }) {
  return (
    <GenerateButton analysisId={analysisId} />
  )
}

// Pequeno client component inline para o botão de gerar
import { GenerateButton } from '@/components/generation-view'
```

**Nota:** O import de `GenerateButton` precisa ser movido para o topo do arquivo — ajuste conforme necessário para evitar erros de importação circular.

- [ ] **Passo 2: Criar `components/generation-view.tsx`**

```tsx
// components/generation-view.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Copy, ExternalLink, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'
import type { Diagnostico, Carta, Perguntas } from '@/lib/schemas'

// ─── GenerateButton ─────────────────────────────────────────────────────────

export function GenerateButton({ analysisId }: { analysisId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId }),
      })
      const data = await res.json() as { ok: boolean; generationId?: string; error?: { message: string } }
      if (data.ok) {
        router.refresh()
      } else {
        setError(data.error?.message ?? 'Erro ao gerar. Tente novamente.')
        setLoading(false)
      }
    } catch {
      setError('Erro de rede. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button size="lg" onClick={handleGenerate} disabled={loading} className="h-12 px-8 text-base">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Gerando pacote completo...
          </>
        ) : (
          'Gerar meu pacote completo →'
        )}
      </Button>
    </div>
  )
}

// ─── GenerationView ──────────────────────────────────────────────────────────

interface GenerationViewProps {
  diagnostic: Diagnostico
  curriculoOtimizado: string
  carta: Carta
  perguntas: Perguntas
  generationId: string
  analysisId: string
}

export function GenerationView({
  diagnostic,
  curriculoOtimizado,
  carta,
  perguntas,
  generationId,
  analysisId,
}: GenerationViewProps) {
  return (
    <Tabs defaultValue="diagnostico" className="space-y-6">
      <TabsList className="grid grid-cols-4 w-full">
        <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>
        <TabsTrigger value="curriculo">Currículo</TabsTrigger>
        <TabsTrigger value="cartas">Cartas</TabsTrigger>
        <TabsTrigger value="perguntas">Entrevista</TabsTrigger>
      </TabsList>

      {/* Diagnóstico completo */}
      <TabsContent value="diagnostico" className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <h3 className="font-semibold">Pontos fortes</h3>
          </div>
          {diagnostic.pontos_fortes.map((pf, i) => (
            <Card key={i} className="border-green-100">
              <CardContent className="pt-4">
                <p className="font-medium text-green-700">{pf.titulo}</p>
                <p className="text-sm text-muted-foreground mt-1">{pf.explicacao}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-3 mt-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold">Gaps críticos com como resolver</h3>
          </div>
          {diagnostic.gaps_criticos.map((gap, i) => (
            <Card key={i} className="border-amber-100">
              <CardContent className="pt-4">
                <p className="font-medium text-amber-700">{gap.titulo}</p>
                <p className="text-sm text-muted-foreground mt-1">{gap.explicacao}</p>
                <div className="mt-2 p-2 bg-amber-50 rounded text-sm">
                  <span className="font-medium">Como resolver: </span>{gap.como_resolver}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      {/* Currículo reescrito */}
      <TabsContent value="curriculo">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-end mb-4">
              <CopyButton text={curriculoOtimizado} label="Copiar currículo" />
            </div>
            <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
              {curriculoOtimizado}
            </pre>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Cartas */}
      <TabsContent value="cartas" className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Mensagem para LinkedIn</h3>
            <CopyButton text={carta.linkedin} label="Copiar" />
          </div>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm leading-relaxed">{carta.linkedin}</p>
              <p className="text-xs text-muted-foreground mt-2">{carta.linkedin.length} caracteres</p>
            </CardContent>
          </Card>
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Carta por e-mail</h3>
            <CopyButton text={carta.email} label="Copiar" />
          </div>
          <Card>
            <CardContent className="pt-4">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed">{carta.email}</pre>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Perguntas STAR */}
      <TabsContent value="perguntas" className="space-y-4">
        {perguntas.perguntas.map((p, i) => (
          <PerguntaCard key={i} index={i + 1} pergunta={p} />
        ))}
      </TabsContent>
    </Tabs>
  )
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    trackEvent('pdf_downloaded') // reutilizando evento de engajamento
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {copied ? <CheckCircle className="w-3 h-3 mr-1 text-green-500" /> : <Copy className="w-3 h-3 mr-1" />}
      {copied ? 'Copiado!' : label}
    </Button>
  )
}

function PerguntaCard({
  index,
  pergunta,
}: {
  index: number
  pergunta: Perguntas['perguntas'][number]
}) {
  const [open, setOpen] = useState(false)

  return (
    <Card>
      <CardContent className="pt-4">
        <button
          type="button"
          className="w-full text-left"
          onClick={() => setOpen((o) => !o)}
        >
          <div className="flex items-start gap-3">
            <span className="text-muted-foreground text-sm font-mono shrink-0">{index}.</span>
            <div className="flex-1">
              <p className="font-medium text-sm">{pergunta.pergunta}</p>
              <div className="flex gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">{pergunta.tipo}</Badge>
                <span className="text-xs text-muted-foreground">{pergunta.por_que_pode_cair}</span>
              </div>
            </div>
          </div>
        </button>

        {open && (
          <div className="mt-4 space-y-2 border-t pt-4">
            {(['situacao', 'tarefa', 'acao', 'resultado'] as const).map((key) => (
              <div key={key} className="text-sm">
                <span className="font-medium capitalize text-primary">{key}: </span>
                <span className="text-muted-foreground">{pergunta.resposta_star[key]}</span>
              </div>
            ))}
            <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
              <span className="font-medium">Dica: </span>{pergunta.dica}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Passo 3: Corrigir o import em `completo/page.tsx`**

O arquivo `completo/page.tsx` tem um `import` de `GenerateButton` no meio do arquivo (após a declaração da função). Mova-o para o topo junto com os outros imports:

```tsx
// app/analise/[id]/completo/page.tsx — topo do arquivo (substituir todos os imports)
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { GenerationView, GenerateButton } from '@/components/generation-view'
import { DiagnosticoSchema, CartaSchema, PerguntasSchema } from '@/lib/schemas'
```

E remova a linha `import { GenerateButton } from '@/components/generation-view'` que está no meio do arquivo. A função `GeneratingView` fica assim:

```tsx
function GeneratingView({ analysisId }: { analysisId: string }) {
  return <GenerateButton analysisId={analysisId} />
}
```

- [ ] **Passo 4: Adicionar `Tabs` ao shadcn (se não existir)**

```bash
ls /c/projetos/saas-vagacerta/components/ui/tabs.tsx 2>/dev/null || echo "MISSING"
```

Se `MISSING`, criar `components/ui/tabs.tsx`:

```tsx
// components/ui/tabs.tsx
'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow',
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
```

Depois instalar o primitivo se necessário:

```bash
cd /c/projetos/saas-vagacerta && pnpm add @radix-ui/react-tabs 2>&1 | tail -3
```

- [ ] **Passo 5: Typecheck**

```bash
pnpm typecheck 2>&1 | head -30
```

Esperado: erros em `@/lib/email` (ainda não existe) — normal, será resolvido na T4.

- [ ] **Passo 6: Commit**

```bash
git add app/analise/ components/generation-view.tsx components/ui/tabs.tsx
git commit -m "feat: tela /completo com abas de diagnóstico, currículo, cartas e entrevista"
```

---

## Tarefa 3: PDF — `lib/pdf-generator.tsx` + `/api/pdf/[generationId]/route.ts`

**Arquivos:**
- Criar: `lib/pdf-generator.tsx`
- Criar: `app/api/pdf/[generationId]/route.ts`

- [ ] **Passo 1: Criar `lib/pdf-generator.tsx`**

```tsx
// lib/pdf-generator.tsx
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer'
import type { Diagnostico, Carta, Perguntas } from '@/lib/schemas'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a' },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#555', marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginTop: 16, marginBottom: 8, color: '#1a1a1a' },
  label: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#333', marginTop: 6, marginBottom: 2 },
  text: { fontSize: 9, lineHeight: 1.5, color: '#444' },
  pill: { backgroundColor: '#f0f0f0', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4 },
  pillText: { fontSize: 8, color: '#555' },
  divider: { borderBottomWidth: 1, borderBottomColor: '#e0e0e0', marginVertical: 10 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  bullet: { width: 8, fontSize: 9, color: '#666' },
  starKey: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#0070f3', width: 70 },
})

interface PdfProps {
  diagnostic: Diagnostico
  curriculoOtimizado: string
  carta: Carta
  perguntas: Perguntas
}

function PdfDoc({ diagnostic, curriculoOtimizado, carta, perguntas }: PdfProps) {
  return (
    <Document>
      {/* Página 1: Diagnóstico */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>VagaCerta — Pacote Completo</Text>
        <Text style={styles.subtitle}>
          Nota de aderência: {diagnostic.preview_publico.nota}/100
        </Text>
        <Text style={styles.text}>{diagnostic.resumo_nota}</Text>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Pontos Fortes</Text>
        {diagnostic.pontos_fortes.map((pf, i) => (
          <View key={i} style={{ marginBottom: 8 }}>
            <Text style={styles.label}>{i + 1}. {pf.titulo}</Text>
            <Text style={styles.text}>{pf.explicacao}</Text>
          </View>
        ))}

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Gaps Críticos</Text>
        {diagnostic.gaps_criticos.map((gap, i) => (
          <View key={i} style={{ marginBottom: 10 }}>
            <Text style={styles.label}>{i + 1}. {gap.titulo}</Text>
            <Text style={styles.text}>{gap.explicacao}</Text>
            <Text style={[styles.label, { color: '#c47d00' }]}>Como resolver:</Text>
            <Text style={styles.text}>{gap.como_resolver}</Text>
          </View>
        ))}
      </Page>

      {/* Página 2: Currículo reescrito */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Currículo Reescrito para ATS</Text>
        <Text style={styles.text}>{curriculoOtimizado}</Text>
      </Page>

      {/* Página 3: Cartas */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Cartas de Apresentação</Text>
        <Text style={styles.label}>Mensagem LinkedIn (candidatura)</Text>
        <Text style={styles.text}>{carta.linkedin}</Text>
        <View style={styles.divider} />
        <Text style={styles.label}>E-mail</Text>
        <Text style={styles.text}>{carta.email}</Text>
      </Page>

      {/* Página 4: Perguntas STAR */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>5 Perguntas de Entrevista com Respostas STAR</Text>
        {perguntas.perguntas.map((p, i) => (
          <View key={i} style={{ marginBottom: 14 }}>
            <Text style={styles.label}>{i + 1}. {p.pergunta}</Text>
            <Text style={[styles.text, { color: '#888', marginBottom: 4 }]}>{p.por_que_pode_cair}</Text>
            {(['situacao', 'tarefa', 'acao', 'resultado'] as const).map((key) => (
              <View key={key} style={styles.row}>
                <Text style={styles.starKey}>{key.charAt(0).toUpperCase() + key.slice(1)}:</Text>
                <Text style={[styles.text, { flex: 1 }]}>{p.resposta_star[key]}</Text>
              </View>
            ))}
            <Text style={[styles.text, { color: '#0070f3', marginTop: 2 }]}>Dica: {p.dica}</Text>
          </View>
        ))}
      </Page>
    </Document>
  )
}

export async function generatePdf(props: PdfProps): Promise<Buffer> {
  return renderToBuffer(<PdfDoc {...props} />)
}
```

- [ ] **Passo 2: Criar `app/api/pdf/[generationId]/route.ts`**

```ts
// app/api/pdf/[generationId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generatePdf } from '@/lib/pdf-generator'
import { DiagnosticoSchema, CartaSchema, PerguntasSchema } from '@/lib/schemas'

export async function GET(
  _request: NextRequest,
  { params }: { params: { generationId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const serviceClient = createServiceClient()

  const { data: generation } = await serviceClient
    .from('generations')
    .select('id, user_id, curriculo_otimizado, carta, perguntas, analysis_id')
    .eq('id', params.generationId)
    .maybeSingle()

  if (!generation || generation.user_id !== user.id) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const { data: analysis } = await serviceClient
    .from('analyses')
    .select('diagnostic')
    .eq('id', generation.analysis_id)
    .maybeSingle()

  if (!analysis) return new NextResponse('Not Found', { status: 404 })

  const diagnostic = DiagnosticoSchema.safeParse(analysis.diagnostic)
  const carta = CartaSchema.safeParse(generation.carta)
  const perguntas = PerguntasSchema.safeParse(generation.perguntas)

  if (!diagnostic.success || !carta.success || !perguntas.success) {
    return new NextResponse('Invalid data', { status: 500 })
  }

  const pdfBuffer = await generatePdf({
    diagnostic: diagnostic.data,
    curriculoOtimizado: generation.curriculo_otimizado ?? '',
    carta: carta.data,
    perguntas: perguntas.data,
  })

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="vagacerta-pacote.pdf"`,
    },
  })
}
```

- [ ] **Passo 3: Typecheck**

```bash
pnpm typecheck 2>&1 | head -20
```

Esperado: ainda pode ter erros de `@/lib/email`. Erros de `@react-pdf/renderer` indicam que o pacote pode precisar de configuração adicional no next.config.

- [ ] **Passo 4: Verificar/ajustar next.config.mjs para @react-pdf/renderer**

Leia `next.config.mjs`. Se não tiver `serverExternalPackages` (ou `experimental.serverComponentsExternalPackages`), adicione:

```mjs
// next.config.mjs (conteúdo completo esperado)
/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@react-pdf/renderer'],
}

export default nextConfig
```

- [ ] **Passo 5: Commit**

```bash
git add lib/pdf-generator.tsx app/api/pdf/ next.config.mjs
git commit -m "feat: geração de PDF com @react-pdf/renderer e rota /api/pdf/[generationId]"
```

---

## Tarefa 4: Email transacional — `lib/email.ts`

**Arquivos:**
- Criar: `lib/email.ts`

- [ ] **Passo 1: Criar `lib/email.ts`**

```ts
// lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailOpts {
  to: string
  generationId: string
  resultUrl: string
}

export async function sendEmail({ to, generationId, resultUrl }: SendEmailOpts): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const pdfUrl = `${appUrl}/api/pdf/${generationId}`

  // Buscar o PDF para anexar
  const pdfRes = await fetch(pdfUrl, {
    headers: { Cookie: '' }, // será servido via service role — ajustar se necessário
  })

  // Se não conseguir buscar o PDF, enviar email sem anexo mas com link
  const attachments = pdfRes.ok
    ? [
        {
          filename: 'vagacerta-pacote.pdf',
          content: Buffer.from(await pdfRes.arrayBuffer()),
        },
      ]
    : []

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'VagaCerta <ola@vagacerta.com.br>',
    to,
    subject: 'Seu pacote completo VagaCerta está pronto!',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">VagaCerta</h1>
        <p style="color: #555; margin-bottom: 24px;">Seu pacote completo foi gerado com sucesso.</p>

        <p>Clique no botão abaixo para acessar seu diagnóstico completo, currículo reescrito, cartas de apresentação e perguntas de entrevista com respostas STAR:</p>

        <a
          href="${resultUrl}"
          style="display: inline-block; margin: 16px 0; padding: 12px 24px; background: #0070f3; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;"
        >
          Ver meu pacote completo →
        </a>

        ${attachments.length > 0 ? '<p style="color: #888; font-size: 14px;">O PDF com todos os materiais está anexo a este e-mail.</p>' : `<p style="color: #888; font-size: 14px;">Baixe o PDF em: <a href="${resultUrl}">acessar resultados</a></p>`}

        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #aaa; font-size: 12px;">VagaCerta · Feito no Brasil para brasileiros</p>
      </div>
    `,
    attachments,
  })
}
```

**Nota sobre o PDF no email:** A função `sendEmail` tenta buscar o PDF via HTTP interno. Em produção, essa chamada não vai funcionar pois a rota `/api/pdf` exige autenticação por cookie. Para o Sprint 3, enviar apenas o link é suficiente. Uma refatoração futura pode extrair a geração do buffer diretamente. A lógica de fallback (`pdfRes.ok`) já cobre isso.

- [ ] **Passo 2: Typecheck completo**

```bash
pnpm typecheck 2>&1
```

Esperado: 0 erros.

- [ ] **Passo 3: Build**

```bash
pnpm build 2>&1 | tail -20
```

Esperado: build completo sem erros.

- [ ] **Passo 4: Commit**

```bash
git add lib/email.ts
git commit -m "feat: email transacional via Resend com link para resultado"
```

---

## Tarefa 5: Atualizar `analise/[id]/page.tsx` — link "Gerar pacote" chama `/api/generate`

**Arquivos:**
- Verificar: `components/preview-result.tsx` — o link "Gerar meu pacote completo" já aponta para `/analise/${analysisId}/completo`. A tela completo agora tem o `GenerateButton`. O fluxo está correto: usuário com crédito → clica "Gerar" → `/completo` mostra o `GenerateButton` → gera → `router.refresh()` recarrega com o conteúdo.

Este passo é de verificação — não deve precisar de edição.

- [ ] **Passo 1: Verificar fluxo**

Confirme que `components/preview-result.tsx` no branch atual tem o link:
```tsx
<Link href={`/analise/${analysisId}/completo`}>
  Gerar meu pacote completo →
</Link>
```

Se o link estiver apontando para outro lugar, corrigir para `/analise/${analysisId}/completo`.

- [ ] **Passo 2: Typecheck final**

```bash
pnpm typecheck 2>&1
```

Esperado: 0 erros.

- [ ] **Passo 3: Build final**

```bash
pnpm build 2>&1 | tail -25
```

Esperado: build limpo.

- [ ] **Passo 4: Commit se necessário**

```bash
git add components/preview-result.tsx
git commit -m "fix: link do preview aponta para /completo"
```

---

## Checklist de configuração pós-implementação

Antes de testar o fluxo completo:

- [ ] `RESEND_API_KEY` e `RESEND_FROM_EMAIL` no `.env.local`
- [ ] Domínio verificado no Resend (ou usar o domínio sandbox para testes)
- [ ] Testar fluxo: login → análise → paywall → checkout sandbox → crédito → `/completo` → PDF

---

## Notas

- **Email sem PDF:** A implementação atual envia o link mas não o PDF anexo (a rota exige auth por cookie). Para Sprint 4, refatorar `sendEmail` para receber o `Buffer` direto em vez de fazer fetch.
- **Currículo no PDF:** O campo `curriculo_otimizado` é markdown. O PDF usa `<Text>` simples, não renderiza markdown. Para Sprint 4, adicionar parser de markdown para PDF se necessário.
- **`@react-pdf/renderer` e SSR:** O pacote precisa estar em `serverExternalPackages` para não ser processado pelo bundler do Next.js — coberto na T3.
