'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, MessageSquare, XCircle, Building2, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type Status = 'analisado' | 'candidatado' | 'entrevista' | 'feedback' | 'reprovado'

interface Analysis {
  id: string
  created_at: string
  status: Status
  job_title: string | null
  company_name: string | null
  diagnostic: {
    nota_aderencia?: number
    preview_publico?: { nota?: number; ponto_forte_destaque?: string }
  }
}

interface CRMBoardProps {
  analyses: Analysis[]
}

const STATUS_CONFIG = {
  analisado: { label: 'Analisado', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Clock },
  candidatado: { label: 'Candidatado', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: CheckCircle },
  entrevista: { label: 'Entrevista', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: MessageSquare },
  feedback: { label: 'Feedback', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle },
  reprovado: { label: 'Reprovado', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
}

export function CRMBoard({ analyses: initialAnalyses }: CRMBoardProps) {
  const [analyses, setAnalyses] = useState(initialAnalyses)

  const updateStatus = async (id: string, newStatus: Status) => {
    // Optimistic update
    const previousAnalyses = [...analyses]
    setAnalyses(analyses.map(a => a.id === id ? { ...a, status: newStatus } : a))

    try {
      const res = await fetch(`/api/analyses/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) throw new Error('Failed to update status')
    } catch {
      setAnalyses(previousAnalyses)
      alert('Erro ao atualizar status. Tente novamente.')
    }
  }

  const grouped = {
    analisado: analyses.filter(a => a.status === 'analisado'),
    candidatado: analyses.filter(a => a.status === 'candidatado'),
    entrevista: analyses.filter(a => a.status === 'entrevista'),
    finalizado: analyses.filter(a => a.status === 'feedback' || a.status === 'reprovado'),
  }

  return (
    <Tabs defaultValue="analisado" className="w-full">
      <TabsList className="grid grid-cols-4 w-full mb-6">
        <TabsTrigger value="analisado" className="text-xs sm:text-sm gap-1.5">
          Analisado <span className="opacity-50 text-[10px] sm:text-xs">({grouped.analisado.length})</span>
        </TabsTrigger>
        <TabsTrigger value="candidatado" className="text-xs sm:text-sm gap-1.5">
          Candidatado <span className="opacity-50 text-[10px] sm:text-xs">({grouped.candidatado.length})</span>
        </TabsTrigger>
        <TabsTrigger value="entrevista" className="text-xs sm:text-sm gap-1.5">
          Entrevista <span className="opacity-50 text-[10px] sm:text-xs">({grouped.entrevista.length})</span>
        </TabsTrigger>
        <TabsTrigger value="finalizado" className="text-xs sm:text-sm gap-1.5">
          Finalizado <span className="opacity-50 text-[10px] sm:text-xs">({grouped.finalizado.length})</span>
        </TabsTrigger>
      </TabsList>

      {Object.entries(grouped).map(([key, items]) => (
        <TabsContent key={key} value={key} className="space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-border">
              <p className="text-sm text-muted-foreground">Nenhuma candidatura nesta etapa.</p>
            </div>
          ) : (
            items.map(analysis => (
              <AnalysisCard 
                key={analysis.id} 
                analysis={analysis} 
                onStatusChange={(status) => updateStatus(analysis.id, status)} 
              />
            ))
          )}
        </TabsContent>
      ))}
    </Tabs>
  )
}

function AnalysisCard({ analysis, onStatusChange }: { analysis: Analysis, onStatusChange: (status: Status) => void }) {
  const diagnostic = analysis.diagnostic as any
  const cargo = analysis.job_title || diagnostic?.preview_publico?.ponto_forte_destaque || 'Análise de currículo'
  const empresa = analysis.company_name || 'Empresa não informada'
  const nota = diagnostic?.nota_aderencia ?? diagnostic?.preview_publico?.nota
  
  const config = STATUS_CONFIG[analysis.status]
  const Icon = config.icon

  return (
    <Card className="overflow-hidden border-border/60 hover:border-primary/30 transition-all group">
      <CardContent className="p-0">
        <div className="p-5 flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-bold py-0 h-5", config.color)}>
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>
              {nota !== undefined && (
                <Badge variant="secondary" className="text-[10px] font-bold h-5">
                  {nota}% Match
                </Badge>
              )}
            </div>
            <h3 className="font-display font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">
              {cargo}
            </h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {empresa}
              </div>
              <div className="w-1 h-1 rounded-full bg-border" />
              <div>{new Date(analysis.created_at).toLocaleDateString('pt-BR')}</div>
            </div>
          </div>
          
          <Link 
            href={`/analise/${analysis.id}`}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shrink-0"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="bg-muted/30 px-5 py-2.5 border-t border-border/40 flex items-center justify-end gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mr-auto">Mover:</span>
          <div className="flex items-center gap-1">
            {analysis.status !== 'analisado' && (
              <button 
                onClick={() => onStatusChange('analisado')}
                title="Analisado"
                className="text-[10px] font-bold px-2 py-1 rounded bg-background border border-border hover:border-blue-500/50 hover:text-blue-400 transition-colors shadow-sm"
              >
                A
              </button>
            )}
            {analysis.status !== 'candidatado' && (
              <button 
                onClick={() => onStatusChange('candidatado')}
                title="Candidatado"
                className="text-[10px] font-bold px-2 py-1 rounded bg-background border border-border hover:border-purple-500/50 hover:text-purple-400 transition-colors shadow-sm"
              >
                C
              </button>
            )}
            {analysis.status !== 'entrevista' && (
              <button 
                onClick={() => onStatusChange('entrevista')}
                title="Entrevista"
                className="text-[10px] font-bold px-2 py-1 rounded bg-background border border-border hover:border-amber-500/50 hover:text-amber-400 transition-colors shadow-sm"
              >
                E
              </button>
            )}
            {analysis.status !== 'feedback' && (
              <button 
                onClick={() => onStatusChange('feedback')}
                title="Feedback"
                className="text-[10px] font-bold px-2 py-1 rounded bg-background border border-border hover:border-emerald-500/50 hover:text-emerald-400 transition-colors shadow-sm"
              >
                F
              </button>
            )}
            {analysis.status !== 'reprovado' && (
              <button 
                onClick={() => onStatusChange('reprovado')}
                title="Reprovado"
                className="text-[10px] font-bold px-2 py-1 rounded bg-background border border-border hover:border-red-500/50 hover:text-red-400 transition-colors shadow-sm"
              >
                R
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
