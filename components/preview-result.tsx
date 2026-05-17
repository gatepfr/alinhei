'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { Lock, TrendingUp, AlertTriangle, ArrowRight, Zap, Share2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PaywallModal } from '@/components/paywall-modal'
import { trackEvent } from '@/lib/analytics'
import type { Diagnostico } from '@/lib/schemas'
import type { Products } from '@/lib/products'

interface PreviewResultProps {
  diagnostic: Diagnostico
  analysisId: string
  userId: string | null
  balance: number
  hasGeneration?: boolean
  showPaywallInitial?: boolean
  products?: Products
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
          strokeWidth="10"
          style={{ stroke: 'var(--border)' }}
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

function ShareButton({ analysisId, nota, cargo }: { analysisId: string; nota: number; cargo?: string }) {
  const [copied, setCopied] = useState(false)

  const pageUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/analise/${analysisId}`
    : `/analise/${analysisId}`

  const text = `Meu currículo tem ${nota}/100 de aderência${cargo ? ` para ${cargo}` : ''}. Analise o seu grátis:`

  const shareWhatsApp = useCallback(() => {
    trackEvent('linkedin_share_clicked', { channel: 'whatsapp', nota })
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${pageUrl}`)}`, '_blank')
  }, [text, pageUrl, nota])

  const copyLink = useCallback(async () => {
    trackEvent('linkedin_share_clicked', { channel: 'copy', nota })
    await navigator.clipboard.writeText(pageUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [pageUrl, nota])

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <span className="text-xs text-muted-foreground">Compartilhar resultado:</span>
      <button
        onClick={shareWhatsApp}
        className="inline-flex items-center gap-1.5 text-xs bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/25 text-[#25D366] rounded-full px-3 py-1.5 transition-colors"
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        WhatsApp
      </button>
      <button
        onClick={copyLink}
        className="inline-flex items-center gap-1.5 text-xs bg-secondary hover:bg-secondary/80 border border-border text-muted-foreground hover:text-foreground rounded-full px-3 py-1.5 transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
        {copied ? 'Copiado!' : 'Copiar link'}
      </button>
    </div>
  )
}

export function PreviewResult({
  diagnostic,
  analysisId,
  userId,
  balance,
  hasGeneration = false,
  showPaywallInitial = false,
  products,
}: PreviewResultProps) {
  const { preview_publico, pontos_fortes, gaps_criticos, resumo_nota, keywords_faltantes } = diagnostic
  const [showPaywall, setShowPaywall] = useState(showPaywallInitial)
  const [analysisSeconds, setAnalysisSeconds] = useState<number | null>(null)

  useEffect(() => {
    trackEvent('analysis_viewed', { nota: preview_publico.nota, logged_in: !!userId })
    const start = localStorage.getItem('analysis_start')
    if (start) {
      const secs = Math.round((Date.now() - parseInt(start, 10)) / 1000)
      if (secs > 0 && secs < 120) setAnalysisSeconds(secs)
      localStorage.removeItem('analysis_start')
    }
  }, [analysisId, preview_publico.nota, userId])

  return (
    <div className="space-y-5">
      {showPaywall && (
        <PaywallModal products={products} analysisId={analysisId} onClose={() => setShowPaywall(false)} />
      )}

      {/* Score */}
      <div className="bg-card rounded-2xl border border-border p-8 text-center animate-fade-up">
        <div className="flex items-center justify-center gap-3 mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Nota de aderência
          </p>
          {analysisSeconds !== null && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-2 py-0.5">
              ⚡ {analysisSeconds}s
            </span>
          )}
        </div>
        <div className="flex justify-center mb-4">
          <ScoreRing score={preview_publico.nota} />
        </div>
        <p className="font-display text-lg font-semibold mb-2" style={{ color: scoreColor(preview_publico.nota) }}>
          {scoreLabel(preview_publico.nota)}
        </p>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">{resumo_nota}</p>
        <ShareButton analysisId={analysisId} nota={preview_publico.nota} cargo={diagnostic.cargo} />
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
        {pontos_fortes.slice(1).map((item) => (
          <BlurredLockedItem
            key={item.titulo}
            titulo={item.titulo}
            explicacao={item.explicacao}
            borderClass="border-emerald-500/15"
            textClass="text-emerald-400"
          />
        ))}
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
        {gaps_criticos.slice(1).map((item) => (
          <BlurredLockedItem
            key={item.titulo}
            titulo={item.titulo}
            explicacao={item.explicacao}
            borderClass="border-amber-500/15"
            textClass="text-amber-400"
          />
        ))}
      </div>

      {keywords_faltantes.length > 0 && (
        <>
          <div className="border-t border-border" />
          <KeywordGapSection keywords={keywords_faltantes} />
        </>
      )}

      <div className="border-t border-border" />

      {/* CTA */}
      <div className="animate-fade-up delay-300">
        <PaywallCTA
          analysisId={analysisId}
          userId={userId}
          balance={balance}
          hasGeneration={hasGeneration}
          onOpenPaywall={() => setShowPaywall(true)}
          products={products}
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
  products,
}: {
  analysisId: string
  userId: string | null
  balance: number
  hasGeneration: boolean
  onOpenPaywall: () => void
  products?: Products
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

  const singlePrice = products?.single.price ?? 9.90

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
          Liberar pacote — R$ {singlePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} no PIX
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
        {products ? (
          `Também disponível: ${products.pack3.credits} análises por R$ ${products.pack3.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} · ${products.pack10.credits} por R$ ${products.pack10.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ) : (
          'Também disponível: 3 análises por R$ 19,90 · 10 análises por R$ 49,90'
        )}
      </p>
    </div>
  )
}

function KeywordGapSection({ keywords }: { keywords: string[] }) {
  if (keywords.length === 0) return null

  const visible = keywords.slice(0, 2)
  const locked = keywords.slice(2)

  return (
    <div className="animate-fade-up delay-150">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-6 h-6 rounded-md bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
        </div>
        <h3 className="font-display font-semibold text-sm">Keywords ausentes no seu currículo</h3>
        <span className="text-xs bg-secondary text-muted-foreground border border-border rounded-full px-2 py-0.5">grátis</span>
      </div>
      <div className="bg-card rounded-xl border border-red-500/20 p-4">
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
          A vaga pede estas palavras-chave que não aparecem no seu currículo:
        </p>
        <div className="flex flex-wrap gap-2">
          {visible.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center gap-1 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-full px-2.5 py-1"
            >
              ✗ {kw}
            </span>
          ))}
          {locked.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs bg-secondary border border-border text-muted-foreground/50 rounded-full px-2.5 py-1 blur-[2px] select-none">
              <Lock className="w-2.5 h-2.5" />
              {locked[0]}
            </span>
          )}
          {locked.length > 1 && (
            <span className="inline-flex items-center gap-1 text-xs bg-secondary border border-border text-muted-foreground/60 rounded-full px-2.5 py-1">
              <Lock className="w-2.5 h-2.5" />
              +{locked.length - 1} no pacote
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function BlurredLockedItem({
  titulo,
  explicacao,
  borderClass,
  textClass,
}: {
  titulo: string
  explicacao: string
  borderClass: string
  textClass: string
}) {
  return (
    <div className={`mt-2 border ${borderClass} rounded-xl p-4 relative overflow-hidden select-none`}>
      <div className="blur-[3px] pointer-events-none" aria-hidden>
        <p className={`font-semibold text-sm mb-1 ${textClass}`}>{titulo}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{explicacao}</p>
      </div>
      <div className="absolute inset-0 flex items-center justify-center gap-1.5">
        <Lock className="w-3.5 h-3.5 text-muted-foreground/60" />
        <span className="text-xs text-muted-foreground/60 font-medium">Pacote completo</span>
      </div>
    </div>
  )
}
