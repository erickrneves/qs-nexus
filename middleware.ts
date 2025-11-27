import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware de autenticação para QS Nexus
 * 
 * Verifica a presença do cookie de sessão do Stack Auth.
 * A verificação real do token acontece nas páginas/API routes.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas (não requerem autenticação)
  const publicRoutes = ['/login', '/register', '/api/auth']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Rotas de API que não precisam de autenticação
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/chat')) {
    return NextResponse.next()
  }

  // Rotas protegidas - TEMPORARIAMENTE DESABILITADO PARA TESTES
  // TODO: Reabilitar autenticação depois
  const isProtectedRoute = false
  /*
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/upload') ||
    pathname.startsWith('/files') ||
    pathname.startsWith('/chat') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/help')
  */

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Verifica cookies de sessão (Stack Auth e NextAuth para retrocompatibilidade)
  const stackAuthSession = request.cookies.get('stack-auth-session')?.value
  const nextAuthSession =
    request.cookies.get('authjs.session-token')?.value ||
    request.cookies.get('__Secure-authjs.session-token')?.value ||
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value

  const hasSession = stackAuthSession || nextAuthSession

  // Se não tem sessão, redireciona para login
  if (!hasSession) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
