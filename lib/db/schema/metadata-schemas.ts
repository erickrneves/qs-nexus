import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

/**
 * Schema de Metadados Híbridos
 * Permite schemas base fixos + campos customizáveis por tenant
 */

// Enum para tipos de schemas
export const schemaTypeEnum = pgEnum('metadata_schema_type', [
  'sped_ecd',
  'sped_ecf',
  'sped_efd',
  'legal_document',
  'fiscal_document',
  'custom',
])

// Enum para tipos de campo
export const fieldTypeEnum = pgEnum('field_type', [
  'text',
  'number',
  'date',
  'boolean',
  'select', // Com options
  'multiselect',
  'json',
])

/**
 * Metadata Schemas - Schemas de metadados configuráveis
 */
export const metadataSchemas = pgTable(
  'metadata_schemas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Multi-tenant (null = schema global)
    organizationId: uuid('organization_id'),
    
    name: text('name').notNull(),
    description: text('description'),
    type: schemaTypeEnum('type').notNull(),
    
    // Schema base (campos fixos obrigatórios)
    baseSchema: jsonb('base_schema').notNull().$type<{
      fields: Array<{
        name: string
        type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect' | 'json'
        label: string
        required: boolean
        defaultValue?: any
        options?: Array<{ value: string; label: string }> // Para select/multiselect
        validation?: {
          min?: number
          max?: number
          pattern?: string
          minLength?: number
          maxLength?: number
        }
      }>
    }>(),
    
    // Campos customizados adicionados pelo tenant
    customFields: jsonb('custom_fields').default('[]').$type<{
      fields: Array<{
        name: string
        type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect' | 'json'
        label: string
        required: boolean
        defaultValue?: any
        options?: Array<{ value: string; label: string }>
        validation?: {
          min?: number
          max?: number
          pattern?: string
          minLength?: number
          maxLength?: number
        }
      }>
    }>(),
    
    // Regras de validação globais
    validationRules: jsonb('validation_rules').$type<{
      rules: Array<{
        type: 'required_together' | 'mutually_exclusive' | 'conditional' | 'custom'
        fields: string[]
        condition?: string
        message: string
      }>
    }>(),
    
    // UI Configuration
    uiConfig: jsonb('ui_config').$type<{
      sections?: Array<{
        title: string
        fields: string[]
        collapsible?: boolean
      }>
      displayOrder?: string[]
    }>(),
    
    isActive: boolean('is_active').notNull().default(true),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    orgIdx: index('metadata_schemas_org_idx').on(table.organizationId),
    typeIdx: index('metadata_schemas_type_idx').on(table.type),
    activeIdx: index('metadata_schemas_active_idx').on(table.isActive),
  })
)

/**
 * Schema Versions - Versionamento de schemas
 */
export const metadataSchemaVersions = pgTable(
  'metadata_schema_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schemaId: uuid('schema_id')
      .notNull()
      .references(() => metadataSchemas.id, { onDelete: 'cascade' }),
    
    version: text('version').notNull(), // Semantic versioning
    baseSchema: jsonb('base_schema').notNull(),
    customFields: jsonb('custom_fields').notNull(),
    validationRules: jsonb('validation_rules'),
    
    changeLog: text('change_log'),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    schemaIdx: index('metadata_schema_versions_schema_idx').on(table.schemaId),
    versionIdx: index('metadata_schema_versions_version_idx').on(table.version),
  })
)

// Relations
export const metadataSchemasRelations = relations(metadataSchemas, ({ many }) => ({
  versions: many(metadataSchemaVersions),
}))

export const metadataSchemaVersionsRelations = relations(metadataSchemaVersions, ({ one }) => ({
  schema: one(metadataSchemas, {
    fields: [metadataSchemaVersions.schemaId],
    references: [metadataSchemas.id],
  }),
}))

/**
 * Schemas Base Pré-configurados
 */
export const BASE_SCHEMAS = {
  sped_ecd: {
    name: 'SPED ECD - Escrituração Contábil Digital',
    type: 'sped_ecd' as const,
    baseSchema: {
      fields: [
        {
          name: 'cnpj',
          type: 'text' as const,
          label: 'CNPJ',
          required: true,
          validation: { pattern: '^\\d{14}$' },
        },
        {
          name: 'companyName',
          type: 'text' as const,
          label: 'Razão Social',
          required: true,
        },
        {
          name: 'periodStart',
          type: 'date' as const,
          label: 'Início do Período',
          required: true,
        },
        {
          name: 'periodEnd',
          type: 'date' as const,
          label: 'Fim do Período',
          required: true,
        },
        {
          name: 'accountsCount',
          type: 'number' as const,
          label: 'Quantidade de Contas',
          required: false,
        },
        {
          name: 'balancesCount',
          type: 'number' as const,
          label: 'Quantidade de Saldos',
          required: false,
        },
        {
          name: 'entriesCount',
          type: 'number' as const,
          label: 'Quantidade de Lançamentos',
          required: false,
        },
      ],
    },
  },
  legal_document: {
    name: 'Documentos Legais',
    type: 'legal_document' as const,
    baseSchema: {
      fields: [
        {
          name: 'docType',
          type: 'select' as const,
          label: 'Tipo de Documento',
          required: true,
          options: [
            { value: 'peticao_inicial', label: 'Petição Inicial' },
            { value: 'contestacao', label: 'Contestação' },
            { value: 'recurso', label: 'Recurso' },
            { value: 'parecer', label: 'Parecer' },
            { value: 'contrato', label: 'Contrato' },
            { value: 'outro', label: 'Outro' },
          ],
        },
        {
          name: 'area',
          type: 'select' as const,
          label: 'Área do Direito',
          required: true,
          options: [
            { value: 'civil', label: 'Civil' },
            { value: 'trabalhista', label: 'Trabalhista' },
            { value: 'tributario', label: 'Tributário' },
            { value: 'empresarial', label: 'Empresarial' },
            { value: 'outro', label: 'Outro' },
          ],
        },
        {
          name: 'complexity',
          type: 'select' as const,
          label: 'Complexidade',
          required: false,
          options: [
            { value: 'simples', label: 'Simples' },
            { value: 'medio', label: 'Médio' },
            { value: 'complexo', label: 'Complexo' },
          ],
        },
        {
          name: 'partes',
          type: 'text' as const,
          label: 'Partes Envolvidas',
          required: false,
        },
        {
          name: 'dataCriacao',
          type: 'date' as const,
          label: 'Data de Criação',
          required: false,
        },
      ],
    },
  },
}

// Types
export type MetadataSchema = typeof metadataSchemas.$inferSelect
export type NewMetadataSchema = typeof metadataSchemas.$inferInsert

export type MetadataSchemaVersion = typeof metadataSchemaVersions.$inferSelect
export type NewMetadataSchemaVersion = typeof metadataSchemaVersions.$inferInsert

