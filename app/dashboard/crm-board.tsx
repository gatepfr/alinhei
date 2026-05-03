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
  analisado: { label: 'Pendente', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Clock },
  candidatado: { label: 'Enviado', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: CheckCircle },
  entrevista: { label: 'Entrevista', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: MessageSquare },
  feedback: { label: 'Aprovado', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle },
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

      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update status')
    } catch (err) {
      console.error('[CRMBoard] Status update error:', err)
      setAnalyses(previousAnalyses)
      alert('Erro ao atualizar status no banco de dados. Tente novamente.')
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
      <TabsList className="flex w-full mb-6 bg-muted p-1 rounded-xl border border-border/50 h-auto">
        <TabsTrigger 
          value="analisado" 
          className="flex-1 text-[11px] sm:text-sm gap-1.5 py-2.5 px-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 rounded-lg whitespace-nowrap"
        >
          Pendente <span className="opacity-70 text-[10px]">({grouped.analisado.length})</span>
        </TabsTrigger>
        <TabsTrigger 
          value="candidatado" 
          className="flex-1 text-[11px] sm:text-sm gap-1.5 py-2.5 px-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 rounded-lg whitespace-nowrap"
        >
          Enviado <span className="opacity-70 text-[10px]">({grouped.candidatado.length})</span>
        </TabsTrigger>
        <TabsTrigger 
          value="entrevista" 
          className="flex-1 text-[11px] sm:text-sm gap-1.5 py-2.5 px-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 rounded-lg whitespace-nowrap"
        >
          Entrevista <span className="opacity-70 text-[10px]">({grouped.entrevista.length})</span>
        </TabsTrigger>
        <TabsTrigger 
          value="finalizado" 
          className="flex-1 text-[11px] sm:text-sm gap-1.5 py-2.5 px-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 rounded-lg whitespace-nowrap"
        >
          Finalizado <span className="opacity-70 text-[10px]">({grouped.finalizado.length})</span>
        </TabsTrigger>
      </TabsList>

      {Object.entries(grouped).map(([key, items]) => (
        <TabsContent key={key} value={key} className="space-y-4 outline-none">
          {items.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-border/60">
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
    <Card className="overflow-hidden border-border/60 hover:border-primary/30 transition-all group shadow-sm bg-card/50">
      <CardContent className="p-0">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-1 items-start gap-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border", config.color.replace('text-', 'border-').replace('bg-', 'bg-').split(' ')[0])}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="space-y-1 min-w-0">
              <h3 className="font-display font-bold text-base sm:text-lg group-hover:text-primary transition-colors line-clamp-1">
                {cargo}
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {empresa}
                </div>
                <div className="hidden sm:block w-1 h-1 rounded-full bg-border" />
                <div>{new Date(analysis.created_at).toLocaleDateString('pt-BR')}</div>
                {nota !== undefined && (
                  <Badge variant="secondary" className="text-[10px] font-bold h-4 py-0">
                    {nota}% Match
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 self-end sm:self-center">
            <Link 
              href={`/analise/${analysis.id}`}
              className="px-4 py-2 rounded-lg border border-border flex items-center gap-2 text-xs font-bold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
            >
              Ver Detalhes
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="bg-muted/30 px-4 py-3 border-t border-border/40 flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Mover para:</span>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG['analisado']][]).map(([status, cfg]) => {
              const isCurrent = analysis.status === status
              return (
                <button 
                  key={status}
                  onClick={() => !isCurrent && onStatusChange(status)}
                  disabled={isCurrent}
                  className={cn(
                    "text-[9px] sm:text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm border whitespace-nowrap",
                    isCurrent 
                      ? cn("bg-primary text-primary-foreground border-primary cursor-default ring-2 ring-primary/20", cfg.color.split(' ')[1])
                      : "bg-background border-border hover:border-primary/50 hover:text-primary"
                  )}
                >
                  {isCurrent ? `✓ ${cfg.label}` : cfg.label}
                </button>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
