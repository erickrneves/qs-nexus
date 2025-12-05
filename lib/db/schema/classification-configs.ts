import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  index,
  decimal,
  integer,
} from 'drizzle-orm/pg-core'

// ================================================================
// Classification Configs - Configurações de IA para Classificação
// Define COMO extrair metadados usando IA (separado da estrutura)
// ================================================================

export const classificationConfigs = pgTable(
  'classification_configs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Multi-tenant
    organizationId: uuid('organization_id').notNull(),
    
    // Link para o template de normalização
    normalizationTemplateId: uuid('normalization_template_id').notNull(),
    
    // Identificação
    name: text('name').notNull(), // "Config IA - Contratos"
    description: text('description'),
    
    // Configuração de IA
    systemPrompt: text('system_prompt').notNull(), // Instrução para LLM
    modelProvider: text('model_provider').notNull().default('openai'), // openai|google
    modelName: text('model_name').notNull().default('gpt-4'), // gpt-4, gemini-pro
    temperature: decimal('temperature', { precision: 3, scale: 2 }).default('0.10'),
    maxInputTokens: integer('max_input_tokens').default(8000),
    maxOutputTokens: integer('max_output_tokens').default(2000),
    
    // Configuração de RAG (opcional)
    enableRAG: boolean('enable_rag').notNull().default(true), // Gerar embeddings?
    enableChunking: boolean('enable_chunking').notNull().default(true),
    chunkSize: integer('chunk_size').default(800), // Tokens por chunk
    
    // Controle
    isActive: boolean('is_active').notNull().default(true),
    isDefault: boolean('is_default').default(false), // Config padrão para este template?
    
    // Estatísticas
    documentsClassified: integer('documents_classified').default(0),
    totalCost: decimal('total_cost', { precision: 10, scale: 4 }).default('0.0000'), // Custo acumulado
    lastUsedAt: timestamp('last_used_at'),
    
    // Auditoria
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    updatedBy: uuid('updated_by'),
  },
  table => ({
    orgIdx: index('classification_configs_org_idx').on(table.organizationId),
    templateIdx: index('classification_configs_template_idx').on(table.normalizationTemplateId),
    activeIdx: index('classification_configs_active_idx').on(table.isActive),
  })
)

// ================================================================
// Tipos TypeScript
// ================================================================

export type ClassificationConfig = typeof classificationConfigs.$inferSelect
export type NewClassificationConfig = typeof classificationConfigs.$inferInsert

