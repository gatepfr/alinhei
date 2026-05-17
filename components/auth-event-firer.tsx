'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'

type AuthEvent = 'signup_completed' | 'login_completed'

const VALID_EVENTS: AuthEvent[] = ['signup_completed', 'login_completed']

export function AuthEventFirer({ evt }: { evt: string | null }) {
  useEffect(() => {
    if (!evt || !VALID_EVENTS.includes(evt as AuthEvent)) return
    trackEvent(evt as AuthEvent, { method: 'google' })
  }, [evt])

  return null
}
