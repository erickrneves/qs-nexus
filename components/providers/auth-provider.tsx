'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

// ================================================================
// Tipos
// ================================================================

export interface User {
  id: string
  email: string
  name?: string
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string) => Promise<boolean>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

// ================================================================
// Context
// ================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ================================================================
// Provider
// ================================================================

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Verificar sessão no mount
  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session')
      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          setUser(data.user)
        }
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      return response.ok
    } catch (error) {
      console.error('Erro ao enviar magic link:', error)
      return false
    }
  }

  const signOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      setUser(null)
      window.location.href = '/login'
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const refreshSession = async () => {
    await checkSession()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ================================================================
// Hook
// ================================================================

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

// ================================================================
// Componente de proteção de rota (client-side)
// ================================================================

interface RequireAuthProps {
  children: ReactNode
  fallback?: ReactNode
}

export function RequireAuth({ children, fallback }: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return fallback || <div>Carregando...</div>
  }

  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return null
  }

  return <>{children}</>
}

