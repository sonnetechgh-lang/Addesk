import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const rawNext = requestUrl.searchParams.get('next') ?? '/dashboard'
  // Prevent open redirect: only allow safe relative paths (no protocol-relative, no encoded slashes, no scheme)
  const isSafePath =
    rawNext.startsWith('/') &&
    !rawNext.startsWith('//') &&
    !rawNext.includes('://') &&
    !rawNext.includes('\\') &&
    !decodeURIComponent(rawNext).startsWith('//')
  const next = isSafePath ? rawNext.split('?')[0].split('#')[0] : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  // If code exchange fails, redirect to login with an error hint
  return NextResponse.redirect(new URL('/login?error=confirmation_failed', requestUrl.origin))
}
