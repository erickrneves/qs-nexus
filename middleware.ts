import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'

export default auth(req => {
  const isAuthenticated = !!req.auth
  const isProtectedRoute =
    req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/upload') ||
    req.nextUrl.pathname.startsWith('/files') ||
    req.nextUrl.pathname.startsWith('/chat')

  if (!isAuthenticated && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|register).*)'],
}
