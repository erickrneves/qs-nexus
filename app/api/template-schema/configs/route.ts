import { NextRequest, NextResponse } from 'next/server'
import {
  listTemplateSchemaConfigs,
  createTemplateSchemaConfig,
} from '@/lib/services/template-schema-service'
import { FieldDefinition } from '@/lib/types/template-schema'

/**
 * GET /api/template-schema/configs
 * Lista todas as configurações de schema de template
 */
export async function GET(request: NextRequest) {
  try {
    const configs = await listTemplateSchemaConfigs()
    return NextResponse.json({ configs })
  } catch (error) {
    console.error('Error listing template schema configs:', error)
    return NextResponse.json(
      { error: 'Erro ao listar configurações de schema de template' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/template-schema/configs
 * Cria uma nova configuração de schema de template
 * 
 * Body:
 * - name: string (obrigatório)
 * - fields: FieldDefinition[] (obrigatório)
 * - isActive?: boolean (opcional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { name, fields, isActive } = body

    // Validação básica
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Campo obrigatório: name (string não vazio)' },
        { status: 400 }
      )
    }

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json(
        { error: 'Campo obrigatório: fields (array não vazio)' },
        { status: 400 }
      )
    }

    const config = await createTemplateSchemaConfig({
      name,
      fields: fields as FieldDefinition[],
      isActive: isActive ?? false,
    })

    return NextResponse.json({ config }, { status: 201 })
  } catch (error) {
    console.error('Error creating template schema config:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Erro ao criar configuração de schema de template' },
      { status: 500 }
    )
  }
}

