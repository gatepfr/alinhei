'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { GiveCreditsForm } from './give-credits-form'

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

  return (
    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 border-b border-border last:border-0">
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
        {!showForm && (
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowForm(true)}>
            Dar crédito
          </Button>
        )}
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
