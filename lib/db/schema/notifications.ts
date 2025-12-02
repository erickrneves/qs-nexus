import { pgTable, uuid, text, boolean, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core'

export const notificationTypeEnum = pgEnum('notification_type', [
  'upload_complete',
  'upload_failed',
  'sped_complete',
  'sped_failed',
  'classification_complete',
  'classification_failed',
  'workflow_complete',
  'workflow_failed',
  'system',
  'info',
])

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // User/Organization
  userId: uuid('user_id'),
  organizationId: uuid('organization_id'),
  
  // Notification data
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  data: jsonb('data'), // Additional data (file names, URLs, etc)
  
  // Status
  read: boolean('read').notNull().default(false),
  readAt: timestamp('read_at'),
  
  // Related entity (optional)
  relatedEntityType: text('related_entity_type'), // 'sped_file', 'document_file', 'workflow', etc
  relatedEntityId: uuid('related_entity_id'),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'), // Optional expiration
})

export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert

