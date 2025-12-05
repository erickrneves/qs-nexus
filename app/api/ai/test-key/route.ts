import { NextRequest, NextResponse } from 'next/server'
import { validateOpenAiKey } from '@/lib/services/ai-template-generator'

/**
 * POST /api/ai/test-key
 * Testa validade de uma API Key da OpenAI
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiKey } = body

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key é obrigatória' }, { status: 400 })
    }

    const isValid = await validateOpenAiKey(apiKey)

    return NextResponse.json({
      valid: isValid,
      message: isValid ? 'API Key válida' : 'API Key inválida',
    })
  } catch (error) {
    console.error('Error testing API key:', error)
    return NextResponse.json(
      {
        valid: false,
        error: 'Erro ao testar API Key',
      },
      { status: 500 }
    )
  }
}

