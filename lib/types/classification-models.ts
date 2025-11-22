import { openai } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'
import type { LanguageModel } from 'ai'
import { ChatModel } from './chat-models'

/**
 * Enum de modelos para classificação
 * Reutiliza o ChatModel enum existente
 */
export type ClassificationModel = ChatModel

/**
 * Limites de tokens por modelo
 */
export interface ModelTokenLimits {
  maxInputTokens: number
  maxOutputTokens: number
}

/**
 * Preços por modelo (por 1 milhão de tokens)
 * Baseado em preços oficiais (2025):
 * - OpenAI: https://openai.com/api/pricing
 * - Google: https://ai.google.dev/gemini-api/docs/pricing?hl=pt-br
 */
export interface ModelPricing {
  inputPricePerMillion: number // Preço por 1M tokens de entrada (USD)
  outputPricePerMillion: number // Preço por 1M tokens de saída (USD)
}

/**
 * Mapeamento de preços por modelo (USD por 1 milhão de tokens)
 */
const MODEL_PRICING: Record<ChatModel, ModelPricing> = {
  [ChatModel.OPENAI_GPT_4O_MINI]: {
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.60,
  },
  [ChatModel.OPENAI_GPT_4O]: {
    inputPricePerMillion: 2.50,
    outputPricePerMillion: 10.00,
  },
  [ChatModel.GOOGLE_GEMINI_2_0_FLASH]: {
    inputPricePerMillion: 0.075,
    outputPricePerMillion: 0.30,
  },
  [ChatModel.GOOGLE_GEMINI_2_0_FLASH_LITE]: {
    inputPricePerMillion: 0.0375,
    outputPricePerMillion: 0.15,
  },
  [ChatModel.GOOGLE_GEMINI_2_5_FLASH]: {
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.60,
  },
  [ChatModel.GOOGLE_GEMINI_2_5_FLASH_LITE]: {
    inputPricePerMillion: 0.0375,
    outputPricePerMillion: 0.15,
  },
}

/**
 * Mapeamento de limites de tokens por modelo
 */
const MODEL_TOKEN_LIMITS: Record<ChatModel, ModelTokenLimits> = {
  [ChatModel.OPENAI_GPT_4O_MINI]: {
    maxInputTokens: 128000,
    maxOutputTokens: 16384,
  },
  [ChatModel.OPENAI_GPT_4O]: {
    maxInputTokens: 128000,
    maxOutputTokens: 16384,
  },
  [ChatModel.GOOGLE_GEMINI_2_0_FLASH]: {
    maxInputTokens: 1000000, // 1M tokens
    maxOutputTokens: 8192,
  },
  [ChatModel.GOOGLE_GEMINI_2_0_FLASH_LITE]: {
    maxInputTokens: 1000000, // 1M tokens
    maxOutputTokens: 8192,
  },
  [ChatModel.GOOGLE_GEMINI_2_5_FLASH]: {
    maxInputTokens: 1000000, // 1M tokens
    maxOutputTokens: 8192,
  },
  [ChatModel.GOOGLE_GEMINI_2_5_FLASH_LITE]: {
    maxInputTokens: 1000000, // 1M tokens
    maxOutputTokens: 8192,
  },
}

/**
 * Provider de modelo para classificação
 */
export interface ClassificationModelProvider {
  model: LanguageModel
  name: string
  limits: ModelTokenLimits
}

/**
 * Retorna o provider e limites do modelo para classificação
 */
export function getClassificationModelProvider(
  model: ClassificationModel
): ClassificationModelProvider {
  const limits = MODEL_TOKEN_LIMITS[model]

  switch (model) {
    case ChatModel.OPENAI_GPT_4O_MINI:
      return {
        model: openai('gpt-4o-mini'),
        name: 'gpt-4o-mini',
        limits,
      }
    case ChatModel.OPENAI_GPT_4O:
      return {
        model: openai('gpt-4o'),
        name: 'gpt-4o',
        limits,
      }
    case ChatModel.GOOGLE_GEMINI_2_0_FLASH:
      return {
        model: google('gemini-2.0-flash'),
        name: 'gemini-2.0-flash',
        limits,
      }
    case ChatModel.GOOGLE_GEMINI_2_0_FLASH_LITE:
      return {
        model: google('gemini-2.0-flash-lite'),
        name: 'gemini-2.0-flash-lite',
        limits,
      }
    case ChatModel.GOOGLE_GEMINI_2_5_FLASH:
      return {
        model: google('gemini-2.5-flash'),
        name: 'gemini-2.5-flash',
        limits,
      }
    case ChatModel.GOOGLE_GEMINI_2_5_FLASH_LITE:
      return {
        model: google('gemini-2.5-flash-lite'),
        name: 'gemini-2.5-flash-lite',
        limits,
      }
    default:
      // Fallback para o modelo padrão
      return {
        model: openai('gpt-4o-mini'),
        name: 'gpt-4o-mini',
        limits: MODEL_TOKEN_LIMITS[ChatModel.OPENAI_GPT_4O_MINI],
      }
  }
}

/**
 * Retorna os limites de tokens para um modelo
 */
export function getModelTokenLimits(model: ClassificationModel): ModelTokenLimits {
  return MODEL_TOKEN_LIMITS[model] || MODEL_TOKEN_LIMITS[ChatModel.OPENAI_GPT_4O_MINI]
}

/**
 * Retorna os preços para um modelo
 */
export function getModelPricing(model: ClassificationModel): ModelPricing {
  return MODEL_PRICING[model] || MODEL_PRICING[ChatModel.OPENAI_GPT_4O_MINI]
}

/**
 * Calcula o custo total em USD baseado nos tokens usados e no modelo
 * @param inputTokens - Número de tokens de entrada
 * @param outputTokens - Número de tokens de saída
 * @param model - Modelo usado na classificação
 * @returns Custo total em USD
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: ClassificationModel
): number {
  const pricing = getModelPricing(model)
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPricePerMillion
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPricePerMillion
  return inputCost + outputCost
}

/**
 * Converte string de provider para enum
 */
export function parseModelProvider(provider: string): 'openai' | 'google' {
  if (provider === 'openai' || provider === 'google') {
    return provider
  }
  return 'openai' // default
}

/**
 * Converte string de modelo para ClassificationModel
 */
export function parseClassificationModel(modelName: string, provider: 'openai' | 'google'): ClassificationModel {
  if (provider === 'openai') {
    if (modelName.includes('gpt-4o-mini')) {
      return ChatModel.OPENAI_GPT_4O_MINI
    }
    if (modelName.includes('gpt-4o')) {
      return ChatModel.OPENAI_GPT_4O
    }
  } else if (provider === 'google') {
    if (modelName.includes('2.5-flash-lite')) {
      return ChatModel.GOOGLE_GEMINI_2_5_FLASH_LITE
    }
    if (modelName.includes('2.5-flash')) {
      return ChatModel.GOOGLE_GEMINI_2_5_FLASH
    }
    if (modelName.includes('2.0-flash-lite')) {
      return ChatModel.GOOGLE_GEMINI_2_0_FLASH_LITE
    }
    if (modelName.includes('2.0-flash')) {
      return ChatModel.GOOGLE_GEMINI_2_0_FLASH
    }
  }
  
  // Default
  return ChatModel.OPENAI_GPT_4O_MINI
}

