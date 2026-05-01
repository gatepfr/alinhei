'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download, Copy, Check, Share2, TrendingUp, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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

function scoreColor(nota: number) {
  if (nota >= 75) return 'text-green-600'
  if (nota >= 60) return 'text-yellow-600'
  return 'text-red-500'
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
      {/* Header com score + ações */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pacote completo</h1>
          <p className="text-muted-foreground mt-1">Currículo, cartas e simulado de entrevista prontos.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/api/pdf/${generationId}`} target="_blank">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Baixar PDF
            </Button>
          </Link>
          <Link href={linkedinShareUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="w-4 h-4" />
              Compartilhar
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="diagnostico">
        <TabsList className="w-full grid grid-cols-4 mb-6">
          <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>
          <TabsTrigger value="curriculo">Currículo</TabsTrigger>
          <TabsTrigger value="cartas">Cartas</TabsTrigger>
          <TabsTrigger value="entrevista">Entrevista</TabsTrigger>
        </TabsList>

        {/* Diagnóstico completo */}
        <TabsContent value="diagnostico" className="space-y-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className={`text-5xl font-bold ${scoreColor(nota)}`}>{nota}</div>
              <div className="text-base font-medium mt-1">Nota de aderência</div>
              <p className="text-sm text-muted-foreground mt-2">{diagnostico.resumo_nota}</p>
            </CardContent>
          </Card>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <h3 className="font-semibold">Pontos fortes</h3>
              <Badge variant="secondary" className="text-xs">3 no total</Badge>
            </div>
            <div className="space-y-3">
              {diagnostico.pontos_fortes.map((p, i) => (
                <Card key={i} className="border-green-100">
                  <CardContent className="pt-4">
                    <p className="font-medium text-green-700">{p.titulo}</p>
                    <p className="text-sm text-muted-foreground mt-1">{p.explicacao}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold">Gaps críticos</h3>
              <Badge variant="secondary" className="text-xs">3 no total</Badge>
            </div>
            <div className="space-y-3">
              {diagnostico.gaps_criticos.map((g, i) => (
                <Card key={i} className="border-amber-100">
                  <CardContent className="pt-4">
                    <p className="font-medium text-amber-700">{g.titulo}</p>
                    <p className="text-sm text-muted-foreground mt-1">{g.explicacao}</p>
                    <p className="text-sm text-indigo-600 mt-2 font-medium">
                      Como resolver: {g.como_resolver}
                    </p>
                  </CardContent>
                </Card>
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
              <Card>
                <CardContent className="pt-6">
                  <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-800">
                    {curriculoOtimizado}
                  </pre>
                </CardContent>
              </Card>
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
                  <h3 className="font-semibold flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-blue-600" />
                    LinkedIn — candidatura
                  </h3>
                  <CopyButton text={carta.linkedin} label="Copiar" />
                </div>
                <Card className="border-blue-100">
                  <CardContent className="pt-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{carta.linkedin}</p>
                  </CardContent>
                </Card>
                <p className="text-xs text-muted-foreground mt-1">
                  Use em "Adicionar uma nota" ao se candidatar no LinkedIn (max 300 caracteres).
                </p>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">E-mail de candidatura</h3>
                  <CopyButton text={carta.email} label="Copiar" />
                </div>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{carta.email}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <EmptyState message="Cartas não disponíveis." />
          )}
        </TabsContent>

        {/* Perguntas STAR */}
        <TabsContent value="entrevista">
          {perguntas ? (
            <div className="space-y-4">
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
    <Card className={item.tipo === 'comportamental' ? 'border-indigo-100' : 'border-slate-200'}>
      <CardContent className="pt-4">
        <button
          className="w-full text-left"
          onClick={() => setOpen((v) => !v)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-muted-foreground font-mono text-sm mt-0.5">{index}.</span>
              <div>
                <p className="font-medium text-sm">{item.pergunta}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.por_que_pode_cair}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs shrink-0 capitalize">
              {item.tipo}
            </Badge>
          </div>
        </button>

        {open && (
          <div className="mt-4 pt-4 border-t space-y-2">
            <STARRow label="Situação" text={item.resposta_star.situacao} />
            <STARRow label="Tarefa" text={item.resposta_star.tarefa} />
            <STARRow label="Ação" text={item.resposta_star.acao} />
            <STARRow label="Resultado" text={item.resposta_star.resultado} />
            {item.dica && (
              <p className="text-xs text-indigo-600 pt-1">Dica: {item.dica}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function STARRow({ label, text }: { label: string; text: string }) {
  return (
    <div className="text-sm">
      <span className="font-semibold">{label}: </span>
      <span className="text-muted-foreground">{text}</span>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground text-sm">{message}</div>
  )
}
