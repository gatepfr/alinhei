'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download, Copy, Check, Share2, TrendingUp, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Diagnostico, Carta, Perguntas } from '@/lib/schemas'

interface CompleteResultProps {
  diagnostico: Diagnostico
  curriculoOtimizado: string | null
  carta: Carta | null
  perguntas: Perguntas | null
  generationId: string
  analysisId: string
}

function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="gap-2 border-border bg-secondary hover:bg-secondary/80 text-foreground"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copiado!' : label}
    </Button>
  )
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
        <circle cx="68" cy="68" r={radius} fill="none" stroke="oklch(0.22 0.006 265)" strokeWidth="10" />
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
      <div className="absolute text-center">
        <span className="font-display text-4xl font-bold leading-none" style={{ color }}>{score}</span>
        <span className="text-muted-foreground text-base">%</span>
      </div>
    </div>
  )
}

export function CompleteResult({
  diagnostico,
  curriculoOtimizado,
  carta,
  perguntas,
  generationId,
  analysisId,
}: CompleteResultProps) {
  const nota = diagnostico.nota_aderencia
  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const pageUrl = `${appUrl}/analise/${analysisId}/completo`
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4 animate-fade-up">
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Pacote completo</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">Tudo pronto para você</h1>
          <p className="text-muted-foreground mt-1 text-sm">Currículo, cartas e simulado de entrevista.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/api/pdf/${generationId}`} target="_blank">
            <Button variant="outline" size="sm" className="gap-2 border-border bg-secondary hover:bg-secondary/80 text-foreground">
              <Download className="w-4 h-4" />
              Baixar PDF
            </Button>
          </Link>
          <Link href={linkedinShareUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-2 border-border bg-secondary hover:bg-secondary/80 text-foreground">
              <Share2 className="w-4 h-4" />
              Compartilhar
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="diagnostico" className="animate-fade-up delay-100">
        <TabsList className="w-full grid grid-cols-4 mb-6 bg-secondary border border-border h-10">
          <TabsTrigger value="diagnostico" className="text-xs data-active:bg-primary data-active:text-primary-foreground">Diagnóstico</TabsTrigger>
          <TabsTrigger value="curriculo" className="text-xs data-active:bg-primary data-active:text-primary-foreground">Currículo</TabsTrigger>
          <TabsTrigger value="cartas" className="text-xs data-active:bg-primary data-active:text-primary-foreground">Cartas</TabsTrigger>
          <TabsTrigger value="entrevista" className="text-xs data-active:bg-primary data-active:text-primary-foreground">Entrevista</TabsTrigger>
        </TabsList>

        {/* Diagnóstico */}
        <TabsContent value="diagnostico" className="space-y-5">
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-5">
              Nota de aderência
            </p>
            <div className="flex justify-center mb-4">
              <ScoreRing score={nota} />
            </div>
            <p className="font-display text-lg font-semibold mb-2" style={{ color: scoreColor(nota) }}>
              {scoreLabel(nota)}
            </p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {diagnostico.resumo_nota}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <h3 className="font-display font-semibold text-sm">Pontos fortes</h3>
              <span className="text-xs bg-secondary text-muted-foreground border border-border rounded-full px-2 py-0.5">3 no total</span>
            </div>
            <div className="space-y-3">
              {diagnostico.pontos_fortes.map((p, i) => (
                <div key={i} className="bg-card rounded-xl border border-emerald-500/20 p-5">
                  <p className="font-semibold text-emerald-400 text-sm mb-1">{p.titulo}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.explicacao}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border" />

          <div>
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <h3 className="font-display font-semibold text-sm">Gaps críticos</h3>
              <span className="text-xs bg-secondary text-muted-foreground border border-border rounded-full px-2 py-0.5">3 no total</span>
            </div>
            <div className="space-y-3">
              {diagnostico.gaps_criticos.map((g, i) => (
                <div key={i} className="bg-card rounded-xl border border-amber-500/20 p-5">
                  <p className="font-semibold text-amber-400 text-sm mb-1">{g.titulo}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{g.explicacao}</p>
                  <p className="text-sm text-primary/80 mt-2 font-medium">
                    Como resolver: {g.como_resolver}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Currículo */}
        <TabsContent value="curriculo">
          {curriculoOtimizado ? (
            <div className="space-y-3">
              <div className="flex justify-end">
                <CopyButton text={curriculoOtimizado} label="Copiar currículo" />
              </div>
              <div className="bg-card rounded-xl border border-border p-6">
                <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-muted-foreground">
                  {curriculoOtimizado}
                </pre>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Copie o texto acima e cole no seu editor de documentos favorito.
              </p>
            </div>
          ) : (
            <EmptyState message="Currículo não disponível." />
          )}
        </TabsContent>

        {/* Cartas */}
        <TabsContent value="cartas">
          {carta ? (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold text-sm flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Share2 className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    LinkedIn — candidatura
                  </h3>
                  <CopyButton text={carta.linkedin} label="Copiar" />
                </div>
                <div className="bg-card rounded-xl border border-blue-500/20 p-5">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{carta.linkedin}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Use em "Adicionar uma nota" ao se candidatar no LinkedIn (max 300 caracteres).
                </p>
              </div>

              <div className="border-t border-border" />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold text-sm">E-mail de candidatura</h3>
                  <CopyButton text={carta.email} label="Copiar" />
                </div>
                <div className="bg-card rounded-xl border border-border p-5">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{carta.email}</p>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState message="Cartas não disponíveis." />
          )}
        </TabsContent>

        {/* Entrevista STAR */}
        <TabsContent value="entrevista">
          {perguntas ? (
            <div className="space-y-3">
              {perguntas.perguntas.map((p, i) => (
                <STARItem key={i} index={i + 1} item={p} />
              ))}
            </div>
          ) : (
            <EmptyState message="Perguntas não disponíveis." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

type PerguntaItem = Perguntas['perguntas'][number]

function STARItem({ index, item }: { index: number; item: PerguntaItem }) {
  const [open, setOpen] = useState(false)
  const isBehavioral = item.tipo === 'comportamental'

  return (
    <div className={`bg-card rounded-xl border p-5 transition-colors ${isBehavioral ? 'border-primary/20' : 'border-border'}`}>
      <button className="w-full text-left" onClick={() => setOpen((v) => !v)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-muted-foreground/50 font-mono text-sm mt-0.5 shrink-0">{index}.</span>
            <div>
              <p className="font-medium text-sm">{item.pergunta}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.por_que_pode_cair}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${
              isBehavioral
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-secondary text-muted-foreground border-border'
            }`}>
              {item.tipo}
            </span>
            {open
              ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
              : <ChevronDown className="w-4 h-4 text-muted-foreground" />
            }
          </div>
        </div>
      </button>

      {open && (
        <div className="mt-4 pt-4 border-t border-border space-y-2.5">
          <STARRow label="Situação" text={item.resposta_star.situacao} />
          <STARRow label="Tarefa" text={item.resposta_star.tarefa} />
          <STARRow label="Ação" text={item.resposta_star.acao} />
          <STARRow label="Resultado" text={item.resposta_star.resultado} />
          {item.dica && (
            <p className="text-xs text-primary/80 pt-1 font-medium">Dica: {item.dica}</p>
          )}
        </div>
      )}
    </div>
  )
}

function STARRow({ label, text }: { label: string; text: string }) {
  return (
    <div className="text-sm">
      <span className="font-semibold text-foreground">{label}: </span>
      <span className="text-muted-foreground">{text}</span>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-14 text-muted-foreground text-sm bg-card rounded-xl border border-border">
      {message}
    </div>
  )
}
