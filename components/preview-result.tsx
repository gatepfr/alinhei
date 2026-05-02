'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { Lock, TrendingUp, AlertTriangle, ArrowRight, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PaywallModal } from '@/components/paywall-modal'
import { trackEvent } from '@/lib/analytics'
import type { Diagnostico } from '@/lib/schemas'

interface PreviewResultProps {
  diagnostic: Diagnostico
  analysisId: string
  userId: string | null
  balance: number
  hasGeneration?: boolean
}

function scoreColor(nota: number): string {
  if (nota >= 75) return '#10b981'
  if (nota >= 60) return '#f59e0b'
  return '#ef4444'
}

function scoreLabel(nota: number): string {
  if (nota >= 90) return 'Excelente'
  if (nota >= 75) return 'Bom'
  if (nota >= 60) return 'Razoável'
  if (nota >= 40) return 'Fraco'
  return 'Muito fraco'
}

function ScoreRing({ score }: { score: number }) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = scoreColor(score)

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="136" height="136" style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx="68" cy="68" r={radius}
          fill="none"
          stroke="oklch(0.929 0.013 255.508)"
          strokeWidth="10"
        />
        <circle
          cx="68" cy="68" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
            filter: `drop-shadow(0 0 8px ${color}60)`,
          }}
        />
      </svg>
      <div className="absolute text-center" style={{ transform: 'rotate(0deg)' }}>
        <span className="font-display text-4xl font-bold leading-none" style={{ color }}>
          {score}
        </span>
        <span className="text-muted-foreground text-base">%</span>
      </div>
    </div>
  )
}

export function PreviewResult({ diagnostic, analysisId, userId, balance, hasGeneration = false }: PreviewResultProps) {
  const { preview_publico, pontos_fortes, gaps_criticos, resumo_nota } = diagnostic
  const [showPaywall, setShowPaywall] = useState(false)

  useEffect(() => {
    trackEvent('analysis_viewed', { nota: preview_publico.nota, logged_in: !!userId })
  }, [analysisId, preview_publico.nota, userId])

  return (
    <div className="space-y-5">
      {showPaywall && (
        <PaywallModal analysisId={analysisId} onClose={() => setShowPaywall(false)} />
      )}

      {/* Score */}
      <div className="bg-card rounded-2xl border border-border p-8 text-center animate-fade-up">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-6">
          Nota de aderência
        </p>
        <div className="flex justify-center mb-4">
          <ScoreRing score={preview_publico.nota} />
        </div>
        <p className="font-display text-lg font-semibold mb-2" style={{ color: scoreColor(preview_publico.nota) }}>
          {scoreLabel(preview_publico.nota)}
        </p>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">{resumo_nota}</p>
      </div>

      {/* Ponto forte */}
      <div className="animate-fade-up delay-100">
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <h3 className="font-display font-semibold text-sm">Ponto forte destacado</h3>
          <span className="text-xs bg-secondary text-muted-foreground border border-border rounded-full px-2 py-0.5">grátis</span>
        </div>
        <div className="bg-card rounded-xl border border-emerald-500/20 p-5">
          <p className="font-semibold text-emerald-400 text-sm mb-1">{pontos_fortes[0].titulo}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{pontos_fortes[0].explicacao}</p>
        </div>
        <LockedItems count={2} label="pontos fortes" colorClass="border-emerald-500/10 text-emerald-400/50" />
      </div>

      <div className="border-t border-border" />

      {/* Gap crítico */}
      <div className="animate-fade-up delay-200">
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <h3 className="font-display font-semibold text-sm">Gap crítico identificado</h3>
          <span className="text-xs bg-secondary text-muted-foreground border border-border rounded-full px-2 py-0.5">grátis</span>
        </div>
        <div className="bg-card rounded-xl border border-amber-500/20 p-5">
          <p className="font-semibold text-amber-400 text-sm mb-1">{gaps_criticos[0].titulo}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{gaps_criticos[0].explicacao}</p>
        </div>
        <LockedItems count={2} label="gaps críticos com como resolver" colorClass="border-amber-500/10 text-amber-400/50" />
      </div>

      <div className="border-t border-border" />

      {/* CTA */}
      <div className="animate-fade-up delay-300">
        <PaywallCTA
          analysisId={analysisId}
          userId={userId}
          balance={balance}
          hasGeneration={hasGeneration}
          onOpenPaywall={() => setShowPaywall(true)}
        />
      </div>
    </div>
  )
}

function PaywallCTA({
  analysisId,
  userId,
  balance,
  hasGeneration,
  onOpenPaywall,
}: {
  analysisId: string
  userId: string | null
  balance: number
  hasGeneration: boolean
  onOpenPaywall: () => void
}) {
  if (hasGeneration) {
    return (
      <div className="bg-emerald-500/[0.07] rounded-2xl p-6 text-center border border-emerald-500/20">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
          <Zap className="w-5 h-5 text-emerald-400" />
        </div>
        <h3 className="font-display font-bold text-lg mb-2">Seu pacote está pronto</h3>
        <p className="text-sm text-muted-foreground mb-5">
          Currículo reescrito, cartas e perguntas STAR já foram gerados para você.
        </p>
        <Link
          href={`/analise/${analysisId}/completo`}
          className={cn(
            buttonVariants({ size: 'lg' }),
            'bg-emerald-500 text-white hover:bg-emerald-500/90 h-12 px-8 text-base font-semibold group gap-2'
          )}
        >
          Ver resultado completo
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    )
  }

  if (userId && balance > 0) {
    return (
      <div className="bg-emerald-500/[0.07] rounded-2xl p-6 text-center border border-emerald-500/20">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
          <Zap className="w-5 h-5 text-emerald-400" />
        </div>
        <h3 className="font-display font-bold text-lg mb-2">
          Você tem {balance} crédito{balance > 1 ? 's' : ''}
        </h3>
        <p className="text-sm text-muted-foreground mb-5">
          Clique para gerar o currículo reescrito, as cartas e as perguntas STAR.
        </p>
        <Link
          href={`/analise/${analysisId}/completo`}
          className={cn(
            buttonVariants({ size: 'lg' }),
            'bg-emerald-500 text-white hover:bg-emerald-500/90 h-12 px-8 text-base font-semibold group gap-2'
          )}
        >
          Gerar meu pacote completo
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl p-6 text-center border border-border">
      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
        <Lock className="w-5 h-5 text-primary" />
      </div>
      <h3 className="font-display font-bold text-lg mb-2">Pacote completo bloqueado</h3>
      <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
        Desbloqueie o currículo reescrito para ATS, as 2 cartas de apresentação
        e as 5 perguntas de entrevista com respostas STAR.
      </p>
      {userId ? (
        <Button
          size="lg"
          className="h-12 px-8 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 group gap-2"
          onClick={onOpenPaywall}
        >
          Liberar pacote — R$ 9,90 no PIX
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      ) : (
        <Link
          href={`/login?next=/analise/${analysisId}`}
          className={cn(
            buttonVariants({ size: 'lg' }),
            'h-12 px-8 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 group gap-2'
          )}
        >
          Entrar para liberar o pacote
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
      <p className="text-xs text-muted-foreground mt-4">
        Também disponível: 3 análises por R$ 19,90 · 10 análises por R$ 49,90
      </p>
    </div>
  )
}

function LockedItems({
  count,
  label,
  colorClass,
}: {
  count: number
  label: string
  colorClass: string
}) {
  return (
    <div className={`mt-2 border ${colorClass} rounded-xl p-3 flex items-center gap-2 bg-secondary/30`}>
      <Lock className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
      <p className="text-xs text-muted-foreground/60">
        + {count} outros {label} no pacote completo
      </p>
    </div>
  )
}
