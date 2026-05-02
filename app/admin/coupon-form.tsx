'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  onDone: () => void
}

export function CouponForm({ onDone }: Props) {
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
  const [discountValue, setDiscountValue] = useState(20)
  const [maxUses, setMaxUses] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/create-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          discountType,
          discountValue,
          maxUses: maxUses ? Number(maxUses) : null,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setMessage(`✓ Cupom ${code.toUpperCase()} criado`)
        setTimeout(onDone, 1500)
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
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1">Código</Label>
          <Input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="EX: PROMO20"
            className="h-8 text-sm uppercase"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1">Tipo</Label>
          <select
            value={discountType}
            onChange={e => setDiscountType(e.target.value as 'percent' | 'fixed')}
            className="w-full h-8 text-sm rounded-md border border-input bg-background px-2"
          >
            <option value="percent">Percentual (%)</option>
            <option value="fixed">Fixo (R$)</option>
          </select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1">
            {discountType === 'percent' ? 'Desconto (%)' : 'Desconto (R$)'}
          </Label>
          <Input
            type="number"
            min={1}
            max={discountType === 'percent' ? 100 : 1000}
            value={discountValue}
            onChange={e => setDiscountValue(Number(e.target.value))}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1">Usos máx. (vazio = ∞)</Label>
          <Input
            type="number"
            min={1}
            value={maxUses}
            onChange={e => setMaxUses(e.target.value)}
            placeholder="Ilimitado"
            className="h-8 text-sm"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={loading || !code.trim()} className="h-8 text-xs">
          {loading ? 'Criando…' : 'Criar cupom'}
        </Button>
        <button type="button" onClick={onDone} className="text-xs text-muted-foreground hover:text-foreground">
          Cancelar
        </button>
        {message && <span className="text-xs text-muted-foreground">{message}</span>}
      </div>
    </form>
  )
}
