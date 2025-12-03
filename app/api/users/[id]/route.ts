import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { ragUsers } from '@/lib/db/schema/rag-users'
import { organizationMembers } from '@/lib/db/schema/organizations'
import { eq, and } from 'drizzle-orm'
import { updateUserSchema } from '@/lib/schemas/user-schemas'
import { getUserWithOrganizations, canManageUser, deactivateUser } from '@/lib/services/user-service'
import { hasPermission } from '@/lib/auth/permissions'

/**
 * GET /api/users/[id]
 * Retorna detalhes de um usuário
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar permissão
    if (!hasPermission(session.user.globalRole, 'users.view')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const user = await getUserWithOrganizations(params.id)

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Se não é super_admin, só pode ver usuários da mesma org
    if (session.user.globalRole !== 'super_admin') {
      const hasCommonOrg = user.organizations.some(
        org => org.id === session.user.organizationId && org.isActive
      )
      
      if (!hasCommonOrg && user.id !== session.user.id) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
      }
    }

    // Não retornar senha
    const { password, ...userWithoutPassword } = user as any

    return NextResponse.json({ user: userWithoutPassword })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Erro ao buscar usuário' }, { status: 500 })
  }
}

/**
 * PATCH /api/users/[id]
 * Atualiza usuário
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar permissão
    if (!hasPermission(session.user.globalRole, 'users.manage')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    
    console.log('🔍 API PATCH /api/users/[id] - Data recebida:', JSON.stringify(body, null, 2))
    console.log('🔍 Session globalRole:', session.user.globalRole)
    
    // Verificar se pode gerenciar este usuário
    const canEdit = await canManageUser(session.user.id, params.id, session.user.organizationId || undefined)
    
    if (!canEdit && session.user.id !== params.id) {
      return NextResponse.json(
        { error: 'Você não pode editar este usuário' },
        { status: 403 }
      )
    }

    // Se não é super_admin, não pode alterar globalRole
    if (body.globalRole !== undefined && session.user.globalRole !== 'super_admin') {
      console.log('❌ Usuário não tem permissão para alterar globalRole')
      return NextResponse.json(
        { error: 'Apenas super admin pode alterar role global' },
        { status: 403 }
      )
    }

    // Atualizar dados básicos do usuário
    const updateData: any = {
      updatedAt: new Date(),
    }
    
    if (body.name) updateData.name = body.name
    if (body.globalRole !== undefined) {
      updateData.globalRole = body.globalRole || null
      console.log('✅ GlobalRole será atualizado para:', body.globalRole)
    }
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    console.log('🔍 Updates a aplicar:', JSON.stringify(updateData, null, 2))

    const [updated] = await db
      .update(ragUsers)
      .set(updateData)
      .where(eq(ragUsers.id, params.id))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Se organizationId e orgRole fornecidos, atualizar membership
    if (body.organizationId && body.orgRole) {
      // Verificar se já existe membership nesta org
      const [existingMembership] = await db
        .select()
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.userId, params.id),
            eq(organizationMembers.organizationId, body.organizationId)
          )
        )
        .limit(1)

      if (existingMembership) {
        // Atualizar role existente
        await db
          .update(organizationMembers)
          .set({
            role: body.orgRole,
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(organizationMembers.id, existingMembership.id))
      } else {
        // Criar novo membership
        await db
          .insert(organizationMembers)
          .values({
            organizationId: body.organizationId,
            userId: params.id,
            role: body.orgRole,
            invitedBy: session.user.id,
            invitedAt: new Date(),
            isActive: true,
          })
      }
    }

    // Buscar user completo
    const user = await getUserWithOrganizations(updated.id)

    return NextResponse.json({
      message: 'Usuário atualizado com sucesso',
      user,
    })
  } catch (error: any) {
    console.error('Error updating user:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 })
  }
}

/**
 * DELETE /api/users/[id]
 * SOFT DELETE (default): Desativa usuário (isActive = false)
 * HARD DELETE (?hard=true): Deleta permanentemente do banco
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Apenas super_admin pode deletar
    if (session.user.globalRole !== 'super_admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Não pode deletar a si mesmo
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: 'Você não pode deletar a si mesmo' },
        { status: 400 }
      )
    }

    // Parse query para verificar se é hard delete
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hard') === 'true'

    // Verificar se usuário existe
    const [user] = await db
      .select()
      .from(ragUsers)
      .where(eq(ragUsers.id, params.id))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    if (hardDelete) {
      // HARD DELETE: Deletar permanentemente
      // Deletar permanentemente (CASCADE vai remover organizationMembers)
      await db.delete(ragUsers).where(eq(ragUsers.id, params.id))

      return NextResponse.json({
        message: 'Usuário deletado permanentemente',
        type: 'hard_delete',
      })
    } else {
      // SOFT DELETE: Apenas desativar
      await deactivateUser(params.id)

      return NextResponse.json({
        message: 'Usuário desativado com sucesso',
        type: 'soft_delete',
      })
    }
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Erro ao deletar usuário' }, { status: 500 })
  }
}

