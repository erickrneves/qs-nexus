import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema/documents'
import { ragUsers } from '@/lib/db/schema/rag-users'
import { eq, and } from 'drizzle-orm'
import { hasPermission } from '@/lib/auth/permissions'

/**
 * GET /api/documents/[id]
 * Busca detalhes de um documento específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const documentId = params.id

    // Buscar documento
    const [document] = await db
      .select({
        id: documents.id,
        fileName: documents.fileName,
        originalFileName: documents.originalFileName,
        filePath: documents.filePath,
        fileSize: documents.fileSize,
        fileHash: documents.fileHash,
        mimeType: documents.mimeType,
        documentType: documents.documentType,
        title: documents.title,
        description: documents.description,
        tags: documents.tags,
        metadata: documents.metadata,
        status: documents.status,
        errorMessage: documents.errorMessage,
        processedAt: documents.processedAt,
        totalChunks: documents.totalChunks,
        totalTokens: documents.totalTokens,
        totalEmbeddings: documents.totalEmbeddings,
        organizationId: documents.organizationId,
        uploadedBy: documents.uploadedBy,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
        // Campos da nova arquitetura
        normalizationTemplateId: documents.normalizationTemplateId,
        normalizationStatus: documents.normalizationStatus,
        normalizationProgress: documents.normalizationProgress,
        normalizationCompletedAt: documents.normalizationCompletedAt,
        normalizationError: documents.normalizationError,
        normalizationDraftData: documents.normalizationDraftData,
        normalizationConfidenceScore: documents.normalizationConfidenceScore,
        customTableRecordId: documents.customTableRecordId,
        classificationConfigId: documents.classificationConfigId,
        classificationStatus: documents.classificationStatus,
        classificationCompletedAt: documents.classificationCompletedAt,
        classificationError: documents.classificationError,
        uploader: {
          name: ragUsers.name,
          email: ragUsers.email,
        },
      })
      .from(documents)
      .leftJoin(ragUsers, eq(documents.uploadedBy, ragUsers.id))
      .where(eq(documents.id, documentId))
      .limit(1)

    if (!document) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })
    }

    // Verificar permissão de acesso
    if (
      session.user.globalRole !== 'super_admin' &&
      session.user.organizationId !== document.organizationId
    ) {
      return NextResponse.json({ error: 'Sem permissão para acessar este documento' }, { status: 403 })
    }

    return NextResponse.json({
      document: {
        ...document,
        uploadedBy: document.uploader,
      },
    })
  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json({ error: 'Erro ao buscar documento' }, { status: 500 })
  }
}

/**
 * DELETE /api/documents/[id]
 * Deleta um documento
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (!hasPermission(session.user.globalRole || 'viewer', 'data.delete')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const documentId = params.id

    // Buscar documento para verificar permissão
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1)

    if (!document) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })
    }

    if (
      session.user.globalRole !== 'super_admin' &&
      session.user.organizationId !== document.organizationId
    ) {
      return NextResponse.json({ error: 'Sem permissão para deletar este documento' }, { status: 403 })
    }

    // Soft delete
    await db
      .update(documents)
      .set({
        isActive: false,
        deletedAt: new Date(),
        deletedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId))

    return NextResponse.json({ message: 'Documento deletado com sucesso' })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json({ error: 'Erro ao deletar documento' }, { status: 500 })
  }
}
