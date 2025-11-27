import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  
  // Lista de cookies do NextAuth para limpar
  const cookiesToClear = [
    'authjs.session-token',
    '__Secure-authjs.session-token',
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'authjs.csrf-token',
    'next-auth.csrf-token',
    'authjs.callback-url',
    'next-auth.callback-url',
    'stack-auth-session',
  ]
  
  for (const name of cookiesToClear) {
    try {
      cookieStore.delete(name)
    } catch {
      // Ignore
    }
  }
  
  return NextResponse.redirect(new URL('/dashboard', 'http://localhost:3000'))
}



