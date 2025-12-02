import { NextRequest, NextResponse } from 'next/server'
import {
  listClassificationConfigs,
  createClassificationConfig,
} from '@/lib/services/classification-config'

/**
 * GET /api/classification/configs
 * Lista todas as configurações de classificação
 */
export async function GET(request: NextRequest) {
  try {
    const configs = await listClassificationConfigs()
    return NextResponse.json({ configs })
  } catch (error) {
    console.error('Error listing classification configs:', error)
    return NextResponse.json(
      { error: 'Erro ao listar configurações de classificação' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/classification/configs
 * Cria uma nova configuração de classificação
 */
export async function POST(request: NextRequest) {
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

    // Validação básica
    if (!name || !systemPrompt || !modelProvider || !modelName) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, systemPrompt, modelProvider, modelName' },
        { status: 400 }
      )
    }

    if (!documentType) {
      return NextResponse.json(
        { error: 'Campo obrigatório: documentType (juridico, contabil ou geral)' },
        { status: 400 }
      )
    }

    if (!maxInputTokens || !maxOutputTokens) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: maxInputTokens, maxOutputTokens' },
        { status: 400 }
      )
    }

    const config = await createClassificationConfig({
      name,
      documentType: documentType as 'juridico' | 'contabil' | 'geral',
      systemPrompt,
      modelProvider,
      modelName,
      maxInputTokens,
      maxOutputTokens,
      extractionFunctionCode: extractionFunctionCode || null,
      isActive: isActive ?? false,
    })

    return NextResponse.json({ config }, { status: 201 })
  } catch (error) {
    console.error('Error creating classification config:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Erro ao criar configuração de classificação' },
      { status: 500 }
    )
  }
}

