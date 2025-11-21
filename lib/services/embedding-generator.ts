import { embedMany } from 'ai'
import { openai } from '@ai-sdk/openai'
import { encoding_for_model } from 'tiktoken'

const embeddingModelName = process.env.EMBEDDING_MODEL || 'text-embedding-3-small'
const embeddingModel = openai.embedding(embeddingModelName)

// Limite de tokens do modelo text-embedding-3-small
const MAX_TOKENS = 8192

// Encoder para contagem precisa de tokens
const encoder = encoding_for_model('text-embedding-3-small')

export interface EmbeddingResult {
  embedding: number[]
  content: string
  wasTruncated?: boolean
  originalTokenCount?: number
}

/**
 * Conta tokens usando tiktoken
 */
function countTokens(text: string): number {
  try {
    return encoder.encode(text).length
  } catch (error) {
    console.warn('Erro ao contar tokens com tiktoken:', error)
    // Fallback para estimativa
    return Math.ceil(text.length / 4)
  }
}

/**
 * Trunca texto para ficar dentro do limite de tokens
 */
function truncateToMaxTokens(
  text: string,
  maxTokens: number
): { text: string; wasTruncated: boolean; originalTokenCount: number } {
  const tokenCount = countTokens(text)

  if (tokenCount <= maxTokens) {
    return { text, wasTruncated: false, originalTokenCount: tokenCount }
  }

  // Trunca o texto usando busca binária para encontrar o ponto correto
  let low = 0
  let high = text.length
  let truncatedText = text

  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2)
    const candidate = text.substring(0, mid)
    const candidateTokens = countTokens(candidate)

    if (candidateTokens <= maxTokens) {
      low = mid
      truncatedText = candidate
    } else {
      high = mid - 1
    }
  }

  // Garante que não exceda o limite
  while (countTokens(truncatedText) > maxTokens && truncatedText.length > 0) {
    truncatedText = truncatedText.substring(0, truncatedText.length - 1)
  }

  console.warn(
    `⚠️  Texto truncado: ${tokenCount} tokens → ${countTokens(truncatedText)} tokens ` +
      `(redução de ${((1 - countTokens(truncatedText) / tokenCount) * 100).toFixed(1)}%)`
  )

  return {
    text: truncatedText,
    wasTruncated: true,
    originalTokenCount: tokenCount,
  }
}

/**
 * Gera embeddings para múltiplos textos em batch
 */
export async function generateEmbeddings(
  texts: string[],
  batchSize: number = 64,
  templateId?: string
): Promise<EmbeddingResult[]> {
  const results: EmbeddingResult[] = []
  let truncatedCount = 0

  // Processa em batches
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)

    // Valida e trunca textos que excedem o limite
    const validatedBatch = batch.map((text, idx) => {
      const validation = truncateToMaxTokens(text, MAX_TOKENS)

      if (validation.wasTruncated) {
        truncatedCount++
        const logPrefix = templateId ? `[Template: ${templateId}] ` : ''
        console.warn(
          `${logPrefix}Chunk ${i + idx + 1} truncado: ` +
            `${validation.originalTokenCount} tokens → ${MAX_TOKENS} tokens`
        )
      }

      return validation
    })

    const batchTexts = validatedBatch.map(v => v.text)

    try {
      const { embeddings } = await embedMany({
        model: embeddingModel,
        values: batchTexts,
      })

      validatedBatch.forEach((validation, idx) => {
        results.push({
          embedding: embeddings[idx],
          content: validation.text,
          wasTruncated: validation.wasTruncated,
          originalTokenCount: validation.originalTokenCount,
        })
      })

      // Rate limiting: pequeno delay entre batches
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('rate limit')) {
        // Aguarda mais tempo em caso de rate limit
        await new Promise(resolve => setTimeout(resolve, 10000))
        // Retry o batch
        i -= batchSize
        continue
      }

      // Tratamento específico para erro de limite de tokens
      if (error instanceof Error && error.message.includes('maximum context length')) {
        console.error(`❌ Erro de limite de tokens no batch ${i / batchSize + 1}:`, error.message)
        // Tenta processar um por um para identificar o problema
        for (let j = 0; j < batchTexts.length; j++) {
          try {
            const { embeddings } = await embedMany({
              model: embeddingModel,
              values: [batchTexts[j]],
            })
            results.push({
              embedding: embeddings[0],
              content: validatedBatch[j].text,
              wasTruncated: validatedBatch[j].wasTruncated,
              originalTokenCount: validatedBatch[j].originalTokenCount,
            })
          } catch (singleError) {
            console.error(`❌ Erro ao processar chunk individual ${i + j + 1}:`, singleError)
            // Pula este chunk problemático
          }
        }
        continue
      }

      throw error
    }
  }

  if (truncatedCount > 0) {
    console.warn(`⚠️  Total de ${truncatedCount} chunks foram truncados`)
  }

  return results
}

/**
 * Gera embedding para um único texto
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Valida e trunca se necessário
  const validation = truncateToMaxTokens(text, MAX_TOKENS)

  if (validation.wasTruncated) {
    console.warn(
      `⚠️  Texto truncado ao gerar embedding único: ` +
        `${validation.originalTokenCount} tokens → ${MAX_TOKENS} tokens`
    )
  }

  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: [validation.text],
  })

  return embeddings[0]
}
