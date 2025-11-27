import { Worker, Job } from 'bullmq'
import { redisConnection, EmbeddingJobData } from '../config'
import OpenAI from 'openai'
import { db } from '@/lib/db'
import { templateChunks } from '@/lib/db/schema/rag'
import { eq } from 'drizzle-orm'

/**
 * Worker para geração assíncrona de embeddings
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const embeddingWorker = new Worker<EmbeddingJobData>(
  'embedding-generation',
  async (job: Job<EmbeddingJobData>) => {
    const { documentId, chunks, organizationId } = job.data

    console.log(`[EmbeddingWorker] Gerando embeddings para documento ${documentId} (${chunks.length} chunks)`)

    try {
      const totalChunks = chunks.length
      let processedChunks = 0

      // Processar em batches de 100 (limite da API OpenAI)
      const batchSize = 100
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize)

        // Gerar embeddings do batch
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: batch.map((chunk) => chunk.content),
          dimensions: 1536,
        })

        // Atualizar chunks com embeddings
        for (let j = 0; j < batch.length; j++) {
          const chunk = batch[j]
          const embedding = response.data[j].embedding

          await db
            .update(templateChunks)
            .set({ embedding })
            .where(eq(templateChunks.id, chunk.id))
        }

        processedChunks += batch.length
        const progress = Math.round((processedChunks / totalChunks) * 100)
        job.updateProgress(progress)

        console.log(
          `[EmbeddingWorker] ${documentId}: ${processedChunks}/${totalChunks} chunks processados`
        )

        // Rate limiting: aguardar 1s entre batches
        if (i + batchSize < chunks.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }

      console.log(`[EmbeddingWorker] Embeddings gerados para documento ${documentId}`)

      return {
        success: true,
        documentId,
        totalChunks,
        processedChunks,
      }
    } catch (error) {
      console.error(`[EmbeddingWorker] Erro ao gerar embeddings para ${documentId}:`, error)
      throw error
    }
  },
  {
    connection: redisConnection,
    concurrency: 2, // Processa 2 documentos simultâneos (rate limit da OpenAI)
  }
)

// Event listeners
embeddingWorker.on('completed', (job) => {
  console.log(`[EmbeddingWorker] Job ${job.id} completado`)
})

embeddingWorker.on('failed', (job, err) => {
  console.error(`[EmbeddingWorker] Job ${job?.id} falhou:`, err)
})

export default embeddingWorker

