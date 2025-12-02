import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { organizations } from '@/lib/db/schema/organizations'
import { eq } from 'drizzle-orm'

/**
 * GET /api/organizations/[id]
 * Busca uma organização específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, params.id))
      .limit(1)

    if (!org) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ organization: org })
  } catch (error) {
    console.error('Error fetching organization:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar organização' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/organizations/[id]
 * Atualiza uma organização
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Verificar permissões
    const body = await request.json()
    const { name, cnpj, slug, logoUrl, isActive, settings } = body

    const [updated] = await db
      .update(organizations)
      .set({
        name,
        cnpj,
        slug,
        logoUrl,
        isActive,
        settings,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, params.id))
      .returning()

    if (!updated) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ organization: updated })
  } catch (error) {
    console.error('Error updating organization:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar organização' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/organizations/[id]
 * Deleta uma organização
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Verificar permissões (apenas super admin)
    await db
      .delete(organizations)
      .where(eq(organizations.id, params.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting organization:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar organização' },
      { status: 500 }
    )
  }
}

