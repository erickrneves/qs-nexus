'use client'

import { SessionProvider } from 'next-auth/react'
import { AuthProvider } from './auth-provider'

/**
 * Providers wrapper que inclui tanto NextAuth (retrocompatibilidade)
 * quanto o novo AuthProvider do Stack Auth
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      refetchInterval={0} 
      refetchOnWindowFocus={false}
    >
      <AuthProvider>{children}</AuthProvider>
    </SessionProvider>
  )
}
