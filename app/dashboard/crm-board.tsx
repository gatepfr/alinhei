'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock, MessageSquare, CheckCircle, XCircle, Building2, ArrowRight, Send } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Status = 'analisado' | 'candidatado' | 'entrevista' | 'feedback' | 'reprovado'
type TabKey = 'analisado' | 'candidatado' | 'entrevista' | 'finalizado'

export interface AnalysisDiagnostic {
  nota_aderencia?: number
  preview_publico?: { nota?: number; ponto_forte_destaque?: string }
}

export interface Analysis {
  id: string
  created_at: string
  status: Status
  job_title: string | null
  company_name: string | null
  diagnostic: AnalysisDiagnostic
}

// Semântica visual de cada status
const STATUS_CONFIG = {
  analisado: {
    label: 'Pendente',
    icon: Clock,
    iconCls: 'text-slate-500',
    bgCls: 'bg-slate-100 border-slate-200',
    btnSolid: 'bg-slate-600 text-white border-slate-600 shadow-sm',
  },
  candidatado: {
    label: 'Enviado',
    icon: Send,
    iconCls: 'text-blue-600',
    bgCls: 'bg-blue-50 border-blue-200',
    btnSolid: 'bg-blue-600 text-white border-blue-600 shadow-sm',
  },
  entrevista: {
    label: 'Entrevista',
    icon: MessageSquare,
    iconCls: 'text-amber-600',
    bgCls: 'bg-amber-50 border-amber-200',
    btnSolid: 'bg-amber-500 text-white border-amber-500 shadow-sm',
  },
  feedback: {
    label: 'Aprovado',
    icon: CheckCircle,
    iconCls: 'text-emerald-600',
    bgCls: 'bg-emerald-50 border-emerald-200',
    btnSolid: 'bg-emerald-600 text-white border-emerald-600 shadow-sm',
  },
  reprovado: {
    label: 'Reprovado',
    icon: XCircle,
    iconCls: 'text-red-500',
    bgCls: 'bg-red-50 border-red-200',
    btnSolid: 'bg-red-500 text-white border-red-500 shadow-sm',
  },
}

// Cor de cada aba (dot + fundo quando ativa)
const TAB_CONFIG: Record<TabKey, { label: string; dot: string; active: string }> = {
  analisado:   { label: 'Pendente',   dot: 'bg-slate-400',   active: 'bg-slate-50 text-slate-700 border-slate-200 shadow-sm' },
  candidatado: { label: 'Enviado',    dot: 'bg-blue-500',    active: 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm' },
  entrevista:  { label: 'Entrevista', dot: 'bg-amber-500',   active: 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm' },
  finalizado:  { label: 'Finalizado', dot: 'bg-emerald-500', active: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm' },
}

export function CRMBoard({ analyses: initialAnalyses }: { analyses: Analysis[] }) {
  const [analyses, setAnalyses] = useState(initialAnalyses)
  const [activeTab, setActiveTab] = useState<TabKey>('analisado')

  const grouped: Record<TabKey, Analysis[]> = {
    analisado:   analyses.filter(a => a.status === 'analisado'),
    candidatado: analyses.filter(a => a.status === 'candidatado'),
    entrevista:  analyses.filter(a => a.status === 'entrevista'),
    finalizado:  analyses.filter(a => a.status === 'feedback' || a.status === 'reprovado'),
  }

  const updateStatus = async (id: string, newStatus: Status) => {
    const prev = [...analyses]
    setAnalyses(analyses.map(a => a.id === id ? { ...a, status: newStatus } : a))
    try {
      const res = await fetch(`/api/analyses/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed')
    } catch {
      setAnalyses(prev)
      alert('Erro ao atualizar status. Tente novamente.')
    }
  }

  return (
    <div className="w-full space-y-5">
      {/* Tab bar com cor por status */}
      <div className="flex gap-1.5 p-1 bg-muted rounded-xl border border-border/50">
        {(Object.entries(TAB_CONFIG) as [TabKey, typeof TAB_CONFIG[TabKey]][]).map(([key, cfg]) => {
          const isActive = activeTab === key
          const count = grouped[key].length
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all duration-200 border',
                isActive
                  ? cfg.active
                  : 'text-muted-foreground border-transparent hover:bg-background hover:text-foreground'
              )}
            >
              <span className={cn('w-2 h-2 rounded-full shrink-0', cfg.dot)} />
              <span className="whitespace-nowrap">{cfg.label}</span>
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                isActive ? 'bg-white/60' : 'bg-muted-foreground/10'
              )}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Conteúdo da aba ativa */}
      <div className="space-y-3">
        {grouped[activeTab].length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-border/60">
            <p className="text-sm text-muted-foreground">Nenhuma candidatura nesta etapa.</p>
          </div>
        ) : (
          grouped[activeTab].map(analysis => (
            <AnalysisCard
              key={analysis.id}
              analysis={analysis}
              onStatusChange={(s) => updateStatus(analysis.id, s)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function AnalysisCard({ analysis, onStatusChange }: { analysis: Analysis; onStatusChange: (s: Status) => void }) {
  const { job_title, company_name, diagnostic, status, created_at, id } = analysis
  const cargo = job_title || diagnostic?.preview_publico?.ponto_forte_destaque || 'Análise de currículo'
  const empresa = company_name || 'Empresa não informada'
  const nota = diagnostic?.nota_aderencia ?? diagnostic?.preview_publico?.nota
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon

  return (
    <div className="bg-card rounded-2xl border border-border/60 hover:border-primary/20 transition-all shadow-sm overflow-hidden group">
      {/* Corpo do card */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-start gap-4 min-w-0">
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border', cfg.bgCls)}>
            <Icon className={cn('w-5 h-5', cfg.iconCls)} />
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className="font-display font-bold text-base group-hover:text-primary transition-colors line-clamp-1">
              {cargo}
            </h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                {empresa}
              </span>
              <span className="text-border">·</span>
              <span>{new Date(created_at).toLocaleDateString('pt-BR')}</span>
              {nota !== undefined && (
                <Badge variant="secondary" className="text-[10px] font-bold h-4 py-0">
                  {nota}% match
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Link
          href={`/analise/${id}`}
          className="self-end sm:self-center flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all whitespace-nowrap"
        >
          Ver detalhes
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Pipeline de status */}
      <div className="bg-muted/40 border-t border-border/40 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 shrink-0">
          Mover para:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG[Status]][]).map(([s, c]) => {
            const isCurrent = status === s
            return (
              <button
                key={s}
                disabled={isCurrent}
                onClick={() => !isCurrent && onStatusChange(s)}
                className={cn(
                  'text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap',
                  isCurrent
                    ? c.btnSolid
                    : 'bg-background border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                )}
              >
                {isCurrent ? `✓ ${c.label}` : c.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
