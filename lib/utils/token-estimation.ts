import { encoding_for_model, type Tiktoken } from 'tiktoken'
import { ClassificationModel, parseClassificationModel, parseModelProvider } from '../types/classification-models'

/**
 * Mapeamento de modelos para encodings do tiktoken
 * Fallback para cl100k_base (usado por GPT-4) se não encontrar
 */
function getEncodingForModel(model: string, provider: 'openai' | 'google'): Tiktoken {
  try {
    // Para modelos OpenAI, tiktoken tem suporte nativo
    if (provider === 'openai') {
      // Tenta usar o encoding específico do modelo
      if (model.includes('gpt-4o')) {
        return encoding_for_model('gpt-4o')
      }
      if (model.includes('gpt-4')) {
        return encoding_for_model('gpt-4')
      }
      // Fallback para cl100k_base (usado por GPT-3.5 e GPT-4)
      return encoding_for_model('gpt-3.5-turbo')
    }

    // Para modelos Google/Gemini, não há suporte direto no tiktoken
    // Usa cl100k_base como aproximação (similar ao GPT-4)
    return encoding_for_model('gpt-4')
  } catch (error) {
    console.warn(`Erro ao obter encoding para modelo ${model}, usando cl100k_base:`, error)
    // Fallback seguro
    return encoding_for_model('gpt-4')
  }
}

/**
 * Estima tokens usando tiktoken (preciso)
 * Fallback para aproximação se tiktoken falhar
 */
export function estimateTokensWithTiktoken(text: string, model: string, provider: 'openai' | 'google'): number {
  try {
    const encoding = getEncodingForModel(model, provider)
    const tokens = encoding.encode(text)
    const count = tokens.length
    encoding.free() // Libera memória
    return count
  } catch (error) {
    console.warn(`Erro ao estimar tokens com tiktoken para ${model}, usando aproximação:`, error)
    // Fallback para aproximação (1 token ≈ 4 caracteres para português)
    return Math.ceil(text.length / 4)
  }
}

/**
 * Estima tokens usando ClassificationModel
 */
export function estimateTokensForClassificationModel(text: string, model: ClassificationModel): number {
  // Extrai provider e nome do modelo do enum
  const isOpenAI = model.includes('openai')
  const isGoogle = model.includes('gemini')
  
  let provider: 'openai' | 'google' = 'openai'
  let modelName = 'gpt-4o-mini'
  
  if (isOpenAI) {
    provider = 'openai'
    if (model.includes('gpt-4o-mini')) {
      modelName = 'gpt-4o-mini'
    } else if (model.includes('gpt-4o')) {
      modelName = 'gpt-4o'
    }
  } else if (isGoogle) {
    provider = 'google'
    if (model.includes('2.5-flash-lite')) {
      modelName = 'gemini-2.5-flash-lite'
    } else if (model.includes('2.5-flash')) {
      modelName = 'gemini-2.5-flash'
    } else if (model.includes('2.0-flash-lite')) {
      modelName = 'gemini-2.0-flash-lite'
    } else if (model.includes('2.0-flash')) {
      modelName = 'gemini-2.0-flash'
    }
  }
  
  return estimateTokensWithTiktoken(text, modelName, provider)
}

/**
 * Estima tokens usando aproximação (fallback)
 * Útil quando tiktoken não está disponível ou falha
 */
export function estimateTokensApproximate(text: string): number {
  // Aproximação: 1 token ≈ 4 caracteres para português
  return Math.ceil(text.length / 4)
}

