import { EventEmitter } from 'events'

export interface SpedProcessingEvent {
  jobId: string
  type: 'progress' | 'job-complete' | 'job-error'
  data: {
    fileName?: string
    status?: 'parsing' | 'saving' | 'completed' | 'failed'
    currentStep?: number
    totalSteps?: number
    progress?: number // 0-100
    message?: string
    error?: string
    stats?: {
      accounts?: number
      balances?: number
      entries?: number
      items?: number
    }
  }
}

class SpedProcessingEvents extends EventEmitter {
  private eventHistory: Map<string, SpedProcessingEvent[]> = new Map()
  private readonly MAX_HISTORY_SIZE = 100
  private readonly HISTORY_RETENTION_MS = 10 * 60 * 1000 // 10 minutos

  emit(jobId: string, event: SpedProcessingEvent): boolean {
    // Salva no histórico
    if (!this.eventHistory.has(jobId)) {
      this.eventHistory.set(jobId, [])
    }
    const history = this.eventHistory.get(jobId)!
    history.push(event)
    
    // Limita tamanho do histórico
    if (history.length > this.MAX_HISTORY_SIZE) {
      history.shift()
    }

    // Limpa histórico após timeout
    if (event.type === 'job-complete' || event.type === 'job-error') {
      setTimeout(() => {
        this.eventHistory.delete(jobId)
        this.removeAllListeners(jobId)
      }, this.HISTORY_RETENTION_MS)
    }

    // Emite evento
    return super.emit(jobId, event)
  }

  getHistory(jobId: string): SpedProcessingEvent[] {
    return this.eventHistory.get(jobId) || []
  }

  on(jobId: string, listener: (event: SpedProcessingEvent) => void): this {
    return super.on(jobId, listener)
  }

  off(jobId: string, listener: (event: SpedProcessingEvent) => void): this {
    return super.off(jobId, listener)
  }
}

export const spedProcessingEvents = new SpedProcessingEvents()

