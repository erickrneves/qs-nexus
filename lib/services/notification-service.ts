import { db } from '../db'
import { notifications } from '../db/schema/notifications'
import { eq, and, desc, sql } from 'drizzle-orm'

export type NotificationType =
  | 'upload_complete'
  | 'upload_failed'
  | 'sped_complete'
  | 'sped_failed'
  | 'classification_complete'
  | 'classification_failed'
  | 'workflow_complete'
  | 'workflow_failed'
  | 'system'
  | 'info'

export interface CreateNotificationData {
  userId?: string
  organizationId?: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  relatedEntityType?: string
  relatedEntityId?: string
  expiresAt?: Date
}

/**
 * Cria uma nova notificação
 */
export async function createNotification(data: CreateNotificationData) {
  const [notification] = await db
    .insert(notifications)
    .values({
      userId: data.userId,
      organizationId: data.organizationId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data || null,
      relatedEntityType: data.relatedEntityType || null,
      relatedEntityId: data.relatedEntityId || null,
      expiresAt: data.expiresAt || null,
    })
    .returning()

  return notification
}

/**
 * Lista notificações do usuário
 */
export async function listUserNotifications(userId: string, options?: {
  limit?: number
  onlyUnread?: boolean
}) {
  const limit = options?.limit || 50
  const onlyUnread = options?.onlyUnread || false

  let query = db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)

  if (onlyUnread) {
    query = db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.read, false)
      ))
      .orderBy(desc(notifications.createdAt))
      .limit(limit) as any
  }

  return await query
}

/**
 * Conta notificações não lidas
 */
export async function countUnreadNotifications(userId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.read, false)
    ))

  return Number(result[0]?.count || 0)
}

/**
 * Marca notificação como lida
 */
export async function markNotificationAsRead(notificationId: string) {
  const [notification] = await db
    .update(notifications)
    .set({
      read: true,
      readAt: new Date(),
    })
    .where(eq(notifications.id, notificationId))
    .returning()

  return notification
}

/**
 * Marca todas notificações do usuário como lidas
 */
export async function markAllNotificationsAsRead(userId: string) {
  await db
    .update(notifications)
    .set({
      read: true,
      readAt: new Date(),
    })
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.read, false)
    ))
}

/**
 * Deleta notificação
 */
export async function deleteNotification(notificationId: string) {
  await db.delete(notifications).where(eq(notifications.id, notificationId))
}

/**
 * Deleta todas notificações lidas do usuário
 */
export async function deleteReadNotifications(userId: string) {
  await db
    .delete(notifications)
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.read, true)
    ))
}

/**
 * Helper: Cria notificação de sucesso de upload SPED
 */
export async function notifySpedUploadComplete(
  userId: string,
  fileName: string,
  spedFileId: string,
  stats?: {
    accounts?: number
    balances?: number
    entries?: number
    items?: number
  }
) {
  return createNotification({
    userId,
    type: 'sped_complete',
    title: 'SPED Processado com Sucesso',
    message: `O arquivo "${fileName}" foi processado e importado com sucesso.`,
    data: {
      fileName,
      stats,
    },
    relatedEntityType: 'sped_file',
    relatedEntityId: spedFileId,
  })
}

/**
 * Helper: Cria notificação de erro de upload SPED
 */
export async function notifySpedUploadFailed(
  userId: string,
  fileName: string,
  error: string
) {
  return createNotification({
    userId,
    type: 'sped_failed',
    title: 'Erro ao Processar SPED',
    message: `Falha ao processar "${fileName}": ${error}`,
    data: {
      fileName,
      error,
    },
  })
}

/**
 * Helper: Cria notificação de sucesso de upload de documento
 */
export async function notifyDocumentUploadComplete(
  userId: string,
  fileName: string,
  documentFileId: string
) {
  return createNotification({
    userId,
    type: 'upload_complete',
    title: 'Documento Processado',
    message: `O documento "${fileName}" foi processado e está pronto para uso.`,
    data: {
      fileName,
    },
    relatedEntityType: 'document_file',
    relatedEntityId: documentFileId,
  })
}

/**
 * Helper: Cria notificação de erro de upload de documento
 */
export async function notifyDocumentUploadFailed(
  userId: string,
  fileName: string,
  error: string
) {
  return createNotification({
    userId,
    type: 'upload_failed',
    title: 'Erro ao Processar Documento',
    message: `Falha ao processar "${fileName}": ${error}`,
    data: {
      fileName,
      error,
    },
  })
}

