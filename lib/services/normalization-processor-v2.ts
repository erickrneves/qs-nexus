/**
 * Normalization Processor V2
 * 
 * NOVO FLUXO:
 * 1. Extração com progresso em tempo real
 * 2. Salva em DRAFT (rascunho)
 * 3. Usuário revisa
 * 4. Aprova → salva definitivamente
 */

import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema/documents'
import { normalizationTemplates } from '@/lib/db/schema/normalization-templates'
import { normalizedData } from '@/lib/db/schema/normalized-data'
import { eq } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { join } from 'path'
import { readFileSync } from 'fs'
import OpenAI from 'openai'
import {
  isLegalDocument,
  extractArticleChunks,
  extractArticlesInBatches,
  splitIntoChunks,
  calculateHierarchicalConfidence,
  generateLegalDocumentPrompt,
} from './hierarchical-extractor'
import { processArticleBatch } from './hierarchical-extractor-v2'
import { convertDocument } from './document-converter'
import { saveHierarchicalArticles } from './hierarchical-storage'
// NOVO: Extrator 100% programático (sem IA, custo $0)
import { extractProgrammatically, ExtractionRules } from './programmatic-extractor'

interface ExtractionProgress {
  status: 'extracting' | 'analyzing' | 'validating'
  progress: number // 0-100
  message: string
  fieldsExtracted?: number
  totalFields?: number
}

interface ExtractionResult {
  success: boolean
  draftData: Record<string, any>
  confidenceScore: number
  warnings?: string[]
  error?: string
}

// ================================================================
// Funções Auxiliares (devem estar ANTES das funções que as usam)
// ================================================================

/**
 * Calcula score de confiança padrão
 */
function calculateStandardConfidence(
  extractedData: Record<string, any>,
  fieldsSchema: any[]
): number {
  const totalFields = fieldsSchema.length
  const filledFields = Object.values(extractedData).filter(v => 
    v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)
  ).length
  return Math.round((filledFields / totalFields) * 100)
}

/**
 * Extração com prompt padrão
 */
async function extractWithStandardPrompt(
  content: string,
  fieldsSchema: any[],
  openai: OpenAI
): Promise<Record<string, any>> {
  const prompt = `
Analise o documento e extraia os dados conforme o schema abaixo.

DOCUMENTO:
${content.substring(0, 50000)}

SCHEMA:
${JSON.stringify(fieldsSchema, null, 2)}

INSTRUÇÕES:
- Extraia TODOS os dados solicitados
- Seja preciso e completo
- Para arrays, extraia TODOS os itens (não apenas os primeiros)
- Se um campo não for encontrado, use null
- Retorne APENAS um JSON válido
`

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  })

  return JSON.parse(response.choices[0].message.content || '{}')
}

/**
 * Extrai metadados do documento
 */
async function extractMetadataFields(
  content: string,
  fieldsSchema: any[],
  openai: OpenAI
): Promise<Record<string, any>> {
  if (fieldsSchema.length === 0) return {}
  return await extractWithStandardPrompt(content.substring(0, 5000), fieldsSchema, openai)
}

/**
 * Mescla resultados de chunks
 */
function mergeChunkResults(
  chunkResults: Record<string, any>[],
  fieldsSchema: any[]
): Record<string, any> {
  const merged: Record<string, any> = {}
  
  for (const field of fieldsSchema) {
    if (field.type === 'array' || field.type === 'object_array') {
      merged[field.name] = chunkResults
        .flatMap(chunk => chunk[field.name] || [])
        .filter((item, index, self) => 
          index === self.findIndex(t => JSON.stringify(t) === JSON.stringify(item))
        )
    } else {
      merged[field.name] = chunkResults
        .map(chunk => chunk[field.name])
        .find(val => val !== null && val !== undefined) || null
    }
  }
  
  return merged
}

// ================================================================
// Funções Principais Exportadas
// ================================================================

/**
 * Extrai dados do documento e salva em DRAFT
 * Retorna dados para preview ANTES de salvar
 */
export async function extractToDraft(
  documentId: string,
  templateId: string,
  onProgress?: (progress: ExtractionProgress) => void
): Promise<ExtractionResult> {
  try {
    // 1. Buscar documento e template
    onProgress?.({ status: 'extracting', progress: 10, message: 'Carregando documento...' })
    
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1)

    if (!document) throw new Error('Documento não encontrado')

    const [template] = await db
      .select()
      .from(normalizationTemplates)
      .where(eq(normalizationTemplates.id, templateId))
      .limit(1)

    if (!template) throw new Error('Template não encontrado')

    // 2. Converter e ler conteúdo do documento
    onProgress?.({ status: 'extracting', progress: 20, message: 'Convertendo documento...' })
    
    const filePath = join(process.cwd(), 'public', document.filePath)
    console.log(`[EXTRACT] Convertendo arquivo: ${filePath}`)
    
    // Converter documento (PDF, DOCX, etc) para Markdown
    const conversionResult = await convertDocument(filePath)
    console.log(`[EXTRACT] Conversão concluída. Tamanho do markdown: ${conversionResult.markdown.length} chars`)
    const fileContent = conversionResult.markdown
    console.log(`[EXTRACT] Primeiros 200 chars: ${fileContent.substring(0, 200)}`)

    // 3. Atualizar status para 'extracting'
    await db
      .update(documents)
      .set({
        normalizationStatus: 'extracting',
        normalizationProgress: 20,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId))

    // 4. DECISÃO: Usar extração PROGRAMÁTICA ou IA?
    const extractionMethod = template.extractionMethod || 'programmatic'
    console.log(`[EXTRACT] Método de extração: ${extractionMethod}`)
    
    let extractedData: Record<string, any> = {}
    let confidenceScore = 0
    
    // ========================================
    // EXTRAÇÃO 100% PROGRAMÁTICA - SEM IA
    // ========================================
    if (extractionMethod === 'programmatic') {
      console.log('[EXTRACT] 💰 Usando extração PROGRAMÁTICA (custo $0)')
      
      onProgress?.({ 
        status: 'extracting', 
        progress: 30, 
        message: 'Aplicando regras de extração programática...',
        totalFields: Array.isArray(template.fields) ? template.fields.length : 0
      })
      
      // Usar extrator programático
      const result = await extractProgrammatically(
        documentId,
        templateId,
        (progress, message) => {
          onProgress?.({
            status: 'extracting',
            progress,
            message,
          })
        }
      )
      
      if (!result.success) {
        throw new Error(result.error || 'Erro na extração programática')
      }
      
      extractedData = result.data!
      
      // Confiança = 100% (extração programática é determinística)
      confidenceScore = 100
      
      console.log(`[EXTRACT] ✅ Extração programática concluída em ${result.executionTime}ms`)
      console.log(`[EXTRACT] 💰 Custo: $0.00 (sem IA!)`)
      console.log(`[EXTRACT] Artigos extraídos: ${extractedData.artigos?.length || 0}`)
    }
    // ========================================
    // EXTRAÇÃO COM IA (LEGADO)
    // ========================================
    else {
      console.log('[EXTRACT] ⚠️  Usando extração COM IA (custo ~$0.50+)')
      
      onProgress?.({ 
        status: 'extracting', 
        progress: 30, 
        message: 'Analisando documento com IA...',
        totalFields: Array.isArray(template.fields) ? template.fields.length : 0
      })

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })

      // Preparar schema para a IA
      const fieldsSchema = Array.isArray(template.fields) 
        ? template.fields.map((f: any) => ({
            name: f.fieldName,
            type: f.fieldType,
            required: f.isRequired,
            description: f.description,
          }))
        : []

      // NOVO: Detectar se é documento jurídico e usar extração hierárquica
      const isLegal = isLegalDocument(fileContent)
      console.log(`[EXTRACT] Documento jurídico: ${isLegal}, Tamanho: ${fileContent.length}`)
      
      if (isLegal && fileContent.length > 50000) {
        console.log('[EXTRACT] Entrando no fluxo de documento jurídico grande')
        // Documento jurídico grande: usar extração em batches
        onProgress?.({
          status: 'extracting',
          progress: 40,
          message: 'Detectado documento jurídico. Dividindo em artigos...',
        })
        
        console.log('[EXTRACT] Chamando extractArticleChunks...')
        const articleChunks = extractArticleChunks(fileContent)
        console.log(`[EXTRACT] Chunks de artigos extraídos: ${articleChunks.length}`)
        
        if (articleChunks.length > 0) {
          onProgress?.({
            status: 'extracting',
            progress: 50,
            message: `Extraindo ${articleChunks.length} artigos em batches...`,
            totalFields: articleChunks.length,
          })
          
          // NOVA ABORDAGEM V2: OpenAI retorna estrutura, script extrai texto
          // COM GUARDRAILS para evitar custos excessivos
          console.log('[EXTRACT] Usando extrator V2 (estrutura + script local)')
          const artigos = await processArticleBatch(
            articleChunks,
            openai,
            documentId, // GUARDRAIL: passar documentId para controle
            (current, total, message) => {
              const progress = 50 + Math.round((current / total) * 30)
              onProgress?.({
                status: 'extracting',
                progress,
                message,
                fieldsExtracted: current,
                totalFields: total,
              })
            }
          )
          
          extractedData = {
            artigos,
            // Extrair outros campos do template
            // Extrair outros campos (metadados da lei)
            ...await extractMetadataFields(fileContent, fieldsSchema.filter(f => f.name !== 'artigos'), openai)
          }
        } else {
          // Fallback para extração normal
          const prompt = `
Analise o documento e extraia os dados conforme o schema abaixo.

DOCUMENTO:
${fileContent.substring(0, 50000)}

SCHEMA:
${JSON.stringify(fieldsSchema, null, 2)}

INSTRUÇÕES:
- Extraia TODOS os dados solicitados
- Seja preciso e completo
- Para arrays, extraia TODOS os itens (não apenas os primeiros)
- Se um campo não for encontrado, use null
- Retorne APENAS um JSON válido com os dados extraídos

FORMATO DE RESPOSTA (JSON):
{
  "campo1": "valor1",
  "campo2": ["item1", "item2"],
  ...
}
`
          const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.1,
          })
          
          extractedData = JSON.parse(response.choices[0].message.content || '{}')
        }
      } else if (fileContent.length > 50000) {
        // Documento não-jurídico grande: dividir em chunks genéricos
        onProgress?.({
          status: 'extracting',
          progress: 40,
          message: 'Documento grande. Processando em partes...',
        })
        
        const chunks = splitIntoChunks(fileContent, 40000)
        const chunkResults = []
        
        for (let i = 0; i < chunks.length; i++) {
          const progress = 40 + Math.round(((i + 1) / chunks.length) * 40)
          onProgress?.({
            status: 'extracting',
            progress,
            message: `Processando parte ${i + 1} de ${chunks.length}...`,
          })
          
          const chunkData = await extractWithStandardPrompt(chunks[i], fieldsSchema, openai)
          chunkResults.push(chunkData)
        }
        
        // Mesclar resultados dos chunks
        extractedData = mergeChunkResults(chunkResults, fieldsSchema)
      } else {
        // Documento pequeno ou médio: extração direta
        const prompt = `
Analise o documento e extraia os dados conforme o schema abaixo.

DOCUMENTO:
${fileContent.substring(0, 50000)}

SCHEMA:
${JSON.stringify(fieldsSchema, null, 2)}

INSTRUÇÕES:
- Extraia TODOS os dados solicitados
- Seja preciso e completo
- Para arrays, extraia TODOS os itens (não apenas os primeiros)
- Se um campo não for encontrado, use null
- Retorne APENAS um JSON válido com os dados extraídos

FORMATO DE RESPOSTA (JSON):
{
  "campo1": "valor1",
  "campo2": ["item1", "item2"],
  ...
}
`
        const response = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        })
        
        extractedData = JSON.parse(response.choices[0].message.content || '{}')
      }

      // 5. Calcular score de confiança (para extração com IA)
      const totalArticles = extractedData.artigos?.length || 0
      confidenceScore = isLegal && totalArticles > 0
        ? calculateHierarchicalConfidence(extractedData, fieldsSchema.map(f => f.name))
        : calculateStandardConfidence(extractedData, fieldsSchema)
    }
    // Fim do bloco else (extração com IA)

    // 6. Validar e salvar em DRAFT
    onProgress?.({ status: 'validating', progress: 90, message: 'Salvando dados extraídos...' })
    
    // Contar campos preenchidos
    const filledFields = Object.values(extractedData).filter(v => 
      v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)
    ).length
    const totalFields = Array.isArray(template.fields) ? template.fields.length : 0

    // 7. Salvar em DRAFT
    await db
      .update(documents)
      .set({
        normalizationStatus: 'draft',
        normalizationProgress: 100,
        normalizationDraftData: extractedData,
        normalizationConfidenceScore: confidenceScore,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId))

    onProgress?.({ 
      status: 'validating', 
      progress: 100, 
      message: 'Extração concluída! Aguardando revisão...',
      fieldsExtracted: filledFields,
      totalFields
    })

    return {
      success: true,
      draftData: extractedData,
      confidenceScore,
      warnings: confidenceScore < 70 ? ['Confiança baixa - Recomendamos revisar os dados'] : undefined
    }

  } catch (error) {
    console.error('[EXTRACT] ❌ ERRO NA EXTRAÇÃO:', error)
    console.error('[EXTRACT] Stack trace:', error instanceof Error ? error.stack : 'N/A')

    await db
      .update(documents)
      .set({
        normalizationStatus: 'failed',
        normalizationError: error instanceof Error ? error.message : 'Erro desconhecido',
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId))

    return {
      success: false,
      draftData: {},
      confidenceScore: 0,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Aprova os dados em draft e salva definitivamente
 */
export async function approveDraft(
  documentId: string,
  organizationId: string,
  userId: string
): Promise<{ success: boolean; normalizedDataId?: string; error?: string }> {
  try {
    // Buscar documento
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1)

    if (!document) throw new Error('Documento não encontrado')
    if (!document.normalizationDraftData) throw new Error('Nenhum dado em draft')
    if (!document.normalizationTemplateId) throw new Error('Template não definido')

    const draftData = document.normalizationDraftData as Record<string, any>

    // Salvar em normalized_data (JSONB)
    const [normalizedRecord] = await db
      .insert(normalizedData)
      .values({
        organizationId,
        documentId,
        templateId: document.normalizationTemplateId,
        data: draftData,
        createdBy: userId,
      })
      .returning()

    // Se documento jurídico com artigos, salvar também na tabela relacional
    if (draftData.artigos && Array.isArray(draftData.artigos) && draftData.artigos.length > 0) {
      console.log(`[APPROVE] Salvando ${draftData.artigos.length} artigos na tabela relacional...`)
      
      try {
        await saveHierarchicalArticles(
          normalizedRecord.id,
          draftData.artigos,
          organizationId,
          userId
        )
        console.log('[APPROVE] Artigos salvos com sucesso!')
      } catch (storageError) {
        console.error('[APPROVE] Erro ao salvar artigos na tabela relacional:', storageError)
        // Não falhar se o JSONB foi salvo com sucesso
      }
    }

    // Atualizar documento
    await db
      .update(documents)
      .set({
        normalizationStatus: 'completed',
        normalizationCompletedAt: new Date(),
        customTableRecordId: normalizedRecord.id,
        normalizationDraftData: null, // Limpar draft
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId))

    // Atualizar estatísticas do template
    await db
      .update(normalizationTemplates)
      .set({
        documentsProcessed: sql`${normalizationTemplates.documentsProcessed} + 1`,
        lastUsedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(normalizationTemplates.id, document.normalizationTemplateId))

    return {
      success: true,
      normalizedDataId: normalizedRecord.id,
    }
  } catch (error) {
    console.error('Erro ao aprovar draft:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Rejeita o draft e permite reprocessar
 */
export async function rejectDraft(documentId: string): Promise<void> {
  await db
    .update(documents)
    .set({
      normalizationStatus: 'pending',
      normalizationProgress: 0,
      normalizationDraftData: null,
      normalizationConfidenceScore: null,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, documentId))
}
