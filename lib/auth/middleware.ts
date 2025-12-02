import { NextRequest, NextResponse } from 'next/server'
// TODO: Fix NextAuth v5 compatibility
// import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'
import { ragUsers } from '@/lib/db/schema/rag-users'
import { organizationMembers } from '@/lib/db/schema/organizations'
import { eq } from 'drizzle-orm'
import {
  UserContext,
  Permission,
  checkUserPermission,
  mergePermissions,
  GlobalRole,
  OrgRole,
} from './permissions'

/**
 * Middleware de Autenticação e Autorização
 * Para proteger rotas de API e páginas
 * 
 * TEMPORARILY DISABLED FOR DEPLOYMENT
 */

/**
 * Obtém contexto completo do usuário autenticado
 */
export async function getUserContext(req: NextRequest): Promise<UserContext | null> {
  // TODO: Implementar após corrigir NextAuth v5
  console.warn('[Auth] getUserContext temporarily disabled')
  return null
}

/**
 * Middleware: Requer autenticação
 */
export async function requireAuth(
  req: NextRequest
): Promise<{ user: UserContext } | NextResponse> {
  // TODO: Implementar após corrigir NextAuth v5
  console.warn('[Auth] requireAuth temporarily disabled')
  return NextResponse.json({ error: 'Auth temporarily disabled' }, { status: 501 })
}

/**
 * Middleware: Requer permissão específica
 */
export async function requirePermission(
  req: NextRequest,
  permission: Permission
): Promise<{ user: UserContext } | NextResponse> {
  return requireAuth(req)
}

/**
 * Middleware: Requer role específico
 */
export async function requireRole(
  req: NextRequest,
  allowedRoles: (GlobalRole | OrgRole)[]
): Promise<{ user: UserContext } | NextResponse> {
  return requireAuth(req)
}

/**
 * Middleware: Requer acesso à organização específica
 */
export async function requireOrganizationAccess(
  req: NextRequest,
  organizationId: string
): Promise<{ user: UserContext } | NextResponse> {
  return requireAuth(req)
}

/**
 * Helper: Extrai organizationId de diferentes fontes
 */
export function extractOrganizationId(req: NextRequest): string | null {
  const { searchParams } = new URL(req.url)
  let orgId = searchParams.get('organizationId')
  if (orgId) return orgId
  orgId = req.headers.get('x-organization-id')
  return orgId
}

/**
 * Wrapper para rotas de API protegidas
 */
export function withAuth(
  handler: (req: NextRequest, user: UserContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    return handler(req, authResult.user)
  }
}

/**
 * Wrapper para rotas que requerem permissão
 */
export function withPermission(
  permission: Permission,
  handler: (req: NextRequest, user: UserContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const authResult = await requirePermission(req, permission)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    return handler(req, authResult.user)
  }
}
