import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { normalizedDataItems } from '@/lib/db/schema/normalized-data-items'
import { normalizedData } from '@/lib/db/schema/normalized-data'
import { documents } from '@/lib/db/schema/documents'
import { eq, and, like, sql } from 'drizzle-orm'

/**
 * GET /api/documents/[id]/articles
 * 
 * Lista todos os artigos (e estrutura hierárquica) de um documento
 * Suporta filtros por:
 * - articleNumber: número do artigo
 * - search: busca full-text no conteúdo
 * - hierarchyLevel: filtrar por nível (1=artigo, 2=parágrafo, etc)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const documentId = params.id
    const { searchParams } = new URL(request.url)
    
    const articleNumber = searchParams.get('articleNumber')
    const search = searchParams.get('search')
    const hierarchyLevel = searchParams.get('hierarchyLevel')

    // 1. Verificar se documento existe e pegar normalized_data_id
    const [document] = await db
      .select({
        id: documents.id,
        organizationId: documents.organizationId,
        customTableRecordId: documents.customTableRecordId,
      })
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1)

    if (!document) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })
    }

    if (!document.customTableRecordId) {
      return NextResponse.json(
        { error: 'Documento ainda não foi normalizado' },
        { status: 404 }
      )
    }

    // 2. Buscar itens hierárquicos
    let query = db
      .select()
      .from(normalizedDataItems)
      .where(eq(normalizedDataItems.normalizedDataId, document.customTableRecordId))
      .$dynamic()

    // Aplicar filtros
    const conditions = [
      eq(normalizedDataItems.normalizedDataId, document.customTableRecordId)
    ]

    if (articleNumber) {
      conditions.push(
        and(
          eq(normalizedDataItems.itemType, 'artigo'),
          eq(normalizedDataItems.itemNumber, articleNumber)
        )!
      )
    }

    if (hierarchyLevel) {
      conditions.push(eq(normalizedDataItems.hierarchyLevel, parseInt(hierarchyLevel)))
    }

    if (search) {
      conditions.push(
        sql`to_tsvector('portuguese', ${normalizedDataItems.content}) @@ plainto_tsquery('portuguese', ${search})`
      )
    }

    const items = await db
      .select()
      .from(normalizedDataItems)
      .where(and(...conditions))
      .orderBy(normalizedDataItems.orderIndex)

    // 3. Organizar em estrutura hierárquica
    const hierarchical = buildHierarchy(items)

    return NextResponse.json({
      success: true,
      documentId,
      totalItems: items.length,
      items: hierarchical,
      rawItems: items, // Também retornar lista flat para facilitar
    })
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar artigos' },
      { status: 500 }
    )
  }
}

/**
 * Organiza itens flat em estrutura hierárquica
 */
function buildHierarchy(items: any[]): any[] {
  const itemsMap = new Map()
  const rootItems: any[] = []

  // Primeira passagem: criar map
  items.forEach(item => {
    itemsMap.set(item.id, { ...item, children: [] })
  })

  // Segunda passagem: construir árvore
  items.forEach(item => {
    const node = itemsMap.get(item.id)
    if (item.parentItemId) {
      const parent = itemsMap.get(item.parentItemId)
      if (parent) {
        parent.children.push(node)
      }
    } else {
      rootItems.push(node)
    }
  })

  return rootItems
}

