'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Save } from 'lucide-react'
import type { Products, ProductSku } from '@/lib/products'

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
        [field]: field === 'label' ? value : field === 'price' ? parseFloat(value.toString()) : parseInt(value.toString())
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
        setTimeout(() => setSuccess(false), 3000)
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
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Gerenciar Preços
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {(Object.keys(prices) as Array<keyof Products>).map((sku) => (
          <div key={sku} className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border/40">
            <h3 className="font-bold text-sm uppercase tracking-wider text-primary">{sku}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor={`${sku}-label`}>Etiqueta</Label>
                <Input
                  id={`${sku}-label`}
                  value={prices[sku].label}
                  onChange={(e) => handleChange(sku, 'label', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${sku}-price`}>Preço (R$)</Label>
                <Input
                  id={`${sku}-price`}
                  type="number"
                  step="0.01"
                  value={prices[sku].price}
                  onChange={(e) => handleChange(sku, 'price', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${sku}-credits`}>Créditos</Label>
                <Input
                  id={`${sku}-credits`}
                  type="number"
                  value={prices[sku].credits}
                  onChange={(e) => handleChange(sku, 'credits', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${sku}-exp`}>Expiração (dias)</Label>
                <Input
                  id={`${sku}-exp`}
                  type="number"
                  value={prices[sku].expirationDays}
                  onChange={(e) => handleChange(sku, 'expirationDays', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-4">
          <Button onClick={handleSave} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Preços
          </Button>
          {success && (
            <p className="text-sm text-emerald-400 font-medium animate-in fade-in">
              Preços atualizados com sucesso!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
