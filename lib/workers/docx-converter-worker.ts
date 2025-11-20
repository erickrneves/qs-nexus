import { parentPort } from 'node:worker_threads'
import * as mammoth from 'mammoth'
import { readFileSync } from 'node:fs'

export interface ConversionResult {
  markdown: string
  wordCount: number
}

/**
 * Worker thread para conversão DOCX → Markdown
 * Isola o processamento CPU-bound para não bloquear o event loop principal
 */
if (!parentPort) {
  throw new Error('Worker must be run as a worker thread')
}

// Garante que parentPort não é null após verificação
const port = parentPort

port.on('message', async (data: { filePath: string; taskId: string }) => {
  try {
    const { filePath, taskId } = data
    const DEBUG = process.env.DEBUG === 'true'

    if (DEBUG)
      console.error(`[WORKER-THREAD] Recebido: ${filePath.substring(filePath.length - 50)}`)

    // Lê e converte o arquivo DOCX
    const buffer = readFileSync(filePath)
    const result = await (mammoth as any).convertToMarkdown({ buffer })

    const markdown = result.value.trim()
    const wordCount = markdown.split(/\s+/).filter((word: string) => word.length > 0).length

    // Envia resultado de volta para o thread principal
    port.postMessage({
      taskId,
      success: true,
      result: {
        markdown,
        wordCount,
      },
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`[WORKER-THREAD] ERRO: ${errorMsg} - ${data.filePath}`)
    if (process.env.DEBUG === 'true' && error instanceof Error) {
      console.error(`[WORKER-THREAD] Stack: ${error.stack}`)
    }

    // Envia erro de volta
    port.postMessage({
      taskId: data.taskId,
      success: false,
      error: errorMsg,
    })
  }
})
