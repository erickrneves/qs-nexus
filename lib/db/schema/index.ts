// Export all database schemas
export * from './organizations'
export * from './documents'
export * from './sped'
export * from './rag'
export * from './normalized-data'
export * from './normalized-data-items'
export * from './ecd-results'
export * from './ecd-plano-referencial'

// Export document-schemas
export {
  documentSchemas,
  documentSchemasRelations,
  insertDocumentSchemaSchema,
  selectDocumentSchemaSchema,
} from './document-schemas'

// Export normalization-templates
export {
  normalizationTemplates,
  normalizationTemplatesRelations,
  insertNormalizationTemplateSchema,
  selectNormalizationTemplateSchema,
} from './normalization-templates'
