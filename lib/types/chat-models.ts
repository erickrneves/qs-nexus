import { openai } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'
import type { LanguageModel } from 'ai'

export enum ChatModel {
  OPENAI_GPT_4O_MINI = 'openai-gpt-4o-mini',
  OPENAI_GPT_4O = 'openai-gpt-4o',
  GOOGLE_GEMINI_2_0_FLASH = 'gemini-2.0-flash',
  GOOGLE_GEMINI_2_0_FLASH_LITE = 'gemini-2.0-flash-lite',
  GOOGLE_GEMINI_2_5_FLASH = 'gemini-2.5-flash',
  GOOGLE_GEMINI_2_5_FLASH_LITE = 'gemini-2.5-flash-lite',
}

export interface ModelProvider {
  model: LanguageModel
  name: string
}

/**
 * Retorna o provider e nome do modelo correto baseado no enum ChatModel
 */
export function getModelProvider(model: ChatModel): ModelProvider {
  switch (model) {
    case ChatModel.OPENAI_GPT_4O_MINI:
      return {
        model: openai('gpt-4o-mini'),
        name: 'gpt-4o-mini',
      }
    case ChatModel.OPENAI_GPT_4O:
      return {
        model: openai('gpt-4o'),
        name: 'gpt-4o',
      }
    case ChatModel.GOOGLE_GEMINI_2_0_FLASH:
      return {
        model: google('gemini-2.0-flash'),
        name: 'gemini-2.0-flash',
      }
    case ChatModel.GOOGLE_GEMINI_2_0_FLASH_LITE:
      return {
        model: google('gemini-2.0-flash-lite'),
        name: 'gemini-2.0-flash-lite',
      }
    case ChatModel.GOOGLE_GEMINI_2_5_FLASH:
      return {
        model: google('gemini-2.5-flash'),
        name: 'gemini-2.5-flash',
      }
    case ChatModel.GOOGLE_GEMINI_2_5_FLASH_LITE:
      return {
        model: google('gemini-2.5-flash-lite'),
        name: 'gemini-2.5-flash-lite',
      }
    default:
      // Fallback para o modelo padrão
      return {
        model: openai('gpt-4o-mini'),
        name: 'gpt-4o-mini',
      }
  }
}

/**
 * Retorna o label amigável para exibição no UI
 */
export function getModelLabel(model: ChatModel): string {
  switch (model) {
    case ChatModel.OPENAI_GPT_4O_MINI:
      return 'OpenAI GPT-4o Mini'
    case ChatModel.OPENAI_GPT_4O:
      return 'OpenAI GPT-4o'
    case ChatModel.GOOGLE_GEMINI_2_0_FLASH:
      return 'Google Gemini 2.0 Flash'
    case ChatModel.GOOGLE_GEMINI_2_0_FLASH_LITE:
      return 'Google Gemini 2.0 Flash Lite'
    case ChatModel.GOOGLE_GEMINI_2_5_FLASH:
      return 'Google Gemini 2.5 Flash'
    case ChatModel.GOOGLE_GEMINI_2_5_FLASH_LITE:
      return 'Google Gemini 2.5 Flash Lite'
    default:
      return 'OpenAI GPT-4o Mini'
  }
}

