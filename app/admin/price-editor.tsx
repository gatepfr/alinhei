'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save, CheckCircle2 } from 'lucide-react'
import type { Products, ProductSku } from '@/lib/products'

const SKU_LABELS: Record<string, string> = {
  single: 'Single',
  pack3: 'Pack 3',
  pack10: 'Pack 10',
}

interface Props {
  initialPrices: Products
}

export function PriceEditor({ initialPrices }: Props) {
  const [prices, setPrices] = useState<Products>(initialPrices)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (sku: ProductSku, field: string, value: string | number) => {
    setPrices(prev => ({
      ...prev,
      [sku]: {
        ...prev[sku],
        [field]: field === 'label' ? value
          : field === 'price' ? parseFloat(value.toString()) || 0
          : parseInt(value.toString()) || 0,
      }
    }))
    setSuccess(false)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'prices', value: prices }),
      })
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 4000)
      } else {
        alert('Erro ao salvar preços.')
      }
    } catch {
      alert('Erro de rede.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header da tabela */}
      <div className="hidden sm:grid grid-cols-[120px_1fr_110px_80px_80px_90px] gap-x-4 px-5 py-2.5 border-b border-border bg-secondary/30">
        {['Produto', 'Etiqueta', 'Preço (R$)', 'Créditos', 'Exp. (dias)', 'R$/crédito'].map(h => (
          <p key={h} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</p>
        ))}
      </div>

      {(Object.keys(prices) as Array<ProductSku>).map((sku, i) => {
        const p = prices[sku]
        const pricePerCredit = p.credits > 0 ? (p.price / p.credits).toFixed(2) : '—'
        const isLast = i === Object.keys(prices).length - 1

        return (
          <div
            key={sku}
            className={`px-5 py-4 ${!isLast ? 'border-b border-border/50' : ''} hover:bg-secondary/10 transition-colors`}
          >
            {/* Mobile label */}
            <p className="sm:hidden text-xs font-bold text-primary uppercase tracking-widest mb-3">
              {SKU_LABELS[sku] ?? sku}
            </p>

            {/* Desktop row */}
            <div className="hidden sm:grid grid-cols-[120px_1fr_110px_80px_80px_90px] gap-x-4 items-center">
              <span className="text-sm font-semibold text-primary">{SKU_LABELS[sku] ?? sku}</span>
              <Input
                value={p.label}
                onChange={e => handleChange(sku, 'label', e.target.value)}
                className="h-8 text-sm bg-secondary border-border"
              />
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={p.price}
                  onChange={e => handleChange(sku, 'price', e.target.value)}
                  className="h-8 text-sm bg-secondary border-border pl-7"
                />
              </div>
              <Input
                type="number"
                min="1"
                value={p.credits}
                onChange={e => handleChange(sku, 'credits', e.target.value)}
                className="h-8 text-sm bg-secondary border-border"
              />
              <Input
                type="number"
                min="1"
                value={p.expirationDays}
                onChange={e => handleChange(sku, 'expirationDays', e.target.value)}
                className="h-8 text-sm bg-secondary border-border"
              />
              <span className={`text-sm font-semibold text-right ${p.credits > 1 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                R$ {pricePerCredit}
              </span>
            </div>

            {/* Mobile grid */}
            <div className="sm:hidden grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs text-muted-foreground">Etiqueta</Label>
                <Input value={p.label} onChange={e => handleChange(sku, 'label', e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Preço (R$)</Label>
                <Input type="number" step="0.01" min="0.01" value={p.price} onChange={e => handleChange(sku, 'price', e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Créditos</Label>
                <Input type="number" min="1" value={p.credits} onChange={e => handleChange(sku, 'credits', e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Expiração (dias)</Label>
                <Input type="number" min="1" value={p.expirationDays} onChange={e => handleChange(sku, 'expirationDays', e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Custo por crédito</Label>
                <div className="h-9 flex items-center px-3 bg-secondary rounded-md border border-border">
                  <span className={`text-sm font-semibold ${p.credits > 1 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                    R$ {pricePerCredit}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Footer com ação */}
      <div className="px-5 py-4 border-t border-border bg-secondary/20 flex items-center gap-4">
        <Button onClick={handleSave} disabled={loading} className="gap-2 h-9">
          {loading
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Salvando…</>
            : <><Save className="w-3.5 h-3.5" />Salvar preços</>
          }
        </Button>
        {success && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Preços atualizados com sucesso!
          </span>
        )}
      </div>
    </div>
  )
}
