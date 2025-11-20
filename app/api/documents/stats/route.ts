import { NextResponse } from 'next/server'
import { getProcessingStatus } from '@/lib/services/file-tracker'
import { db } from '@/lib/db/index'
import { documentFiles, templates } from '@/lib/db/schema/rag'
import { eq, sql } from 'drizzle-orm'

// Cache por 30 segundos
export const revalidate = 30

export async function GET() {
  try {
    // Status geral
    const status = await getProcessingStatus()

    // Estatísticas por área jurídica
    const areaStats = await db
      .select({
        area: templates.area,
        count: sql<number>`count(*)::int`,
      })
      .from(templates)
      .groupBy(templates.area)

    // Estatísticas por tipo de documento
    const docTypeStats = await db
      .select({
        docType: templates.docType,
        count: sql<number>`count(*)::int`,
      })
      .from(templates)
      .groupBy(templates.docType)

    // Documentos GOLD e SILVER
    const goldCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(templates)
      .where(eq(templates.isGold, true))

    const silverCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(templates)
      .where(eq(templates.isSilver, true))

    // Últimos arquivos processados
    const recentFiles = await db
      .select({
        id: documentFiles.id,
        fileName: documentFiles.fileName,
        status: documentFiles.status,
        wordsCount: documentFiles.wordsCount,
        processedAt: documentFiles.processedAt,
        updatedAt: documentFiles.updatedAt,
      })
      .from(documentFiles)
      .orderBy(documentFiles.updatedAt)
      .limit(10)

    return NextResponse.json({
      summary: status,
      byArea: areaStats,
      byDocType: docTypeStats,
      gold: goldCount[0]?.count || 0,
      silver: silverCount[0]?.count || 0,
      recentFiles: recentFiles,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
  }
}
