import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // API routes and static assets pass through
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Dashboard subdomain → rewrite to /situation
  if (hostname.startsWith('situation.') || hostname.startsWith('situation-')) {
    const url = request.nextUrl.clone()
    url.pathname = `/situation${pathname === '/' ? '' : pathname}`
    return NextResponse.rewrite(url)
  }

  // Default: www landing page (no rewrite needed)
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|.*\\..*).*)'],
}
