'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PaywallModal } from '@/components/paywall-modal'

export function DashboardPurchaseButton({ balance }: { balance: number }) {
  const [showPaywall, setShowPaywall] = useState(false)

  return (
    <>
      <Button
        onClick={() => setShowPaywall(true)}
        className="ml-auto flex items-center gap-2 text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-4 h-4" />
        {balance === 0 ? 'Comprar créditos' : 'Comprar mais'}
      </Button>

      {showPaywall && (
        <PaywallModal onClose={() => setShowPaywall(false)} />
      )}
    </>
  )
}
