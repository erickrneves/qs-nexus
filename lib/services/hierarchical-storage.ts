/**
 * Hierarchical Storage Service
 * 
 * Responsável por salvar estruturas hierárquicas em normalized_data_items
 * Complementa o armazenamento JSONB em normalized_data
 */

import { db } from '@/lib/db'
import { normalizedDataItems } from '@/lib/db/schema/normalized-data-items'
import type { NormalizationField } from '@/lib/db/schema/normalization-templates'

/**
 * Salva estrutura hierárquica de artigos de lei
 */
export async function saveHierarchicalArticles(
  normalizedDataId: string,
  articles: any[],
  organizationId: string,
  userId: string
): Promise<void> {
  let orderIndex = 0
  
  for (const article of articles) {
    // Salvar artigo (nível 1)
    const [articleItem] = await db
      .insert(normalizedDataItems)
      .values({
        normalizedDataId,
        organizationId,
        parentItemId: null,
        hierarchyLevel: 1,
        itemType: 'artigo',
        itemNumber: article.numero?.toString(),
        itemLabel: `Art. ${article.numero}º`,
        content: article.caput || '',
        contentSummary: (article.caput || '').substring(0, 200),
        metadata: {
          caput: article.caput,
          revogado: article.revogado || false,
          vetado: article.vetado || false,
        },
        orderIndex: orderIndex++,
        createdBy: userId,
      })
      .returning()
    
    // Salvar parágrafos (nível 2)
    if (Array.isArray(article.paragrafos)) {
      for (const paragrafo of article.paragrafos) {
        const [paragrafoItem] = await db
          .insert(normalizedDataItems)
          .values({
            normalizedDataId,
            organizationId,
            parentItemId: articleItem.id,
            hierarchyLevel: 2,
            itemType: 'paragrafo',
            itemNumber: paragrafo.numero?.toString(),
            itemLabel: paragrafo.numero === 'único' ? '§ único' : `§ ${paragrafo.numero}º`,
            content: paragrafo.texto || '',
            contentSummary: (paragrafo.texto || '').substring(0, 200),
            metadata: {
              texto: paragrafo.texto,
              paragrafoUnico: paragrafo.numero === 'único',
            },
            orderIndex: orderIndex++,
            createdBy: userId,
          })
          .returning()
        
        // Salvar incisos (nível 3)
        if (Array.isArray(paragrafo.incisos)) {
          for (const inciso of paragrafo.incisos) {
            const [incisoItem] = await db
              .insert(normalizedDataItems)
              .values({
                normalizedDataId,
                organizationId,
                parentItemId: paragrafoItem.id,
                hierarchyLevel: 3,
                itemType: 'inciso',
                itemNumber: inciso.numero,
                itemLabel: `Inciso ${inciso.numero}`,
                content: inciso.texto || '',
                contentSummary: (inciso.texto || '').substring(0, 200),
                metadata: {
                  texto: inciso.texto,
                },
                orderIndex: orderIndex++,
                createdBy: userId,
              })
              .returning()
            
            // Salvar alíneas (nível 4)
            if (Array.isArray(inciso.alineas)) {
              for (const alinea of inciso.alineas) {
                await db
                  .insert(normalizedDataItems)
                  .values({
                    normalizedDataId,
                    organizationId,
                    parentItemId: incisoItem.id,
                    hierarchyLevel: 4,
                    itemType: 'alinea',
                    itemNumber: alinea.letra,
                    itemLabel: `Alínea ${alinea.letra}`,
                    content: alinea.texto || '',
                    contentSummary: (alinea.texto || '').substring(0, 200),
                    metadata: {
                      texto: alinea.texto,
                    },
                    orderIndex: orderIndex++,
                    createdBy: userId,
                  })
              }
            }
          }
        }
      }
    }
  }
}

/**
 * Salva itens hierárquicos genéricos baseado no schema do campo
 */
export async function saveHierarchicalItems(
  normalizedDataId: string,
  items: any[],
  fieldConfig: NormalizationField,
  organizationId: string,
  userId: string,
  parentItemId?: string,
  level: number = 1
): Promise<void> {
  let orderIndex = 0
  
  for (const item of items) {
    const [savedItem] = await db
      .insert(normalizedDataItems)
      .values({
        normalizedDataId,
        organizationId,
        parentItemId: parentItemId || null,
        hierarchyLevel: level,
        itemType: fieldConfig.arrayItemName || 'item',
        itemNumber: item.numero || item.number || item.id,
        itemLabel: generateItemLabel(item, fieldConfig.arrayItemName),
        content: extractContent(item),
        contentSummary: extractContent(item).substring(0, 200),
        metadata: item,
        orderIndex: orderIndex++,
        createdBy: userId,
      })
      .returning()
    
    // Processar campos aninhados recursivamente
    if (fieldConfig.nestedSchema) {
      for (const nestedField of fieldConfig.nestedSchema) {
        if (nestedField.fieldType === 'object_array' && item[nestedField.fieldName]) {
          const nestedItems = item[nestedField.fieldName]
          if (Array.isArray(nestedItems)) {
            await saveHierarchicalItems(
              normalizedDataId,
              nestedItems,
              nestedField,
              organizationId,
              userId,
              savedItem.id,
              level + 1
            )
          }
        }
      }
    }
  }
}

/**
 * Gera label legível para um item
 */
function generateItemLabel(item: any, itemType?: string): string {
  const type = itemType || 'Item'
  const number = item.numero || item.number || item.id || ''
  return `${type} ${number}`.trim()
}

/**
 * Extrai conteúdo textual de um item
 */
function extractContent(item: any): string {
  // Tentar campos comuns
  return item.texto || 
         item.caput || 
         item.content || 
         item.description || 
         JSON.stringify(item)
}

