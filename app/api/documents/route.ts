import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { documentFiles, templates } from '@/lib/db/schema/rag'
import { eq, desc, and, sql } from 'drizzle-orm'

// Cache por 10 segundos (listagem muda frequentemente)
export const revalidate = 10

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const area = searchParams.get('area')
    const docType = searchParams.get('docType')

    const offset = (page - 1) * limit

    let query = db
      .select({
        id: documentFiles.id,
        fileName: documentFiles.fileName,
        filePath: documentFiles.filePath,
        status: documentFiles.status,
        wordsCount: documentFiles.wordsCount,
        processedAt: documentFiles.processedAt,
        updatedAt: documentFiles.updatedAt,
        templateId: templates.id,
        templateTitle: templates.title,
        templateArea: templates.area,
        templateDocType: templates.docType,
      })
      .from(documentFiles)
      .leftJoin(templates, eq(documentFiles.id, templates.documentFileId))
      .orderBy(desc(documentFiles.updatedAt))

    if (status) {
      query = query.where(eq(documentFiles.status, status as any)) as any
    }

    const allFiles = await query
    const total = allFiles.length

    // Aplicar filtros adicionais e paginação
    let filteredFiles = allFiles
    if (area) {
      filteredFiles = filteredFiles.filter(f => f.templateArea === area)
    }
    if (docType) {
      filteredFiles = filteredFiles.filter(f => f.templateDocType === docType)
    }

    const paginatedFiles = filteredFiles.slice(offset, offset + limit)

    return NextResponse.json({
      files: paginatedFiles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Erro ao buscar documentos' }, { status: 500 })
  }
}
