// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Supabase às vezes redireciona o code OAuth para o Site URL em vez de /auth/callback
  const code = request.nextUrl.searchParams.get('code')
  if (code && request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/callback'
    return NextResponse.redirect(url)
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) console.error('[middleware] auth.getUser error:', authError.message)

  // Redireciona usuários logados da landing page para o dashboard
  if (user && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  const isProtected =
    (request.nextUrl.pathname.startsWith('/analise') &&
      request.nextUrl.pathname.endsWith('/completo')) ||
    request.nextUrl.pathname.startsWith('/dashboard')

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
    const adminEmails = (process.env.ADMIN_EMAIL ?? '').split(',').map(e => e.trim().toLowerCase())
    if (!user.email || !adminEmails.includes(user.email.toLowerCase())) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Captura ?ref=<userId> e salva em cookie por 30 dias
  const refParam = request.nextUrl.searchParams.get('ref')
  if (refParam && /^[0-9a-f-]{36}$/.test(refParam)) {
    supabaseResponse.cookies.set('vc_ref', refParam, {
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      sameSite: 'lax',
    })
  }

  // Atribui variante A/B para o copy do paywall (50/50, persistida por 90 dias)
  if (!request.cookies.get('ab_paywall')) {
    const variant = Math.random() < 0.5 ? 'A' : 'B'
    supabaseResponse.cookies.set('ab_paywall', variant, {
      maxAge: 60 * 60 * 24 * 90,
      path: '/',
      sameSite: 'lax',
    })
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/', '/analise/:path*/completo', '/dashboard/:path*', '/admin/:path*'],
}
