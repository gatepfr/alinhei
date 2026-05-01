'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/')
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={className ?? 'text-sm text-muted-foreground hover:text-foreground'}
    >
      Sair
    </button>
  )
}
