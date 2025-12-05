import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { normalizationTemplates } from '@/lib/db/schema/normalization-templates'
import { eq } from 'drizzle-orm'
import { hasPermission } from '@/lib/auth/permissions'

/**
 * GET /api/templates/[id]
 * Busca detalhes de um template
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

    const [template] = await db
      .select()
      .from(normalizationTemplates)
      .where(eq(normalizationTemplates.id, params.id))
      .limit(1)

    if (!template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }

    // Verificar permissão
    if (
      session.user.globalRole !== 'super_admin' &&
      session.user.organizationId !== template.organizationId
    ) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json({ error: 'Erro ao buscar template' }, { status: 500 })
  }
}

/**
 * PUT /api/templates/[id]
 * Atualiza um template
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Super admin sempre tem permissão
    if (session.user.globalRole !== 'super_admin' && 
        !hasPermission(session.user.globalRole || 'viewer', 'data.upload')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()

    // Buscar template
    const [template] = await db
      .select()
      .from(normalizationTemplates)
      .where(eq(normalizationTemplates.id, params.id))
      .limit(1)

    if (!template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }

    // Atualizar
    const [updated] = await db
      .update(normalizationTemplates)
      .set({
        ...body,
        updatedAt: new Date(),
        updatedBy: session.user.id,
      })
      .where(eq(normalizationTemplates.id, params.id))
      .returning()

    return NextResponse.json({ template: updated })
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json({ error: 'Erro ao atualizar template' }, { status: 500 })
  }
}

/**
 * DELETE /api/templates/[id]
 * Deleta um template (soft delete)
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

    if (!hasPermission(session.user.globalRole || 'viewer', 'data.delete')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Soft delete
    await db
      .update(normalizationTemplates)
      .set({
        isActive: false,
        updatedAt: new Date(),
        updatedBy: session.user.id,
      })
      .where(eq(normalizationTemplates.id, params.id))

    return NextResponse.json({ message: 'Template deletado' })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json({ error: 'Erro ao deletar template' }, { status: 500 })
  }
}

