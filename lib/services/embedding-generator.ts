import { embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';

const embeddingModelName = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
const embeddingModel = openai.embedding(embeddingModelName);

export interface EmbeddingResult {
  embedding: number[];
  content: string;
}

/**
 * Gera embeddings para múltiplos textos em batch
 */
export async function generateEmbeddings(
  texts: string[],
  batchSize: number = 64
): Promise<EmbeddingResult[]> {
  const results: EmbeddingResult[] = [];

  // Processa em batches
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    
    try {
      const { embeddings } = await embedMany({
        model: embeddingModel,
        values: batch,
      });

      batch.forEach((text, idx) => {
        results.push({
          embedding: embeddings[idx],
          content: text,
        });
      });

      // Rate limiting: pequeno delay entre batches
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('rate limit')) {
        // Aguarda mais tempo em caso de rate limit
        await new Promise(resolve => setTimeout(resolve, 10000));
        // Retry o batch
        i -= batchSize;
        continue;
      }
      throw error;
    }
  }

  return results;
}

/**
 * Gera embedding para um único texto
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: [text],
  });

  return embeddings[0];
}

