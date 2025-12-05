import {
  pgTable,
  uuid,
  jsonb,
  timestamp,
  index,
  decimal,
} from 'drizzle-orm/pg-core'

// ================================================================
// Normalized Data - Dados normalizados em JSONB
// Uma única tabela para TODOS os templates (escalável!)
// ================================================================

export const normalizedData = pgTable(
  'normalized_data',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Multi-tenant
    organizationId: uuid('organization_id').notNull(),
    
    // Relacionamentos
    documentId: uuid('document_id').notNull(),
    templateId: uuid('template_id').notNull(),
    
    // Dados normalizados (JSONB - flexível e performático)
    data: jsonb('data').notNull().$type<Record<string, any>>(),
    
    // Metadados da extração
    extractedAt: timestamp('extracted_at'),
    extractionConfidence: decimal('extraction_confidence', { precision: 3, scale: 2 }),
    
    // Auditoria
    createdAt: timestamp('created_at').notNull().defaultNow(),
    createdBy: uuid('created_by'),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    updatedBy: uuid('updated_by'),
  },
  table => ({
    orgIdx: index('idx_normalized_data_org').on(table.organizationId),
    documentIdx: index('idx_normalized_data_document').on(table.documentId),
    templateIdx: index('idx_normalized_data_template').on(table.templateId),
    orgTemplateIdx: index('idx_normalized_data_org_template').on(table.organizationId, table.templateId),
    createdIdx: index('idx_normalized_data_created').on(table.createdAt),
  })
)

// ================================================================
// Tipos TypeScript
// ================================================================

export type NormalizedData = typeof normalizedData.$inferSelect
export type NewNormalizedData = typeof normalizedData.$inferInsert

// ================================================================
// Helper: Construir query para buscar dados por campo
// ================================================================

export interface QueryFilter {
  field: string
  operator: '=' | '>' | '<' | '>=' | '<=' | '!=' | 'LIKE' | 'ILIKE'
  value: string | number | boolean
}

/**
 * Exemplo de uso:
 * 
 * const results = await db
 *   .select()
 *   .from(normalizedData)
 *   .where(
 *     and(
 *       eq(normalizedData.templateId, templateId),
 *       sql`data->>'numero_contrato' = ${numeroContrato}`
 *     )
 *   )
 */

