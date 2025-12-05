/**
 * Normalization Processor
 * 
 * Processador de NORMALIZAÇÃO (estrutural, SEM IA)
 * Responsável por:
 * - Validar arquivo
 * - Salvar na tabela customizada (sem dados extraídos ainda)
 * - Atualizar status de normalização
 */

import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema/documents'
import { normalizationTemplates } from '@/lib/db/schema/normalization-templates'
import { normalizedData } from '@/lib/db/schema/normalized-data'
import { eq } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

interface NormalizationResult {
  success: boolean
  documentId: string
  customTableRecordId?: string
  error?: string
}

/**
 * Processa a normalização de um documento
 * FASE ESTRUTURAL - sem IA
 */
export async function processDocumentNormalization(
  documentId: string,
  organizationId: string
): Promise<NormalizationResult> {
  try {
    // Buscar documento
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1)

    if (!document) {
      throw new Error('Documento não encontrado')
    }

    // Verificar se tem template
    if (!document.normalizationTemplateId) {
      throw new Error('Documento não tem template de normalização')
    }

    // Buscar template
    const [template] = await db
      .select()
      .from(normalizationTemplates)
      .where(eq(normalizationTemplates.id, document.normalizationTemplateId))
      .limit(1)

    if (!template) {
      throw new Error('Template não encontrado')
    }

    // Atualizar status para 'validating'
    await db
      .update(documents)
      .set({
        normalizationStatus: 'validating',
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId))

    // Com JSONB, não precisamos validar tabela física!
    // A tabela normalized_data já existe e serve para todos os templates

    // Atualizar status para 'saving'
    await db
      .update(documents)
      .set({
        normalizationStatus: 'saving',
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId))

    // Criar registro vazio na tabela JSONB
    // (os dados serão preenchidos na etapa de CLASSIFICAÇÃO com IA)
    const [normalizedRecord] = await db
      .insert(normalizedData)
      .values({
        organizationId,
        documentId,
        templateId: template.id,
        data: {}, // Vazio por enquanto - será preenchido na classificação
        createdBy: document.uploadedBy,
      })
      .returning()

    const customRecordId = normalizedRecord.id

    // Atualizar documento com sucesso
    await db
      .update(documents)
      .set({
        normalizationStatus: 'completed',
        normalizationCompletedAt: new Date(),
        customTableRecordId: customRecordId,
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
      .where(eq(normalizationTemplates.id, template.id))

    return {
      success: true,
      documentId,
      customTableRecordId: customRecordId,
    }
  } catch (error) {
    console.error('Erro na normalização:', error)

    // Atualizar documento com erro
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
      documentId,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Processa normalização de documento com template criado por IA
 * INCLUI extração de dados com IA
 */
export async function processDocumentWithAiTemplate(
  documentId: string,
  organizationId: string,
  userId: string,
  templateData: any,
  saveAsReusable: boolean,
  applyToDocument: boolean = true
): Promise<{
  success: boolean
  templateId?: string
  documentId: string
  normalizedDataId?: string
  error?: string
}> {
  try {
    // Buscar documento
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1)

    if (!document) {
      throw new Error('Documento não encontrado')
    }

    let templateId: string | null = null

    // Se deve salvar como reutilizável, criar template permanente
    if (saveAsReusable) {
      console.log('💾 Salvando template como reutilizável...')
      
      // Converter campos para formato do banco
      const fields = templateData.fields.map((f: any) => ({
        fieldName: f.name,
        displayName: f.label,
        fieldType: f.type === 'number' ? 'numeric' : f.type,
        isRequired: f.required || false,
        description: f.description || '',
        validationRules: f.validation,
      }))

      const [newTemplate] = await db
        .insert(normalizationTemplates)
        .values({
          organizationId,
          name: templateData.name || templateData.suggestedName,
          description: templateData.description || templateData.suggestedDescription,
          baseType: 'document',
          tableName: `ai_${templateData.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          fields,
          sqlTableCreated: false, // Não precisamos criar tabela SQL com JSONB
          isActive: true,
          createdBy: userId,
          createdByMethod: 'ai',
          aiPrompt: templateData.userDescription || null,
        })
        .returning()

      templateId = newTemplate.id
      console.log(`✅ Template criado: ${templateId}`)
    }

    if (applyToDocument) {
      console.log('📄 Aplicando template ao documento...')

      // Atualizar documento com template (temporário ou permanente)
      await db
        .update(documents)
        .set({
          normalizationTemplateId: templateId,
          normalizationStatus: 'validating',
          updatedAt: new Date(),
        })
        .where(eq(documents.id, documentId))

      // Atualizar status para 'saving'
      await db
        .update(documents)
        .set({
          normalizationStatus: 'saving',
          updatedAt: new Date(),
        })
        .where(eq(documents.id, documentId))

      // Salvar dados extraídos em normalized_data
      const [normalizedRecord] = await db
        .insert(normalizedData)
        .values({
          organizationId,
          documentId,
          templateId: templateId!,
          data: templateData.previewData || {},
          createdBy: userId,
        })
        .returning()

      const normalizedDataId = normalizedRecord.id

      // Marcar normalização como completa
      await db
        .update(documents)
        .set({
          normalizationStatus: 'completed',
          normalizationCompletedAt: new Date(),
          customTableRecordId: normalizedDataId,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, documentId))

      console.log(`✅ Dados salvos em normalized_data: ${normalizedDataId}`)

      return {
        success: true,
        templateId: templateId || undefined,
        documentId,
        normalizedDataId,
      }
    }

    return {
      success: true,
      templateId: templateId || undefined,
      documentId,
    }
  } catch (error) {
    console.error('Erro ao processar com template IA:', error)

    // Atualizar documento com erro
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
      documentId,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

/**
 * Verifica se um documento está pronto para normalização
 */
export function isReadyForNormalization(document: any): boolean {
  return (
    document.normalizationTemplateId !== null &&
    document.normalizationStatus === 'pending'
  )
}

/**
 * Verifica se normalização foi concluída
 */
export function isNormalizationCompleted(document: any): boolean {
  return document.normalizationStatus === 'completed'
}

