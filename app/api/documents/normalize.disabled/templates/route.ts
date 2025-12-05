import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { normalizationTemplates } from '@/lib/db/schema/normalization-templates'
import { eq, and } from 'drizzle-orm'

// ================================================================
// GET /api/documents/normalize/templates
// Lista templates de normalização disponíveis para a organização
// ================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar templates ativos para documentos
    const templates = await db
      .select()
      .from(normalizationTemplates)
      .where(
        and(
          eq(normalizationTemplates.organizationId, organizationId),
          eq(normalizationTemplates.baseType, 'document'),
          eq(normalizationTemplates.isActive, true)
        )
      )
      .orderBy(normalizationTemplates.name)

    // Adicionar status de tabela
    const templatesWithStatus = templates.map(template => ({
      ...template,
      tableExists: template.sqlTableCreated || false,
      tableStatus: template.sqlTableCreated ? 'exists' : 'needs_creation',
    }))

    return NextResponse.json({
      success: true,
      templates: templatesWithStatus,
    })
  } catch (error) {
    console.error('Erro ao buscar templates:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar templates' },
      { status: 500 }
    )
  }
}

