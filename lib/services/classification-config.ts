import { db, schema } from '../db'
import { classificationConfigs } from '../db/schema/rag'
import { eq, and } from 'drizzle-orm'
import { validateExtractionFunction } from './content-extraction'
import { parseClassificationModel, parseModelProvider, getModelTokenLimits } from '../types/classification-models'

export interface ClassificationConfig {
  id: string
  name: string
  documentType: 'juridico' | 'contabil' | 'geral'
  systemPrompt: string
  modelProvider: 'openai' | 'google'
  modelName: string
  maxInputTokens: number
  maxOutputTokens: number
  extractionFunctionCode?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Detecta o tipo de documento baseado no conteúdo
 */
export function detectDocumentType(markdown: string): 'juridico' | 'contabil' {
  // SPED files têm marcadores específicos
  if (markdown.includes('|0000|') || markdown.includes('SPED') || markdown.includes('ECD') || markdown.includes('ECF')) {
    return 'contabil'
  }
  
  // Por padrão, assume jurídico
  return 'juridico'
}

/**
 * Carrega configuração de classificação baseada no tipo de documento
 */
export async function loadConfigByDocumentType(
  documentType: 'juridico' | 'contabil' | 'geral'
): Promise<ClassificationConfig> {
  const result = await db
    .select()
    .from(classificationConfigs)
    .where(and(
      eq(classificationConfigs.documentCategory, documentType),
      eq(classificationConfigs.isActive, true)
    ))
    .limit(1)

  if (result.length === 0) {
    // Fallback para configuração geral
    const generalResult = await db
      .select()
      .from(classificationConfigs)
      .where(and(
        eq(classificationConfigs.documentCategory, 'geral'),
        eq(classificationConfigs.isActive, true)
      ))
      .limit(1)

    if (generalResult.length > 0) {
      const config = generalResult[0]
      return {
        id: config.id,
        name: config.name,
        documentType: config.documentCategory as 'juridico' | 'contabil' | 'geral',
        systemPrompt: config.systemPrompt,
        modelProvider: config.modelProvider as 'openai' | 'google',
        modelName: config.modelName,
        maxInputTokens: config.maxInputTokens,
        maxOutputTokens: config.maxOutputTokens,
        extractionFunctionCode: config.extractionFunctionCode,
        isActive: config.isActive ?? false,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      }
    }

    throw new Error(`Nenhuma configuração ativa encontrada para tipo: ${documentType}`)
  }

  const config = result[0]
  return {
    id: config.id,
    name: config.name,
    documentType: config.documentCategory as 'juridico' | 'contabil' | 'geral',
    systemPrompt: config.systemPrompt,
    modelProvider: config.modelProvider as 'openai' | 'google',
    modelName: config.modelName,
    maxInputTokens: config.maxInputTokens,
    maxOutputTokens: config.maxOutputTokens,
    extractionFunctionCode: config.extractionFunctionCode,
    isActive: config.isActive ?? false,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  }
}

/**
 * Carrega configuração de classificação do banco
 * Se configId não for fornecido, retorna a configuração ativa (prioriza jurídico)
 * @deprecated Use loadConfigByDocumentType() para melhor controle de tipo
 */
export async function loadClassificationConfig(configId?: string): Promise<ClassificationConfig> {
  let config

  if (configId) {
    // Carrega configuração específica
    const result = await db
      .select()
      .from(classificationConfigs)
      .where(eq(classificationConfigs.id, configId))
      .limit(1)

    if (result.length === 0) {
      throw new Error(`Configuração de classificação não encontrada: ${configId}`)
    }

    config = result[0]
  } else {
    // Carrega configuração ativa (prioriza jurídico)
    const result = await db
      .select()
      .from(classificationConfigs)
      .where(eq(classificationConfigs.isActive, true))
      .limit(1)

    if (result.length === 0) {
      throw new Error('Nenhuma configuração ativa encontrada. Execute o seed primeiro.')
    }

    config = result[0]
  }

  return {
    id: config.id,
    name: config.name,
    documentType: config.documentCategory as 'juridico' | 'contabil' | 'geral',
    systemPrompt: config.systemPrompt,
    modelProvider: config.modelProvider as 'openai' | 'google',
    modelName: config.modelName,
    maxInputTokens: config.maxInputTokens,
    maxOutputTokens: config.maxOutputTokens,
    extractionFunctionCode: config.extractionFunctionCode,
    isActive: config.isActive ?? false,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  }
}

/**
 * Valida limites de tokens baseado no modelo
 */
export function validateTokenLimits(
  modelProvider: 'openai' | 'google',
  modelName: string,
  maxInputTokens: number,
  maxOutputTokens: number
): { valid: boolean; error?: string } {
  try {
    const model = parseClassificationModel(modelName, modelProvider)
    const limits = getModelTokenLimits(model)

    if (maxInputTokens > limits.maxInputTokens) {
      return {
        valid: false,
        error: `maxInputTokens (${maxInputTokens}) excede o limite do modelo (${limits.maxInputTokens})`,
      }
    }

    if (maxOutputTokens > limits.maxOutputTokens) {
      return {
        valid: false,
        error: `maxOutputTokens (${maxOutputTokens}) excede o limite do modelo (${limits.maxOutputTokens})`,
      }
    }

    if (maxInputTokens <= 0 || maxOutputTokens <= 0) {
      return {
        valid: false,
        error: 'Limites de tokens devem ser maiores que zero',
      }
    }

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Erro ao validar limites de tokens',
    }
  }
}

/**
 * Valida configuração de classificação antes de salvar
 */
export function validateClassificationConfig(config: {
  systemPrompt: string
  modelProvider: 'openai' | 'google'
  modelName: string
  maxInputTokens: number
  maxOutputTokens: number
  extractionFunctionCode?: string | null
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Valida system prompt
  if (!config.systemPrompt || config.systemPrompt.trim() === '') {
    errors.push('System prompt é obrigatório')
  }

  // Valida modelo
  if (!config.modelName || config.modelName.trim() === '') {
    errors.push('Nome do modelo é obrigatório')
  }

  // Valida limites de tokens
  const tokenValidation = validateTokenLimits(
    config.modelProvider,
    config.modelName,
    config.maxInputTokens,
    config.maxOutputTokens
  )
  if (!tokenValidation.valid) {
    errors.push(tokenValidation.error || 'Limites de tokens inválidos')
  }

  // Valida função de extração se fornecida
  if (config.extractionFunctionCode) {
    const functionValidation = validateExtractionFunction(config.extractionFunctionCode)
    if (!functionValidation.valid) {
      errors.push(`Função de extração inválida: ${functionValidation.error}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Cria nova configuração de classificação
 */
export async function createClassificationConfig(data: {
  name: string
  documentType: 'juridico' | 'contabil' | 'geral'
  systemPrompt: string
  modelProvider: 'openai' | 'google'
  modelName: string
  maxInputTokens: number
  maxOutputTokens: number
  extractionFunctionCode?: string | null
  isActive?: boolean
}): Promise<ClassificationConfig> {
  // Valida antes de criar
  const validation = validateClassificationConfig(data)
  if (!validation.valid) {
    throw new Error(`Configuração inválida: ${validation.errors.join(', ')}`)
  }

  // Se esta for marcada como ativa, desativa outras do mesmo tipo
  if (data.isActive) {
    await db
      .update(classificationConfigs)
      .set({ isActive: false })
      .where(and(
        eq(classificationConfigs.documentCategory, data.documentType),
        eq(classificationConfigs.isActive, true)
      ))
  }

  const result = await db
    .insert(classificationConfigs)
    .values({
      name: data.name,
      documentCategory: data.documentType,
      systemPrompt: data.systemPrompt,
      modelProvider: data.modelProvider,
      modelName: data.modelName,
      maxInputTokens: data.maxInputTokens,
      maxOutputTokens: data.maxOutputTokens,
      extractionFunctionCode: data.extractionFunctionCode || null,
      isActive: data.isActive ?? false,
    })
    .returning()

  const config = result[0]

  return {
    id: config.id,
    name: config.name,
    documentType: config.documentCategory as 'juridico' | 'contabil' | 'geral',
    systemPrompt: config.systemPrompt,
    modelProvider: config.modelProvider as 'openai' | 'google',
    modelName: config.modelName,
    maxInputTokens: config.maxInputTokens,
    maxOutputTokens: config.maxOutputTokens,
    extractionFunctionCode: config.extractionFunctionCode,
    isActive: config.isActive ?? false,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  }
}

/**
 * Atualiza configuração de classificação
 */
export async function updateClassificationConfig(
  id: string,
  data: {
    name?: string
    documentType?: 'juridico' | 'contabil' | 'geral'
    systemPrompt?: string
    modelProvider?: 'openai' | 'google'
    modelName?: string
    maxInputTokens?: number
    maxOutputTokens?: number
    extractionFunctionCode?: string | null
    isActive?: boolean
  }
): Promise<ClassificationConfig> {
  // Carrega configuração atual
  const current = await loadClassificationConfig(id)
  const documentType = data.documentType ?? current.documentType

  // Se estiver atualizando para ativa, desativa outras do mesmo tipo
  if (data.isActive === true) {
    await db
      .update(classificationConfigs)
      .set({ isActive: false })
      .where(and(
        eq(classificationConfigs.documentCategory, documentType),
        eq(classificationConfigs.isActive, true)
      ))
  }

  const updatedData = {
    systemPrompt: data.systemPrompt ?? current.systemPrompt,
    modelProvider: data.modelProvider ?? current.modelProvider,
    modelName: data.modelName ?? current.modelName,
    maxInputTokens: data.maxInputTokens ?? current.maxInputTokens,
    maxOutputTokens: data.maxOutputTokens ?? current.maxOutputTokens,
    extractionFunctionCode: data.extractionFunctionCode ?? current.extractionFunctionCode,
  }

  // Valida antes de atualizar
  const validation = validateClassificationConfig(updatedData)
  if (!validation.valid) {
    throw new Error(`Configuração inválida: ${validation.errors.join(', ')}`)
  }

  const result = await db
    .update(classificationConfigs)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(classificationConfigs.id, id))
    .returning()

  if (result.length === 0) {
    throw new Error(`Configuração de classificação não encontrada: ${id}`)
  }

  const config = result[0]

  return {
    id: config.id,
    name: config.name,
    documentType: config.documentCategory as 'juridico' | 'contabil' | 'geral',
    systemPrompt: config.systemPrompt,
    modelProvider: config.modelProvider as 'openai' | 'google',
    modelName: config.modelName,
    maxInputTokens: config.maxInputTokens,
    maxOutputTokens: config.maxOutputTokens,
    extractionFunctionCode: config.extractionFunctionCode,
    isActive: config.isActive ?? false,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  }
}

/**
 * Lista todas as configurações de classificação
 */
export async function listClassificationConfigs(): Promise<ClassificationConfig[]> {
  const results = await db.select().from(classificationConfigs).orderBy(classificationConfigs.createdAt)

  return results.map(config => ({
    id: config.id,
    name: config.name,
    documentType: config.documentCategory as 'juridico' | 'contabil' | 'geral',
    systemPrompt: config.systemPrompt,
    modelProvider: config.modelProvider as 'openai' | 'google',
    modelName: config.modelName,
    maxInputTokens: config.maxInputTokens,
    maxOutputTokens: config.maxOutputTokens,
    extractionFunctionCode: config.extractionFunctionCode,
    isActive: config.isActive ?? false,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  }))
}

/**
 * Deleta configuração de classificação
 */
export async function deleteClassificationConfig(id: string): Promise<void> {
  const result = await db.delete(classificationConfigs).where(eq(classificationConfigs.id, id)).returning()

  if (result.length === 0) {
    throw new Error(`Configuração de classificação não encontrada: ${id}`)
  }
}

