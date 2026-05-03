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
  }
}

export function UserRow({ user }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [balance, setBalance] = useState(user.balance)
  const [deleting, setDeleting] = useState(false)
  const [deleted, setDeleted] = useState(false)

  async function handleDelete() {
    if (!confirm(`Tem certeza que deseja excluir permanentemente o usuário ${user.email}? Esta ação não pode ser desfeita.`)) {
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.ok) {
        setDeleted(true)
      } else {
        alert(data.error ?? 'Erro ao excluir usuário.')
      }
    } catch {
      alert('Erro de rede ao excluir usuário.')
    } finally {
      setDeleting(false)
    }
  }

  if (deleted) return null

  return (
    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 border-b border-border last:border-0 group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user.email}</p>
        <p className="text-xs text-muted-foreground">{user.createdAt}</p>
      </div>
      <div className="flex items-center gap-6 text-sm shrink-0">
        <span title="Saldo">
          <span className="text-muted-foreground text-xs">Saldo </span>
          <span className={balance > 0 ? 'text-emerald-400 font-medium' : 'text-foreground'}>{balance}</span>
        </span>
        <span title="Análises">
          <span className="text-muted-foreground text-xs">Análises </span>
          <span>{user.analysisCount}</span>
        </span>
        <span title="Pagamentos">
          <span className="text-muted-foreground text-xs">Pgtos </span>
          <span>{user.paymentCount}</span>
        </span>
        
        <div className="flex items-center gap-2">
          {!showForm && (
            <>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowForm(true)}>
                Dar crédito
              </Button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 sm:opacity-0 group-hover:opacity-100"
                title="Excluir usuário"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </>
          )}
        </div>
      </div>
      {showForm && (
        <div className="w-full sm:w-auto">
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
