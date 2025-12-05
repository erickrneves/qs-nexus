import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { normalizedData } from '@/lib/db/schema/normalized-data'
import { normalizationTemplates } from '@/lib/db/schema/normalization-templates'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth/config'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const documentId = params.id

    // Buscar dados normalizados
    const result = await db
      .select({
        id: normalizedData.id,
        documentId: normalizedData.documentId,
        templateId: normalizedData.templateId,
        data: normalizedData.data,
        createdAt: normalizedData.createdAt,
        updatedAt: normalizedData.updatedAt,
      })
      .from(normalizedData)
      .where(eq(normalizedData.documentId, documentId))
      .limit(1)

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Dados normalizados não encontrados' },
        { status: 404 }
      )
    }

    const normalized = result[0]

    // Buscar informações do template
    let templateFields = null
    if (normalized.templateId) {
      const templateResult = await db
        .select({
          name: normalizationTemplates.name,
          description: normalizationTemplates.description,
          fields: normalizationTemplates.fields,
        })
        .from(normalizationTemplates)
        .where(eq(normalizationTemplates.id, normalized.templateId))
        .limit(1)

      if (templateResult.length > 0) {
        templateFields = templateResult[0].fields
      }
    }

    return NextResponse.json({
      normalizedData: normalized,
      templateFields,
    })
  } catch (error) {
    console.error('Error fetching normalized data:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados normalizados' },
      { status: 500 }
    )
  }
}

