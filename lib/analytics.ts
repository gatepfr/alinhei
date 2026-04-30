'use client'

type EventName =
  | 'analysis_started'
  | 'analysis_completed'
  | 'paywall_shown'
  | 'checkout_started'
  | 'payment_completed'
  | 'generation_completed'
  | 'pdf_downloaded'
  | 'linkedin_share_clicked'

export function trackEvent(event: EventName, props?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return

  // Plausible
  if (typeof (window as Window & { plausible?: (e: string, opts?: { props?: Record<string, unknown> }) => void }).plausible === 'function') {
    ;(window as Window & { plausible?: (e: string, opts?: { props?: Record<string, unknown> }) => void }).plausible!(event, { props })
  }

  // PostHog
  if (typeof (window as Window & { posthog?: { capture: (e: string, p?: Record<string, unknown>) => void } }).posthog?.capture === 'function') {
    ;(window as Window & { posthog?: { capture: (e: string, p?: Record<string, unknown>) => void } }).posthog!.capture(event, props)
  }
}
