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
    // Armazena o evento no histórico
    if (!this.eventHistory.has(jobId)) {
      this.eventHistory.set(jobId, [])
    }
    const history = this.eventHistory.get(jobId)!
    history.push(event)
    
    // Limita o tamanho do histórico
    if (history.length > this.MAX_HISTORY) {
      history.shift() // Remove o evento mais antigo
    }

    // Emite para todos os listeners
    const listeners = this.listeners.get(jobId)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error('Error emitting event to listener:', error)
        }
      })
    }
  }

  /**
   * Obtém o histórico de eventos de um job
   */
  getHistory(jobId: string): ProcessingEvent[] {
    return this.eventHistory.get(jobId) || []
  }

  /**
   * Verifica se o job está completo (último evento é job-complete ou job-error)
   */
  isJobComplete(jobId: string): boolean {
    const history = this.eventHistory.get(jobId)
    if (!history || history.length === 0) {
      return false
    }
    const lastEvent = history[history.length - 1]
    return lastEvent.type === 'job-complete' || lastEvent.type === 'job-error'
  }

  /**
   * Limpa o histórico de eventos de um job específico
   */
  clearHistory(jobId: string) {
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
