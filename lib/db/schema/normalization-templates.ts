import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
  index,
  pgEnum,
  integer,
} from 'drizzle-orm/pg-core'

// ================================================================
// Normalization Templates - Templates puros de estrutura de dados
// SEM configurações de IA - apenas define COMO organizar dados
// ================================================================

// Enum para tipo base do documento
export const baseTypeEnum = pgEnum('normalization_base_type', ['document', 'sped', 'csv'])

// Enum para tipos de campos suportados
export const fieldTypeEnum = pgEnum('normalization_field_type', [
  'text',          // Texto curto
  'numeric',       // Número decimal
  'date',          // Data
  'boolean',       // Verdadeiro/Falso
  'object_array',  // Array de objetos com estrutura definida (ex: artigos de lei)
  'nested_object', // Objeto único com campos aninhados
])

// Enum para método de extração
export const extractionMethodEnum = pgEnum('normalization_extraction_method', [
  'programmatic',  // Extração 100% programática (regex/scripts) - SEM IA - CUSTO $0
  'ai_assisted',   // IA sugere regras, mas extração é programática
  'manual',        // Usuário preenche manualmente
])

// ================================================================
// Tabela: normalization_templates
// Templates que definem ESTRUTURA de dados (sem IA)
// ================================================================
export const normalizationTemplates = pgTable(
  'normalization_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Multi-tenant
    organizationId: uuid('organization_id').notNull(),
    
    // Identificação
    name: text('name').notNull(), // "Contratos de Prestação de Serviços"
    description: text('description'), // Descrição do que esse template organiza
    baseType: baseTypeEnum('base_type').notNull(), // document|sped|csv
    category: text('category'), // juridico, contabil, geral (opcional)
    
    // Configuração da tabela SQL
    tableName: text('table_name').notNull(), // Ex: contratos_prestacao
    
    // Definição dos campos (JSONB)
    // Array de: { fieldName, displayName, fieldType, isRequired, description, validationRules, defaultValue }
    fields: jsonb('fields').notNull().$type<NormalizationField[]>(),
    
    // Método de extração (NOVO - v2.0)
    extractionMethod: text('extraction_method').default('programmatic').$type<'programmatic' | 'ai_assisted' | 'manual'>(),
    
    // Regras de extração programática (NOVO - v2.0)
    // JSONB com regex patterns, extractors, etc
    extractionRules: jsonb('extraction_rules').$type<Record<string, any>>(),
    
    // Script JavaScript customizado (NOVO - v2.0)
    // Para casos avançados que precisam de lógica além de regex
    scriptCode: text('script_code'),
    
    // Controle da tabela SQL
    sqlTableCreated: boolean('sql_table_created').default(false),
    sqlTableCreatedAt: timestamp('sql_table_created_at'),
    sqlCreateStatement: text('sql_create_statement'), // SQL usado (auditoria)
    
    // Controle
    isActive: boolean('is_active').notNull().default(true),
    isDefaultForBaseType: boolean('is_default_for_base_type').default(false),
    
    // Estatísticas
    documentsProcessed: integer('documents_processed').default(0),
    lastUsedAt: timestamp('last_used_at'),
    
    // Auditoria
    createdBy: uuid('created_by'),
    createdByMethod: text('created_by_method').default('manual'), // 'manual' | 'ai'
    aiPrompt: text('ai_prompt'), // Se foi criado por IA, armazena o prompt original
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    updatedBy: uuid('updated_by'),
  },
  table => ({
    orgIdx: index('normalization_templates_org_idx').on(table.organizationId),
    baseTypeIdx: index('normalization_templates_base_type_idx').on(table.baseType),
    activeIdx: index('normalization_templates_active_idx').on(table.isActive),
    tableNameIdx: index('normalization_templates_table_name_idx').on(table.tableName),
  })
)

// ================================================================
// Tipos TypeScript
// ================================================================

export interface NormalizationField {
  fieldName: string          // Nome do campo no BD (snake_case)
  displayName: string        // Nome amigável para UI
  fieldType: 'text' | 'numeric' | 'date' | 'boolean' | 'object_array' | 'nested_object'
  isRequired: boolean        // Campo obrigatório?
  description?: string       // Descrição do campo
  validationRules?: {
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
    pattern?: string
  }
  defaultValue?: string
  hint?: string              // Dica de onde encontrar no documento
  
  // Campos para estruturas hierárquicas (object_array e nested_object)
  nestedSchema?: NormalizationField[]  // Schema dos objetos aninhados
  arrayItemName?: string               // Nome do item no array (ex: "artigo", "item")
  hierarchyLevel?: number              // Nível na hierarquia (1, 2, 3...)
  parentField?: string                 // Campo pai na hierarquia (para referência)
  enableRelationalStorage?: boolean    // Se true, salva também em normalized_data_items
}

export type NormalizationTemplate = typeof normalizationTemplates.$inferSelect
export type NewNormalizationTemplate = typeof normalizationTemplates.$inferInsert

// ================================================================
// Helper: Gera SQL CREATE TABLE a partir de NormalizationTemplate
// ================================================================

export function generateCreateTableSQL(
  template: NormalizationTemplate,
  organizationId: string
): string {
  const fields = template.fields as NormalizationField[]
  
  // Colunas customizadas
  const customColumns = fields.map(field => {
    let sqlType = ''
    
    switch (field.fieldType) {
      case 'text':
        sqlType = 'TEXT'
        break
      case 'numeric':
        sqlType = 'NUMERIC(15,2)'
        break
      case 'date':
        sqlType = 'DATE'
        break
      case 'boolean':
        sqlType = 'BOOLEAN'
        break
    }
    
    const notNull = field.isRequired ? ' NOT NULL' : ''
    const defaultVal = field.defaultValue ? ` DEFAULT '${field.defaultValue}'` : ''
    
    return `  ${field.fieldName} ${sqlType}${notNull}${defaultVal}`
  }).join(',\n')
  
  // Define qual coluna de FK usar baseado no baseType
  let foreignKeyColumn = ''
  let foreignKeyTable = ''
  
  switch (template.baseType) {
    case 'document':
      foreignKeyColumn = 'document_id'
      foreignKeyTable = 'documents'
      break
    case 'sped':
      foreignKeyColumn = 'sped_file_id'
      foreignKeyTable = 'sped_files'
      break
    case 'csv':
      foreignKeyColumn = 'csv_import_id'
      foreignKeyTable = 'csv_imports'
      break
  }
  
  const sql = `
-- Template de Normalização: ${template.name}
-- Base Type: ${template.baseType}
-- Organização: ${organizationId}

CREATE TABLE IF NOT EXISTS ${template.tableName} (
  -- Colunas obrigatórias do sistema
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ${foreignKeyColumn} UUID NOT NULL,
  organization_id UUID NOT NULL,
  
  -- Campos customizados
${customColumns},
  
  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID,
  
  -- Foreign Keys
  CONSTRAINT fk_${template.tableName}_org 
    FOREIGN KEY (organization_id) 
    REFERENCES organizations(id),
    
  CONSTRAINT fk_${template.tableName}_source 
    FOREIGN KEY (${foreignKeyColumn}) 
    REFERENCES ${foreignKeyTable}(id) 
    ON DELETE CASCADE
);

-- Índices automáticos
CREATE INDEX IF NOT EXISTS idx_${template.tableName}_org 
  ON ${template.tableName}(organization_id);

CREATE INDEX IF NOT EXISTS idx_${template.tableName}_source 
  ON ${template.tableName}(${foreignKeyColumn});

CREATE INDEX IF NOT EXISTS idx_${template.tableName}_created 
  ON ${template.tableName}(created_at DESC);

-- Comentário da tabela
COMMENT ON TABLE ${template.tableName} IS 'Template: ${template.name} | Base: ${template.baseType} | Org: ${organizationId}';
`.trim()
  
  return sql
}

