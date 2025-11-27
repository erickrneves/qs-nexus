import { Worker, Job } from 'bullmq'
import { redisConnection, WorkflowJobData } from '../config'
import { createWorkflowEngine } from '@/lib/orchestration/workflow-engine'

/**
 * Worker para execução assíncrona de workflows
 */

export const workflowWorker = new Worker<WorkflowJobData>(
  'workflow-execution',
  async (job: Job<WorkflowJobData>) => {
    const { executionId, templateId, organizationId, userId, input } = job.data

    console.log(`[WorkflowWorker] Iniciando execução ${executionId}`)

    try {
      // Cria engine com contexto do tenant
      const engine = createWorkflowEngine(organizationId, userId)

      // Executa workflow
      const result = await engine.executeWorkflow(templateId, input, {
        mode: 'async',
        onProgress: (step, progress) => {
          // Atualiza progress no job
          job.updateProgress(progress)
          console.log(`[WorkflowWorker] ${executionId} - Step: ${step}, Progress: ${progress}%`)
        },
      })

      console.log(`[WorkflowWorker] Execução ${executionId} concluída com sucesso`)

      return {
        success: true,
        executionId,
        output: result.output,
      }
    } catch (error) {
      console.error(`[WorkflowWorker] Erro na execução ${executionId}:`, error)

      throw error // BullMQ vai marcar como failed e fazer retry se configurado
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // Processa até 5 workflows simultâneos
    limiter: {
      max: 10, // Máximo 10 jobs por...
      duration: 1000, // ...1 segundo
    },
  }
)

// Event listeners para logging
workflowWorker.on('completed', (job) => {
  console.log(`[WorkflowWorker] Job ${job.id} completado`)
})

workflowWorker.on('failed', (job, err) => {
  console.error(`[WorkflowWorker] Job ${job?.id} falhou:`, err)
})

workflowWorker.on('error', (err) => {
  console.error('[WorkflowWorker] Worker error:', err)
})

export default workflowWorker

