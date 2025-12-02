import { NextRequest, NextResponse } from 'next/server'
import {
  loadClassificationConfig,
  updateClassificationConfig,
  deleteClassificationConfig,
} from '@/lib/services/classification-config'

/**
 * GET /api/classification/configs/[id]
 * Obtém uma configuração de classificação específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const config = await loadClassificationConfig(params.id)
    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error loading classification config:', error)
    if (error instanceof Error && error.message.includes('não encontrada')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Erro ao carregar configuração de classificação' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/classification/configs/[id]
 * Atualiza uma configuração de classificação
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const {
      name,
      documentType,
      systemPrompt,
      modelProvider,
      modelName,
      maxInputTokens,
      maxOutputTokens,
      extractionFunctionCode,
      isActive,
    } = body

    const updateData: {
      name?: string
      documentType?: 'juridico' | 'contabil' | 'geral'
      systemPrompt?: string
      modelProvider?: 'openai' | 'google'
      modelName?: string
      maxInputTokens?: number
      maxOutputTokens?: number
      extractionFunctionCode?: string | null
      isActive?: boolean
    } = {}

    if (name !== undefined) updateData.name = name
    if (documentType !== undefined) updateData.documentType = documentType as 'juridico' | 'contabil' | 'geral'
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt
    if (modelProvider !== undefined) updateData.modelProvider = modelProvider
    if (modelName !== undefined) updateData.modelName = modelName
    if (maxInputTokens !== undefined) updateData.maxInputTokens = maxInputTokens
    if (maxOutputTokens !== undefined) updateData.maxOutputTokens = maxOutputTokens
    if (extractionFunctionCode !== undefined)
      updateData.extractionFunctionCode = extractionFunctionCode
    if (isActive !== undefined) updateData.isActive = isActive

    const config = await updateClassificationConfig(params.id, updateData)
    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error updating classification config:', error)
    if (error instanceof Error) {
      if (error.message.includes('não encontrada')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Erro ao atualizar configuração de classificação' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/classification/configs/[id]
 * Deleta uma configuração de classificação
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteClassificationConfig(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting classification config:', error)
    if (error instanceof Error && error.message.includes('não encontrada')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Erro ao deletar configuração de classificação' },
      { status: 500 }
    )
  }
}

