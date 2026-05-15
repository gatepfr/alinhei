'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { GiveCreditsForm } from './give-credits-form'
import { Trash2, Loader2 } from 'lucide-react'

interface Props {
  user: {
    id: string
    email: string
    createdAt: string
    balance: number
    analysisCount: number
    paymentCount: number
    revenueCents: number
  }
}

function fmtBRL(cents: number) {
  return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

export function UserRow({ user }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [balance, setBalance] = useState(user.balance)
  const [deleting, setDeleting] = useState(false)
  const [deleted, setDeleted] = useState(false)

  async function handleDelete() {
    if (!confirm(`Excluir permanentemente ${user.email}? Ação irreversível.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.ok) setDeleted(true)
      else alert(data.error ?? 'Erro ao excluir usuário.')
    } catch {
      alert('Erro de rede.')
    } finally {
      setDeleting(false)
    }
  }

  if (deleted) return null

  return (
    <div className="group">
      {/* Desktop grid */}
      <div className="hidden sm:grid grid-cols-[1fr_80px_72px_72px_100px_72px] items-center px-4 py-3 border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{user.email}</p>
          <p className="text-xs text-muted-foreground">{user.createdAt}</p>
        </div>
        <span className={`text-sm font-medium ${balance > 0 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
          {balance}
        </span>
        <span className="text-sm text-muted-foreground">{user.analysisCount}</span>
        <span className="text-sm text-muted-foreground">{user.paymentCount}</span>
        <span className={`text-sm font-semibold ${user.revenueCents > 0 ? 'text-primary' : 'text-muted-foreground/40'}`}>
          {user.revenueCents > 0 ? fmtBRL(user.revenueCents) : '—'}
        </span>
        <div className="flex items-center gap-1.5 justify-end">
          {!showForm && (
            <>
              <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => setShowForm(true)}>
                +crédito
              </Button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-7 h-7 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all disabled:opacity-50"
                title="Excluir usuário"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile card */}
      <div className="sm:hidden px-4 py-3 border-b border-border/50 last:border-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user.email}</p>
            <p className="text-xs text-muted-foreground">{user.createdAt}</p>
          </div>
          {user.revenueCents > 0 && (
            <span className="text-sm font-semibold text-primary shrink-0">{fmtBRL(user.revenueCents)}</span>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
          <span>Saldo <span className={balance > 0 ? 'text-emerald-400 font-medium' : 'text-foreground'}>{balance}</span></span>
          <span>Análises <span className="text-foreground">{user.analysisCount}</span></span>
          <span>Pgtos <span className="text-foreground">{user.paymentCount}</span></span>
        </div>
        {!showForm && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowForm(true)}>
              Dar crédito
            </Button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <div className="px-4 py-3 bg-secondary/20 border-b border-border/50">
          <GiveCreditsForm
            userId={user.id}
            userEmail={user.email}
            onDone={() => {
              setShowForm(false)
              setBalance(b => b + 1)
            }}
          />
        </div>
      )}
    </div>
  )
}
