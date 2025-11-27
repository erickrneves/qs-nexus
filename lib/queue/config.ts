import { Queue, QueueOptions } from 'bullmq'
import IORedis from 'ioredis'

/**
 * Configuração de Redis e Queues com BullMQ
 * Para async processing de workflows e jobs pesados
 */

// Configuração de Redis
// Usar Redis local em dev, ou Redis do Neon/Upstash em produção
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

export const redisConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

// Configurações padrão de Queue
const defaultQueueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Remove jobs completed após 24h
      count: 1000, // Mantém últimos 1000 jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Remove jobs failed após 7 dias
    },
  },
}

/**
 * Queue para execução de workflows
 */
export const workflowQueue = new Queue('workflow-execution', defaultQueueOptions)

/**
 * Queue para processamento de SPED
 */
export const spedProcessingQueue = new Queue('sped-processing', defaultQueueOptions)

/**
 * Queue para geração de embeddings
 */
export const embeddingQueue = new Queue('embedding-generation', defaultQueueOptions)

/**
 * Queue para notificações
 */
export const notificationQueue = new Queue('notifications', defaultQueueOptions)

/**
 * Tipos de Jobs
 */
export interface WorkflowJobData {
  executionId: string
  templateId: string
  organizationId: string
  userId: string
  input: any
}

export interface SpedProcessingJobData {
  fileId: string
  filePath: string
  organizationId: string
  userId: string
}

export interface EmbeddingJobData {
  documentId: string
  chunks: Array<{
    id: string
    content: string
  }>
  organizationId: string
}

export interface NotificationJobData {
  type: 'workflow_completed' | 'workflow_failed' | 'sped_processed' | 'general'
  recipientId: string
  organizationId: string
  data: any
}

/**
 * Helper para adicionar job de workflow
 */
export async function enqueueWorkflowExecution(data: WorkflowJobData, priority?: number) {
  return workflowQueue.add('execute-workflow', data, {
    priority: priority || 10,
    jobId: data.executionId, // Usa execution ID como job ID para idempotência
  })
}

/**
 * Helper para adicionar job de processamento SPED
 */
export async function enqueueSpedProcessing(data: SpedProcessingJobData) {
  return spedProcessingQueue.add('process-sped', data, {
    priority: 5,
  })
}

/**
 * Helper para adicionar job de embeddings
 */
export async function enqueueEmbeddingGeneration(data: EmbeddingJobData) {
  return embeddingQueue.add('generate-embeddings', data)
}

/**
 * Helper para adicionar notificação
 */
export async function enqueueNotification(data: NotificationJobData) {
  return notificationQueue.add('send-notification', data, {
    priority: 1, // Notificações têm baixa prioridade
  })
}

/**
 * Cleanup - fechar conexões ao shutdown
 */
export async function closeQueues() {
  await Promise.all([
    workflowQueue.close(),
    spedProcessingQueue.close(),
    embeddingQueue.close(),
    notificationQueue.close(),
  ])
  
  await redisConnection.quit()
}

