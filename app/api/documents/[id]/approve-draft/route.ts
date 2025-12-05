import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { approveDraft } from '@/lib/services/normalization-processor-v2'
import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema/documents'
import { eq } from 'drizzle-orm'

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

    // Buscar documento para pegar organizationId
    const [doc] = await db
      .select({ organizationId: documents.organizationId })
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1)

    if (!doc) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })
    }

    // Aprovar draft
    const result = await approveDraft(documentId, doc.organizationId, session.user.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro ao aprovar dados' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      normalizedDataId: result.normalizedDataId,
      message: 'Dados aprovados e salvos com sucesso!',
    })
  } catch (error) {
    console.error('Error approving draft:', error)
    return NextResponse.json(
      { error: 'Erro ao aprovar dados' },
      { status: 500 }
    )
  }
}

