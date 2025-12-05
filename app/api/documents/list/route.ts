import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema/documents'
import { ragUsers } from '@/lib/db/schema/rag-users'
import { eq, and, gte, lte, ilike, or, desc, asc } from 'drizzle-orm'

// Forçar runtime dinâmico
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/documents/list
 * Lista documentos da tabela 'documents' (não confundir com document_files)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // Filtros
    const organizationId = searchParams.get('organizationId')
    const status = searchParams.get('status')
    const documentType = searchParams.get('documentType')
    const search = searchParams.get('search') || ''
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const offset = (page - 1) * limit

    // Construir condições WHERE
    const conditions = []

    // CRÍTICO: Filtro por organização
    if (organizationId) {
      conditions.push(eq(documents.organizationId, organizationId))
    }

    // Filtro por status
    if (status && status !== 'all') {
      conditions.push(eq(documents.status, status as any))
    }

    // Filtro por tipo
    if (documentType && documentType !== 'all') {
      conditions.push(eq(documents.documentType, documentType as any))
    }

    // Filtro por período
    if (dateFrom) {
      conditions.push(gte(documents.createdAt, new Date(dateFrom)))
    }
    if (dateTo) {
      conditions.push(lte(documents.createdAt, new Date(dateTo)))
    }

    // Filtro de busca
    if (search) {
      conditions.push(
        or(
          ilike(documents.fileName, `%${search}%`),
          ilike(documents.originalFileName, `%${search}%`),
          ilike(documents.title, `%${search}%`)
        ) as any
      )
    }

    // Apenas documentos ativos
    conditions.push(eq(documents.isActive, true))

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Determinar ordenação
    let orderByClause
    if (sortBy === 'fileName') {
      orderByClause = sortOrder === 'asc' ? asc(documents.fileName) : desc(documents.fileName)
    } else if (sortBy === 'status') {
      orderByClause = sortOrder === 'asc' ? asc(documents.status) : desc(documents.status)
    } else {
      // default: createdAt
      orderByClause = sortOrder === 'asc' ? asc(documents.createdAt) : desc(documents.createdAt)
    }

    // Query com filtros e join com usuários
    let query = db
      .select({
        id: documents.id,
        organizationId: documents.organizationId,
        uploadedBy: documents.uploadedBy,
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
        isActive: documents.isActive,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
        // Novos campos da refatoração
        normalizationStatus: documents.normalizationStatus,
        classificationStatus: documents.classificationStatus,
        normalizationError: documents.normalizationError,
        classificationError: documents.classificationError,
        uploader: {
          name: ragUsers.name,
          email: ragUsers.email,
        },
      })
      .from(documents)
      .leftJoin(ragUsers, eq(documents.uploadedBy, ragUsers.id))

    if (whereClause) {
      query = query.where(whereClause) as any
    }

    // Aplicar ordenação
    query = query.orderBy(orderByClause) as any

    // Executar query
    const allDocs = await query
    const total = allDocs.length

    // Aplicar paginação e reformatar
    const paginatedDocs = allDocs.slice(offset, offset + limit).map(doc => ({
      ...doc,
      uploadedBy: doc.uploader,
    }))

    // Calcular estatísticas
    const stats = {
      total: allDocs.length,
      pending: allDocs.filter((d) => d.status === 'pending').length,
      processing: allDocs.filter((d) => d.status === 'processing').length,
      completed: allDocs.filter((d) => d.status === 'completed').length,
      failed: allDocs.filter((d) => d.status === 'failed').length,
    }

    return NextResponse.json({
      documents: paginatedDocs,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error listing documents:', error)
    return NextResponse.json({ error: 'Erro ao listar documentos' }, { status: 500 })
  }
}
