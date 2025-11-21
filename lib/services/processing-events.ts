/**
 * Sistema de eventos em memória para comunicação entre processamento e SSE
 */

export interface ProcessingEvent {
  jobId: string
  type: 'progress' | 'job-complete' | 'job-error'
  data: {
    fileName?: string
    status?: string
    currentStep?: number
    totalSteps?: number
    progress?: number
    message?: string
    error?: string
  }
}

type EventListener = (event: ProcessingEvent) => void

class ProcessingEventEmitter {
  private listeners: Map<string, EventListener[]> = new Map()
  private eventHistory: Map<string, ProcessingEvent[]> = new Map()
  private readonly MAX_HISTORY = 100 // Máximo de eventos a armazenar por job
  
  constructor() {
    // Garante que há apenas uma instância mesmo durante hot reload
    const instanceId = Math.random().toString(36).substring(7)
    console.log(`[ProcessingEvents] Creating new instance: ${instanceId}`)
  }

  /**
   * Registra um listener para um job
   * @param replayHistory Se true, envia eventos históricos para o listener (padrão: false)
   */
  on(jobId: string, listener: EventListener, replayHistory: boolean = false) {
    if (!this.listeners.has(jobId)) {
      this.listeners.set(jobId, [])
    }
    this.listeners.get(jobId)!.push(listener)
    
    // Envia eventos históricos apenas se solicitado explicitamente
    if (replayHistory) {
      const history = this.eventHistory.get(jobId)
      if (history) {
        history.forEach(event => {
          try {
            listener(event)
          } catch (error) {
            console.error('Error replaying event to listener:', error)
          }
        })
      }
    }
  }

  /**
   * Remove um listener
   */
  off(jobId: string, listener: EventListener) {
    const listeners = this.listeners.get(jobId)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * Remove todos os listeners de um job (mas mantém o histórico)
   */
  removeAllListeners(jobId: string) {
    this.listeners.delete(jobId)
    // NÃO limpa o histórico aqui - deve ser feito explicitamente com clearHistory()
  }

  /**
   * Emite um evento para todos os listeners de um job
   */
  emit(jobId: string, event: ProcessingEvent) {
    const timestamp = new Date().toISOString()
    
    // Armazena o evento no histórico
    if (!this.eventHistory.has(jobId)) {
      this.eventHistory.set(jobId, [])
    }
    const history = this.eventHistory.get(jobId)!
    history.push(event)
    
    console.log(`[ProcessingEvents] [${timestamp}] Stored event in history for job ${jobId}:`, {
      type: event.type,
      historySize: history.length,
      hasListeners: (this.listeners.get(jobId)?.length || 0) > 0,
    })
    
    // Limita o tamanho do histórico
    if (history.length > this.MAX_HISTORY) {
      history.shift() // Remove o evento mais antigo
    }

    // Emite para todos os listeners
    const listeners = this.listeners.get(jobId)
    if (listeners) {
      console.log(`[ProcessingEvents] [${timestamp}] Emitting to ${listeners.length} listener(s) for job ${jobId}`)
      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error('Error emitting event to listener:', error)
        }
      })
    } else {
      console.log(`[ProcessingEvents] [${timestamp}] No listeners registered for job ${jobId}, event stored in history only`)
    }
  }

  /**
   * Obtém o histórico de eventos de um job
   */
  getHistory(jobId: string): ProcessingEvent[] {
    const history = this.eventHistory.get(jobId) || []
    const timestamp = new Date().toISOString()
    console.log(`[ProcessingEvents] [${timestamp}] getHistory called for job ${jobId}:`, {
      historySize: history.length,
      hasHistory: this.eventHistory.has(jobId),
      allJobIds: Array.from(this.eventHistory.keys()),
    })
    return history
  }

  /**
   * Verifica se o job está completo (último evento é job-complete ou job-error)
   */
  isJobComplete(jobId: string): boolean {
    const history = this.eventHistory.get(jobId)
    const timestamp = new Date().toISOString()
    const result = history && history.length > 0 && (history[history.length - 1].type === 'job-complete' || history[history.length - 1].type === 'job-error')
    console.log(`[ProcessingEvents] [${timestamp}] isJobComplete called for job ${jobId}:`, {
      hasHistory: !!history,
      historySize: history?.length || 0,
      isComplete: result,
      lastEventType: history && history.length > 0 ? history[history.length - 1].type : 'none',
    })
    return result
  }

  /**
   * Limpa o histórico de eventos de um job específico
   */
  clearHistory(jobId: string) {
    const timestamp = new Date().toISOString()
    const hadHistory = this.eventHistory.has(jobId)
    const historySize = hadHistory ? this.eventHistory.get(jobId)!.length : 0
    console.log(`[ProcessingEvents] [${timestamp}] clearHistory called for job ${jobId}:`, {
      hadHistory,
      historySize,
      stackTrace: new Error().stack?.split('\n').slice(1, 4).join('\n'),
    })
    this.eventHistory.delete(jobId)
  }

  /**
   * Limpa todos os listeners (útil para cleanup)
   */
  clear() {
    this.listeners.clear()
    this.eventHistory.clear()
  }
}

// Garante singleton mesmo durante hot reload do Next.js
const globalForProcessingEvents = globalThis as unknown as {
  processingEvents: ProcessingEventEmitter | undefined
}

export const processingEvents =
  globalForProcessingEvents.processingEvents ??
  (globalForProcessingEvents.processingEvents = new ProcessingEventEmitter())

if (process.env.NODE_ENV !== 'production') {
  console.log('[ProcessingEvents] Singleton instance:', {
    instanceId: (processingEvents as any).constructor?.name || 'unknown',
    hasListeners: (processingEvents as any).listeners?.size || 0,
    hasHistory: (processingEvents as any).eventHistory?.size || 0,
  })
}
