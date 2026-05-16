'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
  userId: string
  userEmail: string
  onDone: (delta?: number) => void
}

export function GiveCreditsForm({ userId, userEmail, onDone }: Props) {
  const [amount, setAmount] = useState(1)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (amount === 0) return
    setLoading(true)
    setMessage(null)
    const source = amount > 0 ? 'admin:grant' : 'admin:revoke'
    try {
      const res = await fetch('/api/admin/give-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount, source }),
      })
      const data = await res.json()
      if (data.ok) {
        const abs = Math.abs(amount)
        const verb = amount > 0 ? 'concedido' : 'removido'
        setMessage(`✓ ${abs} crédito${abs > 1 ? 's' : ''} ${verb}${abs > 1 ? 's' : ''} — ${userEmail}`)
        setTimeout(() => onDone(amount), 1500)
      } else {
        setMessage(`Erro: ${data.error}`)
      }
    } catch {
      setMessage('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
      <Input
        type="number"
        min={-100}
        max={100}
        value={amount}
        onChange={e => setAmount(Number(e.target.value))}
        className="w-20 h-8 text-sm"
      />
      <Button type="submit" size="sm" disabled={loading || amount === 0} className="h-8 text-xs">
        {loading ? 'Salvando…' : amount < 0 ? 'Remover' : 'Conceder'}
      </Button>
      <button type="button" onClick={() => onDone()} className="text-xs text-muted-foreground hover:text-foreground">
        Cancelar
      </button>
      {message && <span className="text-xs text-muted-foreground ml-1">{message}</span>}
    </form>
  )
}
