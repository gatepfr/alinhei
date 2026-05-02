'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download, Copy, Check, Share2, TrendingUp, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copiado!' : label}
    </Button>
  )
}

function scoreColorClass(nota: number) {
  if (nota >= 75) return 'text-emerald-400'
  if (nota >= 60) return 'text-amber-400'
  return 'text-red-400'
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
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${appUrl}/analise/${analysisId}/completo`)}`

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pacote completo</h1>
          <p className="text-muted-foreground mt-1 text-sm">Currículo, cartas e simulado de entrevista prontos.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/api/pdf/${generationId}`} target="_blank">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Baixar PDF</span>
            </Button>
          </Link>
          <Link href={linkedinShareUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Compartilhar</span>
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="diagnostico">
        <TabsList className="w-full grid grid-cols-4 mb-6 h-auto">
          <TabsTrigger value="diagnostico" className="text-xs px-1 py-2">Diagnóstico</TabsTrigger>
          <TabsTrigger value="curriculo" className="text-xs px-1 py-2">Currículo</TabsTrigger>
          <TabsTrigger value="cartas" className="text-xs px-1 py-2">Cartas</TabsTrigger>
          <TabsTrigger value="entrevista" className="text-xs px-1 py-2">Entrevista</TabsTrigger>
        </TabsList>

        {/* Diagnóstico completo */}
        <TabsContent value="diagnostico" className="space-y-6">
          <div className="bg-card rounded-2xl border border-border p-6 text-center">
            <div className={`text-5xl font-bold ${scoreColorClass(nota)}`}>{nota}</div>
            <div className="text-base font-medium mt-1">Nota de aderência</div>
            <p className="text-sm text-muted-foreground mt-2">{diagnostico.resumo_nota}</p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-sm">Pontos fortes</h3>
              <Badge variant="secondary" className="text-xs">3 no total</Badge>
            </div>
            <div className="space-y-3">
              {diagnostico.pontos_fortes.map((p, i) => (
                <div key={i} className="bg-card rounded-xl border border-emerald-500/20 p-4">
                  <p className="font-medium text-emerald-400 text-sm">{p.titulo}</p>
                  <p className="text-sm text-muted-foreground mt-1">{p.explicacao}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <h3 className="font-semibold text-sm">Gaps críticos</h3>
              <Badge variant="secondary" className="text-xs">3 no total</Badge>
            </div>
            <div className="space-y-3">
              {diagnostico.gaps_criticos.map((g, i) => (
                <div key={i} className="bg-card rounded-xl border border-amber-500/20 p-4">
                  <p className="font-medium text-amber-400 text-sm">{g.titulo}</p>
                  <p className="text-sm text-muted-foreground mt-1">{g.explicacao}</p>
                  {g.como_resolver && (
                    <p className="text-sm text-primary mt-3 pt-3 border-t border-border font-medium">
                      Como resolver: {g.como_resolver}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Currículo otimizado */}
        <TabsContent value="curriculo">
          {curriculoOtimizado ? (
            <div className="space-y-3">
              <div className="flex justify-end">
                <CopyButton text={curriculoOtimizado} label="Copiar currículo" />
              </div>
              <div className="bg-card rounded-xl border border-border p-5">
                <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground">
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
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-blue-400" />
                    LinkedIn — candidatura
                  </h3>
                  <CopyButton text={carta.linkedin} label="Copiar" />
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{carta.linkedin}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Use em "Adicionar uma nota" ao se candidatar no LinkedIn (max 300 caracteres).
                </p>
              </div>
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">E-mail de candidatura</h3>
                  <CopyButton text={carta.email} label="Copiar" />
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{carta.email}</p>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState message="Cartas não disponíveis." />
          )}
        </TabsContent>

        {/* Perguntas STAR */}
        <TabsContent value="entrevista">
          {perguntas ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground mb-1">
                Clique em cada pergunta para ver a resposta STAR sugerida.
              </p>
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

  return (
    <div className={`bg-card rounded-xl border overflow-hidden ${item.tipo === 'comportamental' ? 'border-primary/20' : 'border-border'}`}>
      <button
        className="w-full text-left p-4 hover:bg-secondary/50 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-muted-foreground font-mono text-sm mt-0.5 shrink-0">{index}.</span>
            <div>
              <p className="font-medium text-sm text-foreground">{item.pergunta}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.por_que_pode_cair}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-0.5">
            <Badge variant="outline" className="text-xs capitalize hidden sm:flex">
              {item.tipo}
            </Badge>
            {open
              ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
              : <ChevronRight className="w-4 h-4 text-muted-foreground" />
            }
          </div>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-border">
          <div className="pt-3 space-y-2">
            <STARRow label="Situação" text={item.resposta_star.situacao} />
            <STARRow label="Tarefa" text={item.resposta_star.tarefa} />
            <STARRow label="Ação" text={item.resposta_star.acao} />
            <STARRow label="Resultado" text={item.resposta_star.resultado} />
            {item.dica && (
              <p className="text-xs text-primary pt-1">Dica: {item.dica}</p>
            )}
          </div>
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
    <div className="text-center py-12 text-muted-foreground text-sm">{message}</div>
  )
}
