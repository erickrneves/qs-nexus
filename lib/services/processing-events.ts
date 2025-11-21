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

  /**
   * Registra um listener para um job
   */
  on(jobId: string, listener: EventListener) {
    if (!this.listeners.has(jobId)) {
      this.listeners.set(jobId, [])
    }
    this.listeners.get(jobId)!.push(listener)
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
   * Remove todos os listeners de um job
   */
  removeAllListeners(jobId: string) {
    this.listeners.delete(jobId)
  }

  /**
   * Emite um evento para todos os listeners de um job
   */
  emit(jobId: string, event: ProcessingEvent) {
    const listeners = this.listeners.get(jobId)
    if (listeners) {
      listeners.forEach(listener => listener(event))
    }
  }

  /**
   * Limpa todos os listeners (útil para cleanup)
   */
  clear() {
    this.listeners.clear()
  }
}

export const processingEvents = new ProcessingEventEmitter()
