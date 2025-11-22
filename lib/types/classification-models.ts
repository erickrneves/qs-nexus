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

