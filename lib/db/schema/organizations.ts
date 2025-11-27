import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

/**
 * Schema Multi-tenant - Adaptado do qs-comercial-claude
 * Organizations, Users e Organization Memberships
 */

// Enum para roles globais
export const globalRoleEnum = pgEnum('global_role', [
  'super_admin',
  'admin_fiscal',
  'user_fiscal',
  'consultor_ia',
  'viewer',
])

// Enum para roles dentro da organização
export const orgRoleEnum = pgEnum('org_role', [
  'owner',
  'admin_fiscal',
  'user_fiscal',
  'consultor_ia',
  'viewer',
])

/**
 * Organizations - Tenants do sistema
 */
export const organizations = pgTable(
  'organizations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').unique(),
    document: text('document'), // CNPJ
    logoUrl: text('logo_url'),
    
    // Configurações customizadas da organização
    settings: jsonb('settings').default('{}').$type<{
      theme?: string
      timezone?: string
      fiscalYearStart?: string
      defaultWorkflows?: string[]
      features?: {
        enableWorkflows?: boolean
        enableChat?: boolean
        enableAdvancedAnalysis?: boolean
      }
    }>(),
    
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: index('organizations_slug_idx').on(table.slug),
    documentIdx: index('organizations_document_idx').on(table.document),
  })
)

/**
 * Users - Usuários do sistema
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    password: text('password'), // Nullable se usar OAuth
    fullName: text('full_name').notNull(),
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),
    phone: text('phone'),
    
    // Organização padrão do usuário
    defaultOrgId: uuid('default_org_id').references(() => organizations.id),
    
    // Role global (super_admin pode acessar tudo)
    globalRole: globalRoleEnum('global_role').default('user_fiscal'),
    
    // Preferências do usuário
    preferences: jsonb('preferences').default('{}').$type<{
      theme?: 'light' | 'dark' | 'auto'
      language?: string
      notifications?: {
        email?: boolean
        push?: boolean
      }
    }>(),
    
    // OAuth/External providers
    externalProvider: text('external_provider'), // 'google', 'microsoft', etc
    externalId: text('external_id'),
    
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
    defaultOrgIdx: index('users_default_org_idx').on(table.defaultOrgId),
    globalRoleIdx: index('users_global_role_idx').on(table.globalRole),
  })
)

/**
 * Organization Memberships - Vínculo usuário <-> organização
 */
export const organizationMemberships = pgTable(
  'organization_memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    
    // Role do usuário nesta organização
    role: orgRoleEnum('role').notNull().default('viewer'),
    
    // Permissões específicas (override do role)
    permissions: jsonb('permissions').default('[]').$type<string[]>(),
    
    isActive: boolean('is_active').notNull().default(true),
    
    // Metadata
    invitedBy: uuid('invited_by').references(() => users.id),
    joinedAt: timestamp('joined_at').defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    orgIdx: index('org_memberships_org_idx').on(table.organizationId),
    userIdx: index('org_memberships_user_idx').on(table.userId),
    orgUserIdx: index('org_memberships_org_user_idx').on(table.organizationId, table.userId),
  })
)

/**
 * Audit Log - Log de ações importantes
 */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').references(() => organizations.id),
    userId: uuid('user_id').references(() => users.id),
    
    action: text('action').notNull(), // 'user.created', 'workflow.executed', 'sped.uploaded'
    entityType: text('entity_type'), // 'user', 'workflow', 'sped_file'
    entityId: text('entity_id'),
    
    metadata: jsonb('metadata').$type<Record<string, any>>(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    orgIdx: index('audit_logs_org_idx').on(table.organizationId),
    userIdx: index('audit_logs_user_idx').on(table.userId),
    actionIdx: index('audit_logs_action_idx').on(table.action),
    createdIdx: index('audit_logs_created_idx').on(table.createdAt),
  })
)

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(organizationMemberships),
  auditLogs: many(auditLogs),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  defaultOrganization: one(organizations, {
    fields: [users.defaultOrgId],
    references: [organizations.id],
  }),
  memberships: many(organizationMemberships),
  auditLogs: many(auditLogs),
}))

export const organizationMembershipsRelations = relations(organizationMemberships, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMemberships.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationMemberships.userId],
    references: [users.id],
  }),
  invitedByUser: one(users, {
    fields: [organizationMemberships.invitedBy],
    references: [users.id],
  }),
}))

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditLogs.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}))

