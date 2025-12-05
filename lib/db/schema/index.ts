// Export all database schemas
export * from './organizations'
export * from './documents'
export * from './sped'
export * from './rag'
export * from './normalized-data'
export * from './normalized-data-items'
export * from './ecd-results'
export * from './ecd-plano-referencial'

// Export document-schemas (selective to avoid conflicts)
export {
  documentSchemas,
  generateZodSchemaFromFields,
} from './document-schemas'

export type {
  DocumentSchema,
  NewDocumentSchema,
  DocumentSchemaField,
} from './document-schemas'

// Export normalization-templates (selective to avoid conflicts)
export {
  normalizationTemplates,
  extractionMethodEnum,
} from './normalization-templates'

export type {
  NormalizationTemplate,
  NewNormalizationTemplate,
  NormalizationField,
} from './normalization-templates'
