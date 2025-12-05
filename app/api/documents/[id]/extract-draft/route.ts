import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { extractToDraft } from '@/lib/services/normalization-processor-v2'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const documentId = params.id
    const body = await request.json()
    const { templateId } = body

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID é obrigatório' }, { status: 400 })
    }

    // Extrair dados para draft
    const result = await extractToDraft(documentId, templateId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro ao extrair dados' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      draftData: result.draftData,
      confidenceScore: result.confidenceScore,
      warnings: result.warnings,
    })
  } catch (error) {
    console.error('Error extracting to draft:', error)
    return NextResponse.json(
      { error: 'Erro ao extrair dados' },
      { status: 500 }
    )
  }
}

