import { NextRequest } from 'next/server'
import { processingEvents } from '@/lib/services/processing-events'

export async function GET(request: NextRequest, { params }: { params: { jobId: string } }) {
  const jobId = params.jobId

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      const sendEvent = (type: string, data: any) => {
        const event = `data: ${JSON.stringify({ type, data })}\n\n`
        try {
          controller.enqueue(encoder.encode(event))
        } catch (error) {
          console.error('Error sending SSE event:', error)
        }
      }

      // Listener para eventos de processamento
      const listener = (event: any) => {
        if (event.type === 'progress') {
          sendEvent('progress', event.data)
        } else if (event.type === 'job-complete') {
          sendEvent('job-complete', event.data)
          // Fecha o stream após conclusão
          setTimeout(() => {
            processingEvents.off(jobId, listener)
            controller.close()
          }, 1000)
        } else if (event.type === 'job-error') {
          sendEvent('job-error', event.data)
          // Fecha o stream após erro
          setTimeout(() => {
            processingEvents.off(jobId, listener)
            controller.close()
          }, 1000)
        }
      }

      // Registra listener
      processingEvents.on(jobId, listener)

      // Envia evento inicial
      sendEvent('progress', {
        message: 'Processamento iniciado',
        jobId,
      })

      // Cleanup quando o cliente desconectar
      request.signal.addEventListener('abort', () => {
        processingEvents.off(jobId, listener)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
