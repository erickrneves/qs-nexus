import { db } from '../db'
import { templateSchemaConfigs } from '../db/schema/rag'
import { eq, and } from 'drizzle-orm'
import { TemplateSchemaConfig, FieldDefinition } from '../types/template-schema'
import { validateTemplateSchemaConfig } from './schema-builder'

/**
 * Carrega configuração de schema de template do banco
 * Se schemaId não for fornecido, retorna o schema ativo
 */
export async function loadTemplateSchemaConfig(schemaId?: string): Promise<TemplateSchemaConfig> {
  let config

  if (schemaId) {
    // Carrega configuração específica
    const result = await db
      .select()
      .from(templateSchemaConfigs)
      .where(eq(templateSchemaConfigs.id, schemaId))
      .limit(1)

    if (result.length === 0) {
      throw new Error(`Schema de template não encontrado: ${schemaId}`)
    }

    config = result[0]
  } else {
    // Carrega configuração ativa
    const result = await db
      .select()
      .from(templateSchemaConfigs)
      .where(eq(templateSchemaConfigs.isActive, true))
      .limit(1)

    if (result.length === 0) {
      throw new Error('Nenhum schema de template ativo encontrado')
    }

    config = result[0]
  }

  // Parse fields do JSONB
  const fields = config.fields as FieldDefinition[]

  return {
    id: config.id,
    name: config.name,
    documentType: (config.documentType as 'juridico' | 'contabil' | 'geral') || 'geral',
    fields,
    isActive: config.isActive ?? false,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  }
}

/**
 * Valida configuração de schema antes de salvar
 */
export function validateSchemaConfig(data: {
  name: string
  fields: FieldDefinition[]
}): { valid: boolean; errors: string[] } {
  return validateTemplateSchemaConfig(data)
}

/**
 * Cria nova configuração de schema de template
 */
export async function createTemplateSchemaConfig(data: {
  name: string
  documentType?: 'juridico' | 'contabil' | 'geral'
  fields: FieldDefinition[]
  isActive?: boolean
}): Promise<TemplateSchemaConfig> {
  // Valida antes de criar
  const validation = validateSchemaConfig(data)
  if (!validation.valid) {
    throw new Error(`Schema inválido: ${validation.errors.join(', ')}`)
  }

  const documentType = data.documentType || 'geral'

  // Se esta for marcada como ativa, desativa outras do mesmo tipo
  if (data.isActive) {
    await db
      .update(templateSchemaConfigs)
      .set({ isActive: false })
      .where(and(
        eq(templateSchemaConfigs.documentType, documentType),
        eq(templateSchemaConfigs.isActive, true)
      ))
  }

  const result = await db
    .insert(templateSchemaConfigs)
    .values({
      name: data.name,
      documentType,
      fields: data.fields as any, // JSONB
      isActive: data.isActive ?? false,
    })
    .returning()

  const config = result[0]
  const fields = config.fields as FieldDefinition[]

  return {
    id: config.id,
    name: config.name,
    documentType: (config.documentType as 'juridico' | 'contabil' | 'geral') || 'geral',
    fields,
    isActive: config.isActive ?? false,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  }
}

/**
 * Atualiza configuração de schema de template
 */
export async function updateTemplateSchemaConfig(
  id: string,
  data: {
    name?: string
    documentType?: 'juridico' | 'contabil' | 'geral'
    fields?: FieldDefinition[]
    isActive?: boolean
  }
): Promise<TemplateSchemaConfig> {
  // Carrega configuração atual
  const current = await loadTemplateSchemaConfig(id)
  const documentType = data.documentType ?? current.documentType

  // Se estiver atualizando para ativa, desativa outras do mesmo tipo
  if (data.isActive === true) {
    await db
      .update(templateSchemaConfigs)
      .set({ isActive: false })
      .where(and(
        eq(templateSchemaConfigs.documentType, documentType),
        eq(templateSchemaConfigs.isActive, true)
      ))
  }

  const updatedData = {
    name: data.name ?? current.name,
    fields: data.fields ?? current.fields,
  }

  // Valida antes de atualizar
  const validation = validateSchemaConfig(updatedData)
  if (!validation.valid) {
    throw new Error(`Schema inválido: ${validation.errors.join(', ')}`)
  }

  const result = await db
    .update(templateSchemaConfigs)
    .set({
      ...data,
      fields: data.fields ? (data.fields as any) : undefined, // JSONB
      updatedAt: new Date(),
    })
    .where(eq(templateSchemaConfigs.id, id))
    .returning()

  if (result.length === 0) {
    throw new Error(`Schema de template não encontrado: ${id}`)
  }

  const config = result[0]
  const fields = config.fields as FieldDefinition[]

  return {
    id: config.id,
    name: config.name,
    documentType: (config.documentType as 'juridico' | 'contabil' | 'geral') || 'geral',
    fields,
    isActive: config.isActive ?? false,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  }
}

/**
 * Lista todas as configurações de schema de template
 */
export async function listTemplateSchemaConfigs(): Promise<TemplateSchemaConfig[]> {
  const results = await db
    .select()
    .from(templateSchemaConfigs)
    .orderBy(templateSchemaConfigs.createdAt)

  return results.map(config => {
    const fields = config.fields as FieldDefinition[]
    return {
      id: config.id,
      name: config.name,
      documentType: (config.documentType as 'juridico' | 'contabil' | 'geral') || 'geral',
      fields,
      isActive: config.isActive ?? false,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    }
  })
}

/**
 * Deleta configuração de schema de template
 */
export async function deleteTemplateSchemaConfig(id: string): Promise<void> {
  const result = await db
    .delete(templateSchemaConfigs)
    .where(eq(templateSchemaConfigs.id, id))
    .returning()

  if (result.length === 0) {
    throw new Error(`Schema de template não encontrado: ${id}`)
  }
}

