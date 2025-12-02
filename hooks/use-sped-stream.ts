'use client'

import { useEffect, useState, useRef } from 'react'

interface SpedProcessEvent {
  type: 'progress' | 'job-complete' | 'job-error'
  data: {
    fileName?: string
    status?: string
    currentStep?: number
    totalSteps?: number
    progress?: number
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

export function useSpedStream(jobId: string | null) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error' | 'completed'>('idle')
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [totalSteps, setTotalSteps] = useState(5)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [jobComplete, setJobComplete] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const isClosingRef = useRef(false)

  useEffect(() => {
    if (!jobId) {
      return
    }

    // Se já está completo, não reconecta
    if (jobComplete) {
      return
    }

    setStatus('connecting')
    setJobComplete(false)
    setError(null)
    isClosingRef.current = false
    
    const eventSource = new EventSource(`/api/ingest/sped/${jobId}/stream`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      if (!isClosingRef.current) {
        setStatus('connected')
        console.log('[SPED Stream] Conectado ao stream')
      }
    }

    eventSource.onmessage = event => {
      try {
        const processEvent: SpedProcessEvent = JSON.parse(event.data)

        switch (processEvent.type) {
          case 'progress':
            setProgress(processEvent.data.progress || 0)
            setCurrentStep(processEvent.data.currentStep || 0)
            setTotalSteps(processEvent.data.totalSteps || 5)
            setMessage(processEvent.data.message || '')
            if (processEvent.data.stats) {
              setStats(processEvent.data.stats)
            }
            break
            
          case 'job-complete':
            isClosingRef.current = true
            setStatus('completed')
            setJobComplete(true)
            setProgress(100)
            setMessage(processEvent.data.message || 'Concluído')
            if (processEvent.data.stats) {
              setStats(processEvent.data.stats)
            }
            // Fecha imediatamente para evitar reconexão
            eventSource.close()
            eventSourceRef.current = null
            console.log('[SPED Stream] Processamento concluído')
            break
            
          case 'job-error':
            isClosingRef.current = true
            setStatus('error')
            setJobComplete(true)
            setError(processEvent.data.error || 'Erro desconhecido')
            setMessage(processEvent.data.message || 'Erro ao processar')
            // Fecha imediatamente para evitar reconexão
            eventSource.close()
            eventSourceRef.current = null
            console.log('[SPED Stream] Erro no processamento:', processEvent.data.error)
            break
        }
      } catch (err) {
        console.error('[SPED Stream] Erro ao parsear evento:', err, 'Raw data:', event.data)
      }
    }

    eventSource.onerror = (err) => {
      // Se já está fechando ou completo, ignora o erro
      if (isClosingRef.current || jobComplete) {
        return
      }
      
      // Verifica se o EventSource está realmente em erro ou apenas fechado
      if (eventSource.readyState === EventSource.CLOSED) {
        // Conexão foi fechada pelo servidor (normal após job-complete)
        if (!jobComplete) {
          setStatus('error')
          setError('Conexão perdida com o servidor')
        }
        isClosingRef.current = true
        eventSource.close()
        eventSourceRef.current = null
      }
    }

    return () => {
      if (eventSourceRef.current) {
        isClosingRef.current = true
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [jobId]) // Removido jobComplete das dependências para evitar reconexão

  return { 
    status, 
    progress, 
    currentStep,
    totalSteps,
    message,
    error, 
    stats,
    jobComplete 
  }
}

