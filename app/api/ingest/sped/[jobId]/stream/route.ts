import { NextRequest } from 'next/server'
import { spedProcessingEvents } from '@/lib/services/sped-processing-events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const jobId = params.jobId

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let isClosed = false

      const sendEvent = (type: string, data: any) => {
        if (isClosed) return
        const event = `data: ${JSON.stringify({ type, data })}\n\n`
        try {
          controller.enqueue(encoder.encode(event))
        } catch (error) {
          console.error(`[SPED SSE] Erro ao enviar evento:`, error)
        }
      }

      const closeStream = () => {
        if (isClosed) return
        isClosed = true
        try {
          spedProcessingEvents.off(jobId, listener)
          controller.close()
          console.log(`[SPED SSE] Stream fechado para job ${jobId}`)
        } catch (error) {
          console.error(`[SPED SSE] Erro ao fechar stream:`, error)
        }
      }

      // Listener para eventos de processamento
      const listener = (event: any) => {
        if (isClosed) return
        
        console.log(`[SPED SSE] Evento recebido para job ${jobId}:`, event.type, event.data.progress + '%')
        
        if (event.type === 'progress') {
          sendEvent('progress', event.data)
        } else if (event.type === 'job-complete') {
          sendEvent('job-complete', event.data)
          // Fecha o stream após conclusão
          setTimeout(() => closeStream(), 1000)
        } else if (event.type === 'job-error') {
          sendEvent('job-error', event.data)
          // Fecha o stream após erro
          setTimeout(() => closeStream(), 1000)
        }
      }

      console.log(`[SPED SSE] Stream criado para job ${jobId}`)
      
      // Obtém histórico de eventos antes de registrar o listener
      const history = spedProcessingEvents.getHistory(jobId)
      console.log(`[SPED SSE] Encontrados ${history.length} eventos no histórico`)
      
      // Envia eventos históricos
      let hasJobComplete = false
      if (history.length > 0) {
        console.log(`[SPED SSE] Reprocessando ${history.length} eventos históricos`)
        history.forEach(event => {
          if (event.type === 'progress') {
            sendEvent('progress', event.data)
          } else if (event.type === 'job-complete') {
            sendEvent('job-complete', event.data)
            hasJobComplete = true
          } else if (event.type === 'job-error') {
            sendEvent('job-error', event.data)
            hasJobComplete = true
          }
        })
        
        // Se já está completo, fecha o stream
        if (hasJobComplete) {
          setTimeout(() => closeStream(), 1000)
        }
      }
      
      // Registra listener para novos eventos (não replay histórico)
      if (!hasJobComplete) {
        spedProcessingEvents.on(jobId, listener)
        console.log(`[SPED SSE] Listener registrado para job ${jobId}`)
      }

      // Cleanup quando o cliente fechar a conexão
      request.signal.addEventListener('abort', () => {
        console.log(`[SPED SSE] Cliente desconectou do job ${jobId}`)
        closeStream()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Desabilita buffering do nginx
    },
  })
}

