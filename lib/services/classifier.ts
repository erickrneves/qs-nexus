import { generateObject } from 'ai'
import { z } from 'zod'
import { TemplateDocument, TemplateDocumentSchema } from '../types/template-document'
import {
  loadClassificationConfig as loadConfigFromDB,
  type ClassificationConfig,
} from './classification-config'
import { getClassificationModelProvider, parseClassificationModel, parseModelProvider } from '../types/classification-models'
import { estimateTokensForClassificationModel, estimateTokensApproximate } from '../utils/token-estimation'
import { extractContent } from './content-extraction'
import {
  calculateAvailableTokens,
  shouldUseExtraction,
  truncateMarkdown,
} from './content-truncation'
import { buildZodSchemaFromConfig } from './schema-builder'
import { loadTemplateSchemaConfig } from './template-schema-service'

/**
 * Schema de classificação baseado no TemplateDocumentSchema
 */
const ClassificationSchema = z.object({
  docType: TemplateDocumentSchema.shape.docType,
  area: TemplateDocumentSchema.shape.area,
  jurisdiction: z.string(),
  complexity: TemplateDocumentSchema.shape.complexity,
  tags: z.array(z.string()),
  summary: z.string().describe('Resumo de 2-3 linhas otimizado para embedding'),
  qualityScore: z
    .number()
    .min(0)
    .max(100)
    .describe('Nota de qualidade baseada em clareza, estrutura e risco'),
  title: z.string().describe('Título do documento'),
  sections: z.array(
    z.object({
      name: z.string(),
      role: z.enum(['intro', 'fundamentacao', 'pedido', 'fatos', 'direito', 'conclusao', 'outro']),
    })
  ),
})

export interface ClassificationResult {
  docType: TemplateDocument['docType']
  area: TemplateDocument['area']
  jurisdiction: string
  complexity: TemplateDocument['complexity']
  tags: string[]
  summary: string
  qualityScore: number
  title: string
  sections?: Array<{ name: string; role: string }>
}

/**
 * Valida se a classificação retornada está vazia ou inválida
 */
function validateClassification(result: ClassificationResult, markdownPreview: string): void {
  const isEmpty =
    !result.title ||
    result.title.trim() === '' ||
    !result.summary ||
    result.summary.trim() === '' ||
    !result.docType ||
    !result.area ||
    !result.complexity ||
    result.qualityScore === undefined ||
    result.qualityScore === null

  if (isEmpty) {
    const errorDetails = {
      title: result.title || '(vazio)',
      summary: result.summary || '(vazio)',
      docType: result.docType || '(vazio)',
      area: result.area || '(vazio)',
      complexity: result.complexity || '(vazio)',
      qualityScore: result.qualityScore ?? '(vazio)',
      jurisdiction: result.jurisdiction || '(vazio)',
      tags: result.tags || [],
      sections: result.sections || [],
      markdownPreview:
        markdownPreview.substring(0, 500) + (markdownPreview.length > 500 ? '...' : ''),
    }

    console.error('\n❌ ERRO CRÍTICO: Classificação retornou dados vazios!')
    console.error('═══════════════════════════════════════════════════════════')
    console.error('Detalhes da resposta recebida:')
    console.error(JSON.stringify(errorDetails, null, 2))
    console.error('═══════════════════════════════════════════════════════════')
    console.error('\n🛑 PARANDO CLASSIFICAÇÃO PARA DEBUG\n')

    throw new Error(
      `Classificação retornou dados vazios. ` +
        `Title: "${result.title}", Summary: "${result.summary}", ` +
        `DocType: "${result.docType}", Area: "${result.area}", ` +
        `Complexity: "${result.complexity}", QualityScore: ${result.qualityScore}`
    )
  }
}

/**
 * Carrega configuração de classificação
 * Se configId não for fornecido, usa a configuração ativa
 */
export async function loadClassificationConfig(configId?: string): Promise<ClassificationConfig> {
  return await loadConfigFromDB(configId)
}

/**
 * Constrói schema Zod baseado em configuração de schema de template
 * Agora usa schema dinâmico baseado na configuração
 */
export async function buildClassificationSchema(schemaConfigId?: string): Promise<z.ZodSchema> {
  try {
    // Carrega configuração de schema de template
    const schemaConfig = await loadTemplateSchemaConfig(schemaConfigId)
    
    // Constrói schema Zod dinamicamente
    return buildZodSchemaFromConfig(schemaConfig)
  } catch (error) {
    // Fallback para schema fixo se não conseguir carregar schema dinâmico
    console.warn('Erro ao carregar schema dinâmico, usando schema fixo:', error)
    return ClassificationSchema
  }
}

/**
 * Prepara conteúdo markdown para classificação
 * Aplica extração e truncamento conforme necessário
 */
export async function prepareMarkdownContent(
  markdown: string,
  config: ClassificationConfig
): Promise<string> {
  // Estima tokens do documento completo
  const classificationModel = parseClassificationModel(config.modelName, config.modelProvider)
  const fullDocTokens = estimateTokensForClassificationModel(markdown, classificationModel)

  // Calcula tokens disponíveis
  const systemPromptTokens = estimateTokensApproximate(config.systemPrompt)
  const userPromptBase = 'Analise o documento abaixo (formato Markdown) e classifique-o conforme as instruções.\n\n---\n\n'
  const userPromptTokens = estimateTokensApproximate(userPromptBase)
  const availableTokens = calculateAvailableTokens(
    config.maxInputTokens,
    systemPromptTokens,
    userPromptTokens,
    config.maxOutputTokens
  )

  // Decide se usa extração ou truncamento direto
  let processedMarkdown: string

  if (shouldUseExtraction(fullDocTokens, availableTokens)) {
    // Usa extração de conteúdo relevante
    processedMarkdown = extractContent(markdown, {
      customFunctionCode: config.extractionFunctionCode || undefined,
    })
  } else {
    // Usa truncamento direto se necessário
    if (fullDocTokens > availableTokens) {
      processedMarkdown = truncateMarkdown(markdown, availableTokens)
    } else {
      processedMarkdown = markdown
    }
  }

  // Verifica se ainda precisa truncar após extração
  const processedTokens = estimateTokensForClassificationModel(processedMarkdown, classificationModel)
  if (processedTokens > availableTokens) {
    processedMarkdown = truncateMarkdown(processedMarkdown, availableTokens)
  }

  return processedMarkdown
}

/**
 * Classifica um documento jurídico usando IA
 * 
 * @param markdown - Conteúdo do documento em formato Markdown
 * @param configId - ID da configuração de classificação (opcional, usa ativa se não fornecido)
 * @param onProgress - Callback opcional para logar progresso da classificação
 * @returns Resultado da classificação com metadados estruturados
 */
export async function classifyDocument(
  markdown: string,
  configId?: string,
  onProgress?: (message: string) => void
): Promise<ClassificationResult> {
  // Carrega configuração
  const config = await loadConfigFromDB(configId)

  // Prepara conteúdo
  const originalTokens = estimateTokensApproximate(markdown)
  const processedMarkdown = await prepareMarkdownContent(markdown, config)
  const processedTokens = estimateTokensApproximate(processedMarkdown)
  const tokensSaved = originalTokens - processedTokens

  if (tokensSaved > 0) {
    const savingsPercent = Math.round((tokensSaved / originalTokens) * 100)
    onProgress?.(`💰 Economia de tokens: ${tokensSaved.toLocaleString()} (${savingsPercent}%)`)
  }

  // Obtém provider do modelo
  const classificationModel = parseClassificationModel(config.modelName, config.modelProvider)
  const { model } = getClassificationModelProvider(classificationModel)

  // Constrói schema dinâmico baseado no schema config do template
  // Tenta usar o schema do template associado, se disponível
  // Por enquanto, usa schema padrão (será melhorado na Fase 4 com API)
  const classificationSchema = await buildClassificationSchema()

  // Loga início da classificação
  onProgress?.('⏳ Iniciando classificação...')

  try {
    const { object } = await generateObject({
      model,
      schema: classificationSchema,
      messages: [
        {
          role: 'system',
          content: config.systemPrompt,
        },
        {
          role: 'user',
          content: `Analise o documento abaixo (formato Markdown) e classifique-o conforme as instruções.\n\n---\n\n${processedMarkdown}`,
        },
      ],
    })

    // Aplica valores padrão para campos que podem não ter sido retornados
    const result: ClassificationResult = {
      ...object,
      jurisdiction: object.jurisdiction || 'BR',
      tags: object.tags || [],
      sections: object.sections || [],
    }

    // Valida se a classificação não está vazia
    validateClassification(result, processedMarkdown)

    // Loga fim da classificação
    onProgress?.('✅ Classificação concluída')

    return result
  } catch (error) {
    // Retry logic para rate limit
    if (error instanceof Error && error.message.includes('rate limit')) {
      await new Promise(resolve => setTimeout(resolve, 5000))
      return classifyDocument(markdown, configId, onProgress)
    }

    // Fallback para erros de limite de tokens (mesmo após truncamento)
    if (
      error instanceof Error &&
      (error.message.includes('maximum context length') ||
        error.message.includes('token limit') ||
        error.message.includes('context_length_exceeded') ||
        error.message.includes('too many tokens'))
    ) {
      console.warn(`⚠️  Erro de limite de tokens detectado, tentando com versão mais truncada`)

      // Tenta com versão ainda mais truncada (50% do limite original)
      const availableTokens = calculateAvailableTokens(
        config.maxInputTokens,
        estimateTokensApproximate(config.systemPrompt),
        estimateTokensApproximate('Analise o documento abaixo (formato Markdown) e classifique-o conforme as instruções.\n\n---\n\n'),
        config.maxOutputTokens
      )
      const fallbackTokens = Math.floor(availableTokens * 0.5)
      const fallbackMarkdown = truncateMarkdown(processedMarkdown, fallbackTokens)

      try {
        const { object } = await generateObject({
          model,
          schema: classificationSchema,
          messages: [
            {
              role: 'system',
              content: config.systemPrompt,
            },
            {
              role: 'user',
              content: `Analise o documento abaixo (formato Markdown) e classifique-o conforme as instruções.\n\n---\n\n${fallbackMarkdown}`,
            },
          ],
        })

        // Aplica valores padrão para campos que podem não ter sido retornados
        const fallbackResult: ClassificationResult = {
          ...object,
          jurisdiction: object.jurisdiction || 'BR',
          tags: object.tags || [],
          sections: object.sections || [],
        }

        // Valida se a classificação não está vazia
        validateClassification(fallbackResult, fallbackMarkdown)

        // Loga fim da classificação (fallback)
        onProgress?.('✅ Classificação concluída')

        return fallbackResult
      } catch (fallbackError) {
        // Se ainda falhar, propaga o erro original
        throw new Error(`Falha ao classificar documento mesmo após truncamento: ${error.message}`)
      }
    }

    throw error
  }
}

/**
 * Cria um TemplateDocument completo a partir da classificação e markdown
 */
export function createTemplateDocument(
  classification: ClassificationResult,
  markdown: string,
  documentFileId: string
): TemplateDocument {
  return {
    id: documentFileId,
    title: classification.title,
    docType: classification.docType,
    area: classification.area,
    jurisdiction: classification.jurisdiction,
    complexity: classification.complexity,
    tags: classification.tags,
    summary: classification.summary,
    markdown,
    metadata: {
      sections: classification.sections,
    },
    qualityScore: classification.qualityScore,
    isGold: classification.qualityScore > 60,
    isSilver: classification.qualityScore >= 56 && classification.qualityScore <= 60,
  }
}
