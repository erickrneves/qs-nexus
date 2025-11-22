import { NextRequest, NextResponse } from 'next/server'
import {
  loadTemplateSchemaConfig,
  updateTemplateSchemaConfig,
  deleteTemplateSchemaConfig,
} from '@/lib/services/template-schema-service'
import { FieldDefinition } from '@/lib/types/template-schema'

/**
 * GET /api/template-schema/configs/[id]
 * Obtém uma configuração de schema de template específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const config = await loadTemplateSchemaConfig(params.id)
    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error loading template schema config:', error)
    if (error instanceof Error && error.message.includes('não encontrado')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Erro ao carregar configuração de schema de template' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/template-schema/configs/[id]
 * Atualiza uma configuração de schema de template
 * 
 * Body (todos opcionais):
 * - name?: string
 * - fields?: FieldDefinition[]
 * - isActive?: boolean
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const { name, fields, isActive } = body

    const updateData: {
      name?: string
      fields?: FieldDefinition[]
      isActive?: boolean
    } = {}

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json(
          { error: 'name deve ser uma string não vazia' },
          { status: 400 }
        )
      }
      updateData.name = name
    }

    if (fields !== undefined) {
      if (!Array.isArray(fields) || fields.length === 0) {
        return NextResponse.json(
          { error: 'fields deve ser um array não vazio' },
          { status: 400 }
        )
      }
      updateData.fields = fields as FieldDefinition[]
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive
    }

    const config = await updateTemplateSchemaConfig(params.id, updateData)
    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error updating template schema config:', error)
    if (error instanceof Error) {
      if (error.message.includes('não encontrado')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Erro ao atualizar configuração de schema de template' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/template-schema/configs/[id]
 * Deleta uma configuração de schema de template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteTemplateSchemaConfig(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting template schema config:', error)
    if (error instanceof Error && error.message.includes('não encontrado')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Erro ao deletar configuração de schema de template' },
      { status: 500 }
    )
  }
}

