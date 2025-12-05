import { pgTable, serial, varchar, text, integer, timestamp } from 'drizzle-orm/pg-core'

export const ecdPlanoReferencial = pgTable('ecd_plano_referencial', {
  id: serial('id').primaryKey(),
  codCtaRef: varchar('cod_cta_ref', { length: 50 }).notNull(),
  descricao: text('descricao').notNull(),
  tipo: varchar('tipo', { length: 10 }).notNull(), // 'BP' ou 'DRE'
  nivel: integer('nivel').notNull(),
  tipoConta: varchar('tipo_conta', { length: 20 }).notNull(), // 'sintética', 'agregadora', 'intermediária', 'analítica'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export type EcdPlanoReferencial = typeof ecdPlanoReferencial.$inferSelect
export type NewEcdPlanoReferencial = typeof ecdPlanoReferencial.$inferInsert

