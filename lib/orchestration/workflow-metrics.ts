/**
 * Workflow Metrics
 * Sistema de métricas e observabilidade
 */

/**
 * Tipos de métricas
 */
export interface WorkflowMetrics {
  executionId: string
  workflowName: string
  organizationId?: string
  userId: string
  startTime: number
  endTime?: number
  duration?: number
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  steps: {
    total: number
    completed: number
    failed: number
  }
  tokens: {
    total: number
    byModel: Record<string, number>
  }
  cost: {
    total: number
    byModel: Record<string, number>
  }
  errors: Array<{
    step: string
    message: string
    timestamp: number
  }>
}

/**
 * Collector de métricas (em memória para POC)
 */
class MetricsCollector {
  private metrics: Map<string, WorkflowMetrics> = new Map()

  /**
   * Inicia coleta de métricas para execução
   */
  start(executionId: string, workflowName: string, userId: string, organizationId?: string) {
    this.metrics.set(executionId, {
      executionId,
      workflowName,
      organizationId,
      userId,
      startTime: Date.now(),
      status: 'running',
      steps: {
        total: 0,
        completed: 0,
        failed: 0,
      },
      tokens: {
        total: 0,
        byModel: {},
      },
      cost: {
        total: 0,
        byModel: {},
      },
      errors: [],
    })

    console.log(`[Metrics] Iniciado tracking: ${executionId}`)
  }

  /**
   * Registra step completado
   */
  recordStep(
    executionId: string,
    stepName: string,
    status: 'completed' | 'failed',
    tokens?: number,
    cost?: number,
    model?: string,
    error?: string
  ) {
    const metrics = this.metrics.get(executionId)
    if (!metrics) return

    metrics.steps.total++
    
    if (status === 'completed') {
      metrics.steps.completed++
    } else {
      metrics.steps.failed++
      if (error) {
        metrics.errors.push({
          step: stepName,
          message: error,
          timestamp: Date.now(),
        })
      }
    }

    if (tokens && model) {
      metrics.tokens.total += tokens
      metrics.tokens.byModel[model] = (metrics.tokens.byModel[model] || 0) + tokens
    }

    if (cost && model) {
      metrics.cost.total += cost
      metrics.cost.byModel[model] = (metrics.cost.byModel[model] || 0) + cost
    }
  }

  /**
   * Finaliza coleta de métricas
   */
  finish(
    executionId: string,
    status: 'completed' | 'failed' | 'cancelled'
  ) {
    const metrics = this.metrics.get(executionId)
    if (!metrics) return

    metrics.endTime = Date.now()
    metrics.duration = metrics.endTime - metrics.startTime
    metrics.status = status

    console.log(`[Metrics] Finalizado tracking: ${executionId}`, {
      duration: `${(metrics.duration / 1000).toFixed(2)}s`,
      steps: `${metrics.steps.completed}/${metrics.steps.total}`,
      tokens: metrics.tokens.total,
      cost: `$${metrics.cost.total.toFixed(4)}`,
    })

    // TODO: Persistir métricas no banco de dados
    // Por enquanto, apenas log
  }

  /**
   * Obtém métricas de uma execução
   */
  get(executionId: string): WorkflowMetrics | undefined {
    return this.metrics.get(executionId)
  }

  /**
   * Lista todas as métricas
   */
  listAll(): WorkflowMetrics[] {
    return Array.from(this.metrics.values())
  }

  /**
   * Limpa métricas antigas (> 24h)
   */
  cleanup() {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 horas

    for (const [id, metrics] of this.metrics.entries()) {
      if (metrics.endTime && now - metrics.endTime > maxAge) {
        this.metrics.delete(id)
      }
    }

    console.log(`[Metrics] Cleanup executado, ${this.metrics.size} métricas ativas`)
  }
}

/**
 * Singleton do collector
 */
export const metricsCollector = new MetricsCollector()

/**
 * Helpers para logging estruturado
 */
export function logWorkflowStart(executionId: string, workflowName: string, input: any) {
  console.log(`[Workflow] 🚀 START - ${workflowName} (${executionId})`, {
    input: JSON.stringify(input).substring(0, 200),
  })
}

export function logWorkflowStep(executionId: string, stepName: string, stepType: string) {
  console.log(`[Workflow] 📝 STEP - ${stepName} (${stepType}) - ${executionId}`)
}

export function logWorkflowComplete(executionId: string, duration: number, output: any) {
  console.log(`[Workflow] ✅ COMPLETE - ${executionId}`, {
    duration: `${(duration / 1000).toFixed(2)}s`,
    output: JSON.stringify(output).substring(0, 200),
  })
}

export function logWorkflowFailed(executionId: string, error: string) {
  console.error(`[Workflow] ❌ FAILED - ${executionId}`, { error })
}

export function logToolCall(toolName: string, input: any, output: any) {
  console.log(`[Tool] 🔧 ${toolName}`, {
    input: JSON.stringify(input).substring(0, 150),
    output: JSON.stringify(output).substring(0, 150),
  })
}

export function logLLMCall(model: string, tokens: number, cost: number) {
  console.log(`[LLM] 🤖 ${model}`, {
    tokens,
    cost: `$${cost.toFixed(4)}`,
  })
}

