// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/analise'
  const evt = searchParams.get('_evt') ?? ''

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      // Registra indicação se houver cookie de referral
      // A constraint unique(referred_id) previne duplicatas silenciosamente
      const refCookie = request.cookies.get('vc_ref')?.value
      if (refCookie && refCookie !== data.user.id) {
        try {
          const serviceClient = createServiceClient()
          await serviceClient
            .from('referrals')
            .insert({ referrer_id: refCookie, referred_id: data.user.id })
        } catch {
          // falha silenciosa — duplicate key ou outro erro não bloqueia o login
        }
      }

      const safeNext = /^\/[^/\\]/.test(next) ? next : '/analise'
      const evtParam = evt ? `?_evt=${encodeURIComponent(evt)}` : ''
      const response = NextResponse.redirect(`${origin}${safeNext}${evtParam}`)
      // Limpa o cookie de referral após usar
      if (refCookie) {
        response.cookies.set('vc_ref', '', { maxAge: 0, path: '/' })
      }
      return response
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
