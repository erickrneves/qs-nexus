import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema/documents'
import { normalizationTemplates } from '@/lib/db/schema/normalization-templates'
import { eq } from 'drizzle-orm'
import { hasPermission } from '@/lib/auth/permissions'

/**
 * POST /api/documents/[id]/assign-template
 * Associa um template a um documento existente
 */
export async function POST(
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
    const { templateId } = body

    if (!templateId) {
      return NextResponse.json(
        { error: 'templateId é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar documento
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, params.id))
      .limit(1)

    if (!document) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })
    }

    // Buscar template
    const [template] = await db
      .select()
      .from(normalizationTemplates)
      .where(eq(normalizationTemplates.id, templateId))
      .limit(1)

    if (!template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }

    // Atualizar documento
    await db
      .update(documents)
      .set({
        normalizationTemplateId: templateId,
        normalizationStatus: 'pending',
        updatedAt: new Date(),
      })
      .where(eq(documents.id, params.id))

    return NextResponse.json({
      message: 'Template associado com sucesso',
      document: {
        id: document.id,
        normalizationTemplateId: templateId,
      },
    })
  } catch (error) {
    console.error('Error assigning template:', error)
    return NextResponse.json(
      { error: 'Erro ao associar template' },
      { status: 500 }
    )
  }
}

