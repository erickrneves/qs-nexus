import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { rejectDraft } from '@/lib/services/normalization-processor-v2'

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

    await rejectDraft(documentId)

    return NextResponse.json({
      success: true,
      message: 'Draft rejeitado. Você pode reprocessar o documento.',
    })
  } catch (error) {
    console.error('Error rejecting draft:', error)
    return NextResponse.json(
      { error: 'Erro ao rejeitar draft' },
      { status: 500 }
    )
  }
}

