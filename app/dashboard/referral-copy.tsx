'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

export function ReferralCopy({ referralCode }: { referralCode: string }) {
  const [copied, setCopied] = useState(false)
  const referralUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${referralCode}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      trackEvent('referral_link_copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback para iOS/Safari sem permissão de clipboard
      const input = document.createElement('input')
      input.value = referralUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex gap-2 mt-2">
      <input
        readOnly
        value={referralUrl}
        className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-muted-foreground font-mono truncate"
      />
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1.5 text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-green-600">Copiado!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Copiar link
          </>
        )}
      </button>
    </div>
  )
}
