import { db } from '../db'
import { templates, templateSchemaConfigs } from '../db/schema/rag'
import { eq, and, or, sql, SQL } from 'drizzle-orm'
import { DynamicTemplateDocument } from '../types/template-schema'

/**
 * Filtros para buscar templates com campos dinâmicos
 */
export interface TemplateFilters {
  area?: string
  docType?: string
  complexity?: string
  jurisdiction?: string
  tags?: string[]
  onlyGold?: boolean
  onlySilver?: boolean
  minQualityScore?: number
  maxQualityScore?: number
  // Permite filtros customizados em campos JSONB
  customFilters?: Record<string, any>
}

/**
 * Busca templates com filtros baseados em campos JSONB
 * 
 * @param filters - Filtros para aplicar
 * @param limit - Limite de resultados
 * @param offset - Offset para paginação
 * @returns Lista de templates com metadata JSONB
 */
export async function findTemplatesWithFilters(
  filters: TemplateFilters = {},
  limit: number = 100,
  offset: number = 0
) {
  const conditions: SQL[] = []

  // Filtros para campos migrados para JSONB
  if (filters.area) {
    conditions.push(sql`${templates.metadata}->>'area' = ${filters.area}`)
  }

  if (filters.docType) {
    conditions.push(sql`${templates.metadata}->>'docType' = ${filters.docType}`)
  }

  if (filters.complexity) {
    conditions.push(sql`${templates.metadata}->>'complexity' = ${filters.complexity}`)
  }

  if (filters.jurisdiction) {
    conditions.push(sql`${templates.metadata}->>'jurisdiction' = ${filters.jurisdiction}`)
  }

  if (filters.tags && filters.tags.length > 0) {
    // Para arrays JSONB, usa @> (contains)
    conditions.push(sql`${templates.metadata}->'tags' @> ${JSON.stringify(filters.tags)}::jsonb`)
  }

  if (filters.onlyGold) {
    conditions.push(sql`${templates.metadata}->>'isGold' = 'true'`)
  }

  if (filters.onlySilver) {
    conditions.push(sql`${templates.metadata}->>'isSilver' = 'true'`)
  }

  if (filters.minQualityScore !== undefined) {
    conditions.push(sql`CAST(${templates.metadata}->>'qualityScore' AS NUMERIC) >= ${filters.minQualityScore}`)
  }

  if (filters.maxQualityScore !== undefined) {
    conditions.push(sql`CAST(${templates.metadata}->>'qualityScore' AS NUMERIC) <= ${filters.maxQualityScore}`)
  }

  // Filtros customizados em campos JSONB
  if (filters.customFilters) {
    for (const [key, value] of Object.entries(filters.customFilters)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // Para arrays, usa contains
          conditions.push(sql`${templates.metadata}->${key} @> ${JSON.stringify(value)}::jsonb`)
        } else if (typeof value === 'object') {
          // Para objetos, usa contains
          conditions.push(sql`${templates.metadata}->${key} @> ${JSON.stringify(value)}::jsonb`)
        } else {
          // Para valores primitivos
          conditions.push(sql`${templates.metadata}->>${key} = ${String(value)}`)
        }
      }
    }
  }

  let query = db.select().from(templates)

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any
  }

  const results = await query.limit(limit).offset(offset)

  return results.map(template => ({
    ...template,
    metadata: template.metadata as DynamicTemplateDocument,
  }))
}

/**
 * Busca um template por ID com metadata JSONB
 */
export async function findTemplateById(templateId: string) {
  const result = await db
    .select()
    .from(templates)
    .where(eq(templates.id, templateId))
    .limit(1)

  if (result.length === 0) {
    return null
  }

  return {
    ...result[0],
    metadata: result[0].metadata as DynamicTemplateDocument,
  }
}

/**
 * Busca templates por documentFileId
 */
export async function findTemplatesByDocumentFileId(documentFileId: string) {
  const results = await db
    .select()
    .from(templates)
    .where(eq(templates.documentFileId, documentFileId))

  return results.map(template => ({
    ...template,
    metadata: template.metadata as DynamicTemplateDocument,
  }))
}

/**
 * Busca templates por schema config ID
 */
export async function findTemplatesBySchemaConfigId(schemaConfigId: string, limit: number = 100) {
  const results = await db
    .select()
    .from(templates)
    .where(eq(templates.schemaConfigId, schemaConfigId))
    .limit(limit)

  return results.map(template => ({
    ...template,
    metadata: template.metadata as DynamicTemplateDocument,
  }))
}

/**
 * Extrai valor de campo específico do metadata JSONB
 * 
 * @param templateId - ID do template
 * @param fieldPath - Caminho do campo (ex: 'area', 'docType', 'tags', 'sections.0.name')
 * @returns Valor do campo ou null se não encontrado
 */
export async function getTemplateFieldValue(templateId: string, fieldPath: string): Promise<any> {
  const template = await findTemplateById(templateId)
  if (!template || !template.metadata) {
    return null
  }

  // Suporta caminhos aninhados (ex: 'sections.0.name')
  const parts = fieldPath.split('.')
  let value: any = template.metadata

  for (const part of parts) {
    if (value === null || value === undefined) {
      return null
    }

    // Tenta como índice numérico primeiro (para arrays)
    const numIndex = parseInt(part, 10)
    if (!isNaN(numIndex) && Array.isArray(value)) {
      value = value[numIndex]
    } else {
      value = value[part]
    }
  }

  return value
}

/**
 * Atualiza campo específico no metadata JSONB
 * 
 * @param templateId - ID do template
 * @param fieldPath - Caminho do campo
 * @param value - Novo valor
 */
export async function updateTemplateFieldValue(
  templateId: string,
  fieldPath: string,
  value: any
): Promise<void> {
  const template = await findTemplateById(templateId)
  if (!template) {
    throw new Error(`Template não encontrado: ${templateId}`)
  }

  // Atualiza metadata JSONB usando SQL
  const parts = fieldPath.split('.')
  if (parts.length === 1) {
    // Campo simples
    await db
      .update(templates)
      .set({
        metadata: sql`jsonb_set(COALESCE(${templates.metadata}, '{}'::jsonb), ${`{${parts[0]}}`}, ${JSON.stringify(value)}::jsonb)`,
        updatedAt: new Date(),
      })
      .where(eq(templates.id, templateId))
  } else {
    // Campo aninhado - requer construção mais complexa
    // Por enquanto, carrega, atualiza e salva
    const currentMetadata = (template.metadata || {}) as Record<string, any>
    let target: any = currentMetadata

    // Navega até o penúltimo nível
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      const numIndex = parseInt(part, 10)
      
      if (!isNaN(numIndex) && Array.isArray(target)) {
        if (!target[numIndex]) {
          target[numIndex] = {}
        }
        target = target[numIndex]
      } else {
        if (!target[part]) {
          target[part] = {}
        }
        target = target[part]
      }
    }

    // Atualiza o último nível
    const lastPart = parts[parts.length - 1]
    const lastNumIndex = parseInt(lastPart, 10)
    if (!isNaN(lastNumIndex) && Array.isArray(target)) {
      target[lastNumIndex] = value
    } else {
      target[lastPart] = value
    }

    // Salva metadata atualizado
    await db
      .update(templates)
      .set({
        metadata: currentMetadata as any,
        updatedAt: new Date(),
      })
      .where(eq(templates.id, templateId))
  }
}

/**
 * Conta templates que correspondem aos filtros
 */
export async function countTemplatesWithFilters(filters: TemplateFilters = {}): Promise<number> {
  const conditions: SQL[] = []

  // Mesmos filtros de findTemplatesWithFilters
  if (filters.area) {
    conditions.push(sql`${templates.metadata}->>'area' = ${filters.area}`)
  }

  if (filters.docType) {
    conditions.push(sql`${templates.metadata}->>'docType' = ${filters.docType}`)
  }

  if (filters.complexity) {
    conditions.push(sql`${templates.metadata}->>'complexity' = ${filters.complexity}`)
  }

  if (filters.jurisdiction) {
    conditions.push(sql`${templates.metadata}->>'jurisdiction' = ${filters.jurisdiction}`)
  }

  if (filters.tags && filters.tags.length > 0) {
    conditions.push(sql`${templates.metadata}->'tags' @> ${JSON.stringify(filters.tags)}::jsonb`)
  }

  if (filters.onlyGold) {
    conditions.push(sql`${templates.metadata}->>'isGold' = 'true'`)
  }

  if (filters.onlySilver) {
    conditions.push(sql`${templates.metadata}->>'isSilver' = 'true'`)
  }

  if (filters.minQualityScore !== undefined) {
    conditions.push(sql`CAST(${templates.metadata}->>'qualityScore' AS NUMERIC) >= ${filters.minQualityScore}`)
  }

  if (filters.maxQualityScore !== undefined) {
    conditions.push(sql`CAST(${templates.metadata}->>'qualityScore' AS NUMERIC) <= ${filters.maxQualityScore}`)
  }

  if (filters.customFilters) {
    for (const [key, value] of Object.entries(filters.customFilters)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          conditions.push(sql`${templates.metadata}->${key} @> ${JSON.stringify(value)}::jsonb`)
        } else if (typeof value === 'object') {
          conditions.push(sql`${templates.metadata}->${key} @> ${JSON.stringify(value)}::jsonb`)
        } else {
          conditions.push(sql`${templates.metadata}->>${key} = ${String(value)}`)
        }
      }
    }
  }

  let query = db.select({ count: sql<number>`count(*)` }).from(templates)

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any
  }

  const result = await query
  return Number(result[0]?.count || 0)
}

