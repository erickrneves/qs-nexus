/**
 * ECD Results Schema
 * 
 * Tabelas para armazenar resultados de ECD:
 * - Balanço Patrimonial
 * - DRE
 * 
 * Com suporte a:
 * - Múltiplos anos (até 5)
 * - Análise Horizontal (AH)
 * - Análise Vertical (AV)
 */

import {
  pgTable,
  uuid,
  text,
  numeric,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'

// ================================================================
// Balanço Patrimonial
// ================================================================
export const ecdBalancoPatrimonial = pgTable(
  'ecd_balanco_patrimonial',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Multi-tenant
    organizationId: uuid('organization_id').notNull(),
    
    // Referências
    spedFileId: uuid('sped_file_id').notNull(),
    normalizedDataId: uuid('normalized_data_id'), // Referência ao JSONB completo
    
    // Identificação da conta
    codCta: text('cod_cta').notNull(),
    codCtaRef: text('cod_cta_ref').notNull(),
    ctaDescricao: text('cta_descricao'),
    
    // Saldos por ano (JSONB flexível para suportar diferentes quantidades de anos)
    // { "2020": 1000.50, "2021": 1500.75, ... }
    saldos: jsonb('saldos').notNull().$type<Record<number, number>>(),
    
    // Análise Horizontal - Absoluta
    // { "2020_2021_abs": 500.25, "2021_2022_abs": 300.50, ... }
    ahAbs: jsonb('ah_abs').$type<Record<string, number>>(),
    
    // Análise Horizontal - Percentual
    // { "2020_2021_perc": 0.50, "2021_2022_perc": 0.20, ... }
    ahPerc: jsonb('ah_perc').$type<Record<string, number>>(),
    
    // Análise Vertical - Percentual
    // { "2020": 0.15, "2021": 0.16, ... }
    avPerc: jsonb('av_perc').$type<Record<number, number>>(),
    
    // Auditoria
    createdAt: timestamp('created_at').notNull().defaultNow(),
    createdBy: uuid('created_by'),
  },
  table => ({
    orgIdx: index('ecd_bp_org_idx').on(table.organizationId),
    spedFileIdx: index('ecd_bp_sped_file_idx').on(table.spedFileId),
    codCtaIdx: index('ecd_bp_cod_cta_idx').on(table.codCta),
    codCtaRefIdx: index('ecd_bp_cod_cta_ref_idx').on(table.codCtaRef),
    normalizedDataIdx: index('ecd_bp_normalized_data_idx').on(table.normalizedDataId),
  })
)

// ================================================================
// DRE (Demonstração do Resultado do Exercício)
// ================================================================
export const ecdDRE = pgTable(
  'ecd_dre',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Multi-tenant
    organizationId: uuid('organization_id').notNull(),
    
    // Referências
    spedFileId: uuid('sped_file_id').notNull(),
    normalizedDataId: uuid('normalized_data_id'),
    
    // Identificação da conta
    codCta: text('cod_cta').notNull(),
    codCtaRef: text('cod_cta_ref').notNull(),
    ctaDescricao: text('cta_descricao'),
    
    // Saldos por ano (JSONB)
    saldos: jsonb('saldos').notNull().$type<Record<number, number>>(),
    
    // Análise Horizontal - Absoluta
    ahAbs: jsonb('ah_abs').$type<Record<string, number>>(),
    
    // Análise Horizontal - Percentual
    ahPerc: jsonb('ah_perc').$type<Record<string, number>>(),
    
    // Análise Vertical - Percentual
    avPerc: jsonb('av_perc').$type<Record<number, number>>(),
    
    // Auditoria
    createdAt: timestamp('created_at').notNull().defaultNow(),
    createdBy: uuid('created_by'),
  },
  table => ({
    orgIdx: index('ecd_dre_org_idx').on(table.organizationId),
    spedFileIdx: index('ecd_dre_sped_file_idx').on(table.spedFileId),
    codCtaIdx: index('ecd_dre_cod_cta_idx').on(table.codCta),
    codCtaRefIdx: index('ecd_dre_cod_cta_ref_idx').on(table.codCtaRef),
    normalizedDataIdx: index('ecd_dre_normalized_data_idx').on(table.normalizedDataId),
  })
)

// ================================================================
// Tipos TypeScript
// ================================================================

export type ECDBalancoPatrimonial = typeof ecdBalancoPatrimonial.$inferSelect
export type NewECDBalancoPatrimonial = typeof ecdBalancoPatrimonial.$inferInsert

export type ECDDRE = typeof ecdDRE.$inferSelect
export type NewECDDRE = typeof ecdDRE.$inferInsert

