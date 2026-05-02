// app/admin/coupons-section.tsx
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Ticket, Calendar, Users, CheckCircle2, XCircle } from 'lucide-react'

interface Coupon {
  id: string
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  max_uses: number | null
  uses_count: number
  valid_until: string | null
  is_active: boolean
}

export function CouponsSection({ coupons }: { coupons: Coupon[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Ticket className="w-5 h-5 text-primary" />
        <h2 className="font-display font-bold text-xl">Cupons Ativos</h2>
      </div>

      {coupons.length === 0 ? (
        <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">Nenhum cupom cadastrado.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {coupons.map((coupon) => (
            <Card key={coupon.id} className="overflow-hidden border-border/60">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Ticket className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono font-bold text-base tracking-wider">{coupon.code}</span>
                      <Badge variant={coupon.is_active ? 'default' : 'secondary'} className="text-[10px] h-4 uppercase">
                        {coupon.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {coupon.discount_type === 'percent' ? `${coupon.discount_value}% OFF` : `R$ ${coupon.discount_value} OFF`}
                      </span>
                      <div className="w-1 h-1 rounded-full bg-border" />
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {coupon.uses_count} {coupon.max_uses ? `/ ${coupon.max_uses}` : 'usos'}
                      </span>
                      {coupon.valid_until && (
                        <>
                          <div className="w-1 h-1 rounded-full bg-border" />
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Até {new Date(coupon.valid_until).toLocaleDateString('pt-BR')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {coupon.is_active ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground/30" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
