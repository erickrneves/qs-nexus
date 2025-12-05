import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { processDocumentNormalization } from '@/lib/services/normalization-processor'

/**
 * POST /api/documents/[id]/process-normalization
 * Processa a normalização de um documento
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const documentId = params.id
    const organizationId = session.user.organizationId || ''

    // Processar normalização
    const result = await processDocumentNormalization(documentId, organizationId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro ao processar normalização' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Normalização processada com sucesso',
      documentId: result.documentId,
      customTableRecordId: result.customTableRecordId,
    })
  } catch (error) {
    console.error('Error processing normalization:', error)
    return NextResponse.json(
      { error: 'Erro ao processar normalização' },
      { status: 500 }
    )
  }
}

