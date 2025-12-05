import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'

/**
 * Tabela para armazenar itens hierárquicos extraídos de documentos estruturados
 * 
 * Exemplos de uso:
 * - Artigos, parágrafos, incisos e alíneas de leis
 * - Capítulos e seções de contratos
 * - Itens de listas estruturadas
 * 
 * Permite queries relacionais eficientes e busca hierárquica
 */
export const normalizedDataItems = pgTable(
  'normalized_data_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Referências
    normalizedDataId: uuid('normalized_data_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    
    // Hierarquia
    parentItemId: uuid('parent_item_id'), // NULL para itens raiz (ex: artigos)
    hierarchyLevel: integer('hierarchy_level').notNull().default(1), // 1, 2, 3, 4...
    itemType: text('item_type').notNull(), // 'artigo', 'paragrafo', 'inciso', 'alinea', 'item'
    
    // Identificação
    itemNumber: text('item_number'), // "1", "2", "I", "II", "a", "b"
    itemLabel: text('item_label'), // "Art. 1º", "§ 1º", "Inciso I"
    
    // Conteúdo
    content: text('content').notNull(), // Texto completo do item
    contentSummary: text('content_summary'), // Primeiras 200 chars
    
    // Metadados flexíveis
    metadata: jsonb('metadata').$type<ItemMetadata>(),
    orderIndex: integer('order_index'), // Ordem de aparição
    
    // Auditoria
    createdAt: timestamp('created_at').notNull().defaultNow(),
    createdBy: uuid('created_by'),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    updatedBy: uuid('updated_by'),
  },
  table => ({
    dataIdx: index('idx_normalized_items_data').on(table.normalizedDataId),
    parentIdx: index('idx_normalized_items_parent').on(table.parentItemId),
    hierarchyIdx: index('idx_normalized_items_hierarchy').on(table.hierarchyLevel, table.itemType),
    numberIdx: index('idx_normalized_items_number').on(table.itemNumber),
    orderIdx: index('idx_normalized_items_order').on(table.normalizedDataId, table.orderIndex),
  })
)

/**
 * Metadados flexíveis para diferentes tipos de itens
 */
export interface ItemMetadata {
  // Para artigos de lei
  caput?: string
  revogado?: boolean
  vetado?: boolean
  observacoes?: string
  
  // Para parágrafos
  paragrafoUnico?: boolean
  
  // Para incisos/alíneas
  texto?: string
  
  // Genérico
  [key: string]: any
}

export type NormalizedDataItem = typeof normalizedDataItems.$inferSelect
export type NewNormalizedDataItem = typeof normalizedDataItems.$inferInsert

