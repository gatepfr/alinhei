'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CouponForm } from './coupon-form'

interface Coupon {
  id: string
  code: string
  discount_type: string
  discount_value: number
  max_uses: number | null
  uses_count: number
  is_active: boolean
  valid_until: string | null
}

export function CouponsSection({ coupons: initial }: { coupons: Coupon[] }) {
  const [showForm, setShowForm] = useState(false)
  const [coupons, setCoupons] = useState(initial)

  function handleDone() {
    setShowForm(false)
    // Reload on next server render — simple approach
    window.location.reload()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Cupons</h2>
        {!showForm && (
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowForm(true)}>
            + Novo cupom
          </Button>
        )}
      </div>

      {showForm && (
        <div className="bg-card rounded-xl border border-border p-4 mb-4">
          <CouponForm onDone={handleDone} />
        </div>
      )}

      {coupons.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum cupom criado.</p>
      ) : (
        <div className="bg-card rounded-xl border border-border divide-y divide-border overflow-hidden">
          {coupons.map(c => (
            <div key={c.id} className="px-4 py-3 flex items-center gap-4 flex-wrap">
              <code className="text-sm font-mono font-bold">{c.code}</code>
              <span className="text-sm text-muted-foreground">
                {c.discount_type === 'percent' ? `${c.discount_value}%` : `R$ ${Number(c.discount_value).toFixed(2)}`} off
              </span>
              <span className="text-xs text-muted-foreground">
                {c.uses_count}{c.max_uses ? `/${c.max_uses}` : ''} usos
              </span>
              {c.valid_until && (
                <span className="text-xs text-muted-foreground">
                  até {new Date(c.valid_until).toLocaleDateString('pt-BR')}
                </span>
              )}
              <Badge variant={c.is_active ? 'secondary' : 'outline'} className="text-xs ml-auto">
                {c.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
