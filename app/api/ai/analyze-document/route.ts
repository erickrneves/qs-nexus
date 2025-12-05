import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { analyzeDocumentStructure } from '@/lib/services/ai-template-generator'

/**
 * POST /api/ai/analyze-document
 * Analisa um documento e sugere estrutura de template com IA
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { documentId, userDescription } = body

    if (!documentId) {
      return NextResponse.json({ error: 'documentId é obrigatório' }, { status: 400 })
    }

    if (!userDescription || userDescription.trim().length === 0) {
      return NextResponse.json(
        { error: 'Descrição do usuário é obrigatória' },
        { status: 400 }
      )
    }

    // Verificar se OpenAI está configurada
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: 'OpenAI API Key não configurada',
          hint: 'Configure a chave em Settings > IA',
        },
        { status: 503 }
      )
    }

    // Analisar documento
    console.log(`🤖 Iniciando análise de documento ${documentId} com IA...`)
    const analysis = await analyzeDocumentStructure(documentId, userDescription)

    console.log(`✅ Análise concluída com confiança de ${(analysis.confidence * 100).toFixed(1)}%`)

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error) {
    console.error('Error analyzing document:', error)
    return NextResponse.json(
      {
        error: 'Erro ao analisar documento',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

