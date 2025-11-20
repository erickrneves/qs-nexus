'use client'

import { useEffect, useState, useRef } from 'react'

interface ProcessEvent {
  type: 'progress' | 'job-complete' | 'job-error'
  data: {
    fileName?: string
    status?: string
    currentStep?: number
    totalSteps?: number
    progress?: number
    message?: string
    error?: string
    jobId?: string
  }
}

export function useProcessStream(jobId: string | null) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [files, setFiles] = useState<Record<string, any>>({})
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!jobId) {
      return
    }

    setStatus('connecting')
    const eventSource = new EventSource(`/api/process/${jobId}/stream`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setStatus('connected')
    }

    eventSource.onmessage = event => {
      try {
        const processEvent: ProcessEvent = JSON.parse(event.data)

        switch (processEvent.type) {
          case 'progress':
            if (processEvent.data.fileName) {
              const fileName = processEvent.data.fileName
              setFiles(prev => {
                const updated = {
                  ...prev,
                  [fileName]: {
                    fileName: fileName,
                    status: processEvent.data.status || 'processing',
                    progress: processEvent.data.progress || 0,
                    currentStep: processEvent.data.currentStep,
                    totalSteps: processEvent.data.totalSteps,
                    message: processEvent.data.message,
                    error: processEvent.data.error,
                  },
                }
                // Atualiza progresso geral (média de todos os arquivos)
                const allFiles = Object.values(updated)
                const avgProgress =
                  allFiles.length > 0
                    ? allFiles.reduce((acc: number, f: any) => acc + (f.progress || 0), 0) /
                      allFiles.length
                    : 0
                setProgress(avgProgress)
                return updated
              })
            }
            break
          case 'job-complete':
          case 'job-error':
            setStatus('idle')
            if (processEvent.data.error) {
              setError(processEvent.data.error)
            }
            eventSource.close()
            break
        }
      } catch (err) {
        console.error('Error parsing SSE event:', err)
      }
    }

    eventSource.onerror = () => {
      setStatus('error')
      eventSource.close()
    }

    return () => {
      eventSource.close()
      eventSourceRef.current = null
    }
  }, [jobId])

  return { status, progress, files, error }
}
