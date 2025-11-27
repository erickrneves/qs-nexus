/**
 * Stack Auth Configuration for QS Nexus
 * 
 * Stack Auth é o sistema de autenticação fornecido pelo Neon Auth,
 * que oferece Magic Link authentication out-of-the-box.
 * 
 * Configuração:
 * - STACK_PROJECT_ID: ID do projeto no Stack Auth
 * - STACK_PUBLISHABLE_CLIENT_KEY: Chave pública para o cliente
 * - STACK_SECRET_SERVER_KEY: Chave secreta para o servidor
 */

// ================================================================
// Tipos
// ================================================================

export interface StackUser {
  id: string
  email: string
  name?: string
  emailVerified: boolean
  createdAt: Date
  lastSignInAt?: Date
  metadata?: Record<string, unknown>
}

export interface StackSession {
  user: StackUser
  accessToken: string
  refreshToken?: string
  expiresAt: Date
}

export interface AuthConfig {
  projectId: string
  publishableKey: string
  secretKey: string
}

// ================================================================
// Configuração
// ================================================================

export function getAuthConfig(): AuthConfig {
  const projectId = process.env.STACK_PROJECT_ID
  const publishableKey = process.env.STACK_PUBLISHABLE_CLIENT_KEY
  const secretKey = process.env.STACK_SECRET_SERVER_KEY

  if (!projectId || !publishableKey || !secretKey) {
    throw new Error('Stack Auth não configurado. Verifique as variáveis de ambiente.')
  }

  return {
    projectId,
    publishableKey,
    secretKey,
  }
}

// ================================================================
// Server-side Auth Functions
// ================================================================

const STACK_API_BASE = 'https://api.stack-auth.com'

/**
 * Verifica token de sessão no servidor
 */
export async function verifySession(sessionToken: string): Promise<StackSession | null> {
  try {
    const config = getAuthConfig()

    const response = await fetch(`${STACK_API_BASE}/api/v1/auth/sessions/current`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Stack-Project-Id': config.projectId,
        'X-Stack-Publishable-Client-Key': config.publishableKey,
        Authorization: `Bearer ${sessionToken}`,
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.display_name,
        emailVerified: data.user.email_verified,
        createdAt: new Date(data.user.created_at),
        lastSignInAt: data.user.last_sign_in_at ? new Date(data.user.last_sign_in_at) : undefined,
      },
      accessToken: sessionToken,
      expiresAt: new Date(data.expires_at),
    }
  } catch (error) {
    console.error('Erro ao verificar sessão Stack Auth:', error)
    return null
  }
}

/**
 * Obtém usuário pelo ID
 */
export async function getUserById(userId: string): Promise<StackUser | null> {
  try {
    const config = getAuthConfig()

    const response = await fetch(`${STACK_API_BASE}/api/v1/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Stack-Project-Id': config.projectId,
        'X-Stack-Secret-Server-Key': config.secretKey,
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    return {
      id: data.id,
      email: data.email,
      name: data.display_name,
      emailVerified: data.email_verified,
      createdAt: new Date(data.created_at),
      lastSignInAt: data.last_sign_in_at ? new Date(data.last_sign_in_at) : undefined,
    }
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return null
  }
}

/**
 * Envia magic link para email
 */
export async function sendMagicLink(email: string, redirectUrl?: string): Promise<boolean> {
  try {
    const config = getAuthConfig()

    const response = await fetch(`${STACK_API_BASE}/api/v1/auth/magic-link/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Stack-Project-Id': config.projectId,
        'X-Stack-Secret-Server-Key': config.secretKey,
      },
      body: JSON.stringify({
        email,
        redirect_url: redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Erro ao enviar magic link:', error)
    return false
  }
}

// ================================================================
// Helper para obter sessão em Server Components
// ================================================================

import { cookies } from 'next/headers'

/**
 * Obtém a sessão atual do usuário (Server Component)
 */
export async function getServerSession(): Promise<StackSession | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('stack-auth-session')?.value

  if (!sessionToken) {
    return null
  }

  return verifySession(sessionToken)
}

/**
 * Verifica se o usuário está autenticado (Server Component)
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerSession()
  return session !== null
}

// ================================================================
// Compatibilidade com NextAuth existente
// ================================================================

/**
 * Função de compatibilidade que retorna sessão no formato NextAuth
 * para facilitar migração gradual
 */
export async function auth() {
  const session = await getServerSession()

  if (!session) {
    return null
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    },
    expires: session.expiresAt.toISOString(),
  }
}

