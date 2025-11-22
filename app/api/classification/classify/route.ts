import { NextRequest, NextResponse } from 'next/server'
import { classifyDocument } from '@/lib/services/classifier'

/**
 * POST /api/classification/classify
 * Classifica um documento usando uma configuração de classificação
 * 
 * Body:
 * - markdown: string (obrigatório) - Conteúdo do documento em Markdown
 * - configId?: string (opcional) - ID da configuração de classificação (usa ativa se não fornecido)
 * - schemaConfigId?: string (opcional) - ID do schema de template (usa ativo se não fornecido)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { markdown, configId, schemaConfigId } = body

    if (!markdown || typeof markdown !== 'string') {
      return NextResponse.json(
        { error: 'Campo obrigatório: markdown (string)' },
        { status: 400 }
      )
    }

    if (markdown.trim() === '') {
      return NextResponse.json(
        { error: 'Markdown não pode estar vazio' },
        { status: 400 }
      )
    }

    // Classifica o documento
    // Nota: schemaConfigId será usado na Fase 6 quando integrarmos completamente
    const result = await classifyDocument(markdown, configId, (message) => {
      console.log(message)
    })

    return NextResponse.json({ result })
  } catch (error) {
    console.error('Error classifying document:', error)
    if (error instanceof Error) {
      // Erros de validação ou configuração
      if (
        error.message.includes('não encontrada') ||
        error.message.includes('não encontrado') ||
        error.message.includes('ativa')
      ) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      // Erros de classificação (dados vazios, etc)
      if (error.message.includes('vazios') || error.message.includes('inválida')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }
    return NextResponse.json(
      { error: 'Erro ao classificar documento' },
      { status: 500 }
    )
  }
}

