/**
 * AI GUARDRAILS - Proteção contra custos excessivos
 * 
 * OBJETIVO: Prevenir loops infinitos e custos altos com OpenAI
 */

import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

// LIMITES RÍGIDOS - PROTEÇÃO CONTRA CUSTOS ALTOS
export const GUARDRAILS = {
  // MODO DE TESTE: Processar apenas os primeiros N artigos
  // Altere para null para processar todos (após validar que está funcionando)
  TEST_MODE_MAX_ARTICLES: 5, // 🚨 APENAS 5 ARTIGOS DURANTE TESTES!
  
  // Máximo de artigos por documento
  MAX_ARTICLES_PER_DOCUMENT: 100,
  
  // Máximo de chamadas OpenAI por documento
  MAX_API_CALLS_PER_DOCUMENT: 20,
  
  // Máximo de chamadas OpenAI por hora (global)
  MAX_API_CALLS_PER_HOUR: 30, // Reduzido para 30/hora
  
  // Máximo de tokens por request
  MAX_TOKENS_PER_REQUEST: 10000,
  
  // Timeout por API call (ms)
  API_CALL_TIMEOUT: 30000, // 30 segundos
  
  // Custo estimado máximo por documento (USD)
  MAX_COST_PER_DOCUMENT: 0.20, // Reduzido para $0.20
}

// Contador global de API calls
const apiCallCounter = new Map<string, { count: number; timestamp: number }>()

/**
 * Verificar se pode fazer chamada OpenAI
 */
export async function canMakeApiCall(documentId: string): Promise<{
  allowed: boolean
  reason?: string
  estimatedCost?: number
}> {
  const now = Date.now()
  const hourAgo = now - 60 * 60 * 1000

  // Verificar contador do documento
  const docCounter = apiCallCounter.get(documentId)
  if (docCounter) {
    if (docCounter.count >= GUARDRAILS.MAX_API_CALLS_PER_DOCUMENT) {
      return {
        allowed: false,
        reason: `Limite de ${GUARDRAILS.MAX_API_CALLS_PER_DOCUMENT} chamadas por documento atingido`,
      }
    }
  }

  // Verificar contador global (última hora)
  let totalCallsLastHour = 0
  for (const [key, value] of apiCallCounter.entries()) {
    if (value.timestamp > hourAgo) {
      totalCallsLastHour += value.count
    } else {
      // Limpar entradas antigas
      apiCallCounter.delete(key)
    }
  }

  if (totalCallsLastHour >= GUARDRAILS.MAX_API_CALLS_PER_HOUR) {
    return {
      allowed: false,
      reason: `Limite global de ${GUARDRAILS.MAX_API_CALLS_PER_HOUR} chamadas/hora atingido`,
    }
  }

  return { allowed: true }
}

/**
 * Registrar chamada OpenAI
 */
export function recordApiCall(documentId: string, tokensUsed?: number) {
  const now = Date.now()
  const existing = apiCallCounter.get(documentId)

  if (existing) {
    existing.count++
    existing.timestamp = now
  } else {
    apiCallCounter.set(documentId, { count: 1, timestamp: now })
  }

  console.log(`[GUARDRAIL] API call registrada para ${documentId}. Total: ${existing ? existing.count : 1}`)
}

/**
 * Calcular custo estimado
 * GPT-4 Turbo: $0.01/1K input tokens, $0.03/1K output tokens
 */
export function estimateCost(inputTokens: number, outputTokens: number = 500): number {
  const inputCost = (inputTokens / 1000) * 0.01
  const outputCost = (outputTokens / 1000) * 0.03
  return inputCost + outputCost
}

/**
 * Validar número de artigos
 */
export function validateArticleCount(count: number): {
  valid: boolean
  reason?: string
  warning?: string
} {
  if (count === 0) {
    return {
      valid: false,
      reason: 'Nenhum artigo encontrado no documento',
    }
  }

  if (count > GUARDRAILS.MAX_ARTICLES_PER_DOCUMENT) {
    return {
      valid: false,
      reason: `Documento com ${count} artigos excede o limite de ${GUARDRAILS.MAX_ARTICLES_PER_DOCUMENT}`,
    }
  }

  if (count > 50) {
    return {
      valid: true,
      warning: `Documento grande (${count} artigos). Processamento pode demorar ~${Math.ceil(count / 10)} minutos`,
    }
  }

  return { valid: true }
}

/**
 * Criar timeout para API call
 */
export function createApiTimeout(timeoutMs: number = GUARDRAILS.API_CALL_TIMEOUT): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`API call timeout após ${timeoutMs / 1000} segundos`))
    }, timeoutMs)
  })
}

/**
 * Wrapper seguro para chamada OpenAI
 */
export async function safeApiCall<T>(
  documentId: string,
  apiCallFn: () => Promise<T>,
  estimatedInputTokens: number
): Promise<T> {
  // 1. Verificar se pode fazer chamada
  const canCall = await canMakeApiCall(documentId)
  if (!canCall.allowed) {
    throw new Error(`[GUARDRAIL] ${canCall.reason}`)
  }

  // 2. Estimar custo
  const estimatedCost = estimateCost(estimatedInputTokens)
  console.log(`[GUARDRAIL] Custo estimado: $${estimatedCost.toFixed(4)}`)

  // 3. Fazer chamada com timeout
  try {
    const result = await Promise.race([
      apiCallFn(),
      createApiTimeout(),
    ])

    // 4. Registrar sucesso
    recordApiCall(documentId, estimatedInputTokens)

    return result as T
  } catch (error) {
    console.error('[GUARDRAIL] Erro na API call:', error)
    throw error
  }
}

/**
 * Obter estatísticas de uso
 */
export function getUsageStats(): {
  totalCalls: number
  callsByDocument: Record<string, number>
  estimatedTotalCost: number
} {
  let totalCalls = 0
  const callsByDocument: Record<string, number> = {}

  for (const [docId, data] of apiCallCounter.entries()) {
    totalCalls += data.count
    callsByDocument[docId] = data.count
  }

  // Estimar custo total (assumindo média de 5000 tokens input, 500 output por call)
  const estimatedTotalCost = totalCalls * estimateCost(5000, 500)

  return {
    totalCalls,
    callsByDocument,
    estimatedTotalCost,
  }
}

/**
 * Resetar contador (usar com cuidado!)
 */
export function resetCounter(documentId?: string) {
  if (documentId) {
    apiCallCounter.delete(documentId)
    console.log(`[GUARDRAIL] Contador resetado para ${documentId}`)
  } else {
    apiCallCounter.clear()
    console.log('[GUARDRAIL] Todos os contadores resetados')
  }
}

