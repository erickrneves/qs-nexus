import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { listSchemas, createSchema } from '@/lib/services/schema-manager'
import { DocumentSchemaField } from '@/lib/db/schema/document-schemas'

/**
 * GET /api/admin/schemas
 * Lista schemas customizados da organização
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth()
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const baseType = searchParams.get('baseType') as 'document' | 'sped' | 'csv' | null
    
    const schemas = await listSchemas(orgId, baseType || undefined)
    
    return NextResponse.json({ schemas })
  } catch (error) {
    console.error('[API] Erro ao listar schemas:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao listar schemas' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/schemas
 * Cria novo schema customizado
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth()
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    
    const {
      name,
      tableName,
      description,
      baseType,
      category,
      fields,
      classificationProfileId,
      enableRag
    } = body
    
    // Validações
    if (!name || !tableName || !baseType || !fields) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, tableName, baseType, fields' },
        { status: 400 }
      )
    }
    
    if (!['document', 'sped', 'csv'].includes(baseType)) {
      return NextResponse.json(
        { error: 'baseType deve ser: document, sped ou csv' },
        { status: 400 }
      )
    }
    
    if (!Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json(
        { error: 'fields deve ser um array com pelo menos 1 campo' },
        { status: 400 }
      )
    }
    
    // Criar schema
    const schema = await createSchema({
      organizationId: orgId,
      name,
      tableName,
      description,
      baseType,
      category,
      fields: fields as DocumentSchemaField[],
      classificationProfileId,
      enableRag,
      createdBy: userId
    })
    
    return NextResponse.json({ schema }, { status: 201 })
  } catch (error) {
    console.error('[API] Erro ao criar schema:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar schema' },
      { status: 500 }
    )
  }
}

