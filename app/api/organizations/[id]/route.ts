import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { organizations, organizationMembers } from '@/lib/db/schema/organizations'
import { eq, and } from 'drizzle-orm'
import { hasPermission } from '@/lib/auth/permissions'

/**
 * GET /api/organizations/[id]
 * Retorna detalhes de uma organização
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

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, params.id))
      .limit(1)

    if (!org) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    // Buscar membros
    const members = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, params.id),
          eq(organizationMembers.isActive, true)
        )
      )

    return NextResponse.json({
      organization: {
        ...org,
        membersCount: members.length,
      },
    })
  } catch (error) {
    console.error('Error fetching organization:', error)
    return NextResponse.json({ error: 'Erro ao buscar organização' }, { status: 500 })
  }
}

/**
 * PATCH /api/organizations/[id]
 * Atualiza uma organização
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

    // Apenas super_admin pode editar organizações
    if (!hasPermission(session.user.globalRole, 'organizations.manage')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const { name, cnpj, isActive } = body

    const [updated] = await db
      .update(organizations)
      .set({
        name: name || undefined,
        cnpj: cnpj || undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, params.id))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ organization: updated })
  } catch (error) {
    console.error('Error updating organization:', error)
    return NextResponse.json({ error: 'Erro ao atualizar organização' }, { status: 500 })
  }
}

/**
 * DELETE /api/organizations/[id]
 * SOFT DELETE: Desativa uma organização (isActive = false)
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

    // Apenas super_admin pode deletar organizações
    if (!hasPermission(session.user.globalRole, 'organizations.manage')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Parse query para verificar se é hard delete
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hard') === 'true'

    // Verificar se não é a organização principal (QS Consultoria)
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, params.id))
      .limit(1)

    if (!org) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    if (org.slug === 'qs-consultoria') {
      return NextResponse.json(
        { error: 'Não é possível deletar a organização principal (QS Consultoria)' },
        { status: 403 }
      )
    }

    if (hardDelete) {
      // HARD DELETE: Deletar permanentemente
      // Primeiro, verificar se há usuários vinculados
      const members = await db
        .select()
        .from(organizationMembers)
        .where(eq(organizationMembers.organizationId, params.id))
        .limit(1)

      if (members.length > 0) {
        return NextResponse.json(
          { error: 'Não é possível deletar permanentemente: organização possui membros vinculados' },
          { status: 400 }
        )
      }

      // Deletar permanentemente
      await db.delete(organizations).where(eq(organizations.id, params.id))

      return NextResponse.json({
        message: 'Organização deletada permanentemente',
        type: 'hard_delete',
      })
    } else {
      // SOFT DELETE: Apenas desativar
      const [deleted] = await db
        .update(organizations)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, params.id))
        .returning()

      return NextResponse.json({
        message: 'Organização desativada com sucesso',
        type: 'soft_delete',
        organization: deleted,
      })
    }
  } catch (error) {
    console.error('Error deleting organization:', error)
    return NextResponse.json({ error: 'Erro ao deletar organização' }, { status: 500 })
  }
}
