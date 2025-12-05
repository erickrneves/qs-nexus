import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { normalizationTemplates, generateCreateTableSQL } from '@/lib/db/schema/normalization-templates'
import { eq, and } from 'drizzle-orm'
import { hasPermission } from '@/lib/auth/permissions'

/**
 * GET /api/templates
 * Lista templates de normalização
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar permissão
    if (
      session.user.globalRole !== 'super_admin' &&
      session.user.organizationId !== organizationId
    ) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Buscar templates
    const templates = await db
      .select()
      .from(normalizationTemplates)
      .where(eq(normalizationTemplates.organizationId, organizationId))
      .orderBy(normalizationTemplates.name)

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({ error: 'Erro ao buscar templates' }, { status: 500 })
  }
}

/**
 * POST /api/templates
 * Cria novo template de normalização
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Super admin sempre tem permissão
    // Outros usuários precisam de data.upload
    if (session.user.globalRole !== 'super_admin' && 
        !hasPermission(session.user.globalRole || 'viewer', 'data.upload')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const {
      organizationId,
      name,
      description,
      baseType,
      category,
      tableName,
      fields,
      isDefaultForBaseType,
    } = body

    // Validações
    if (!organizationId || !name || !tableName || !fields || !baseType) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { error: 'Template deve ter pelo menos um campo' },
        { status: 400 }
      )
    }

    // Verificar se nome da tabela já existe
    const [existing] = await db
      .select()
      .from(normalizationTemplates)
      .where(
        and(
          eq(normalizationTemplates.organizationId, organizationId),
          eq(normalizationTemplates.tableName, tableName)
        )
      )
      .limit(1)

    if (existing) {
      return NextResponse.json(
        { error: 'Já existe um template com este nome de tabela' },
        { status: 400 }
      )
    }

    // Criar template
    const [template] = await db
      .insert(normalizationTemplates)
      .values({
        organizationId,
        name,
        description,
        baseType,
        category,
        tableName,
        fields,
        isDefaultForBaseType: isDefaultForBaseType || false,
        sqlTableCreated: false,
        isActive: true,
        documentsProcessed: 0,
        createdBy: session.user.id,
      })
      .returning()

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Erro ao criar template: ' + (error instanceof Error ? error.message : 'Erro desconhecido') },
      { status: 500 }
    )
  }
}

