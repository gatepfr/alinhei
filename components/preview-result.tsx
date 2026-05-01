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
