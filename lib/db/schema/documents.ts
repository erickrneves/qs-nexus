import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core'

// ================================================================
// Documents Schema - Documentos gerais (PDF, DOCX, TXT)
// ================================================================

// Enum para tipo de documento
export const documentTypeEnum = pgEnum('document_type', [
  'pdf',
  'docx',
  'doc',
  'txt',
  'other',
])

// Enum para status de processamento (LEGADO - manter por compatibilidade)
export const documentStatusEnum = pgEnum('document_status', [
  'pending',    // Upload feito, aguardando processamento
  'processing', // Sendo processado (RAG pipeline)
  'completed',  // Processado com sucesso
  'failed',     // Erro no processamento
])

// ================================================================
// NOVA ARQUITETURA: Status separado para Normalização e Classificação
// ================================================================

// Status da jornada de NORMALIZAÇÃO (estrutural, sem IA)
export const normalizationStatusEnum = pgEnum('normalization_status', [
  'pending',    // Aguardando início
  'validating', // Validando arquivo e template
  'extracting', // Extraindo dados do documento
  'draft',      // Dados extraídos, aguardando revisão do usuário
  'saving',     // Salvando na tabela customizada
  'completed',  // Normalização concluída
  'failed',     // Erro na normalização
])

// Status da jornada de CLASSIFICAÇÃO (metadados com IA)
export const classificationStatusEnum = pgEnum('classification_status', [
  'pending',     // Aguardando início
  'extracting',  // Extraindo dados com IA
  'chunking',    // Fragmentando documento
  'embedding',   // Gerando embeddings
  'completed',   // Classificação concluída
  'failed',      // Erro na classificação
])

// ================================================================
// Tabela: documents - Documentos gerais para RAG
// ================================================================
export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Multi-tenant
    organizationId: uuid('organization_id').notNull(), // FILTRO PRINCIPAL
    uploadedBy: uuid('uploaded_by').notNull(),
    
    // Identificação
    fileName: text('file_name').notNull(),
    originalFileName: text('original_file_name').notNull(),
    filePath: text('file_path').notNull(),
    fileSize: integer('file_size').notNull(), // bytes
    fileHash: text('file_hash').notNull(),
    mimeType: text('mime_type').notNull(),
    documentType: documentTypeEnum('document_type').notNull(),
    
    // Metadados
    title: text('title'), // Extraído ou definido pelo usuário
    description: text('description'),
    tags: text('tags').array(), // Para categorização
    metadata: jsonb('metadata'), // Metadados extras (autor, data criação, etc)
    
    // Processamento RAG (LEGADO - manter por compatibilidade)
    status: documentStatusEnum('status').notNull().default('pending'),
    errorMessage: text('error_message'),
    processedAt: timestamp('processed_at'),
    
    // ========================================
    // JORNADA 1: NORMALIZAÇÃO (estrutural)
    // ========================================
    normalizationTemplateId: uuid('normalization_template_id'), // FK para normalization_templates
    normalizationStatus: normalizationStatusEnum('normalization_status').default('pending'),
    normalizationCompletedAt: timestamp('normalization_completed_at'),
    normalizationError: text('normalization_error'),
    normalizationProgress: integer('normalization_progress'), // 0-100 (progresso em %)
    normalizationDraftData: jsonb('normalization_draft_data'), // Dados extraídos em rascunho
    normalizationConfidenceScore: integer('normalization_confidence_score'), // 0-100 (confiança)
    customTableRecordId: uuid('custom_table_record_id'), // ID do registro em normalized_data (JSONB)
    
    // ========================================
    // JORNADA 2: CLASSIFICAÇÃO (metadados + IA)
    // ========================================
    classificationConfigId: uuid('classification_config_id'), // FK para classification_configs
    classificationStatus: classificationStatusEnum('classification_status').default('pending'),
    classificationCompletedAt: timestamp('classification_completed_at'),
    classificationError: text('classification_error'),
    
    // Contadores (movidos para classificação)
    totalChunks: integer('total_chunks').default(0),
    totalTokens: integer('total_tokens').default(0),
    totalEmbeddings: integer('total_embeddings').default(0),
    
    // Soft delete
    isActive: boolean('is_active').notNull().default(true),
    deletedAt: timestamp('deleted_at'),
    deletedBy: uuid('deleted_by'),
    
    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  table => ({
    orgIdx: index('documents_org_idx').on(table.organizationId),
    uploadedByIdx: index('documents_uploaded_by_idx').on(table.uploadedBy),
    statusIdx: index('documents_status_idx').on(table.status),
    typeIdx: index('documents_type_idx').on(table.documentType),
    activeIdx: index('documents_active_idx').on(table.isActive),
    orgActiveIdx: index('documents_org_active_idx').on(table.organizationId, table.isActive),
    // Novos índices para jornadas
    normalizationStatusIdx: index('documents_normalization_status_idx').on(table.normalizationStatus),
    classificationStatusIdx: index('documents_classification_status_idx').on(table.classificationStatus),
    normalizationTemplateIdx: index('documents_normalization_template_idx').on(table.normalizationTemplateId),
    classificationConfigIdx: index('documents_classification_config_idx').on(table.classificationConfigId),
  })
)

// ================================================================
// Types exportados
// ================================================================
export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert

