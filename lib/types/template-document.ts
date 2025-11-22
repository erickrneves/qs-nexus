import { z } from 'zod'
import { DynamicTemplateDocument } from './template-schema'

/**
 * Schema base para TemplateDocument
 * Mantido para compatibilidade com código legado
 * Campos dinâmicos são armazenados em metadata JSONB
 */
export const TemplateDocumentSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  docType: z.enum([
    'peticao_inicial',
    'contestacao',
    'recurso',
    'parecer',
    'contrato',
    'modelo_generico',
    'outro',
  ]),
  area: z.enum([
    'civil',
    'trabalhista',
    'tributario',
    'empresarial',
    'consumidor',
    'penal',
    'administrativo',
    'previdenciario',
    'outro',
  ]),
  jurisdiction: z.string().default('BR'),
  complexity: z.enum(['simples', 'medio', 'complexo']),
  tags: z.array(z.string()).default([]),
  summary: z.string(),
  markdown: z.string(),
  metadata: z.record(z.any()).optional(),
  qualityScore: z.number().min(0).max(100).optional(),
  isGold: z.boolean().default(false),
  isSilver: z.boolean().default(false),
})

export type TemplateDocument = z.infer<typeof TemplateDocumentSchema>

/**
 * Template document com campos dinâmicos
 * Usa metadata JSONB para armazenar campos configuráveis
 */
export interface DynamicTemplateDocumentWithBase extends TemplateDocument {
  metadata: DynamicTemplateDocument
  schemaConfigId?: string
}

/**
 * Converte TemplateDocument para formato com metadata dinâmico
 */
export function toDynamicTemplateDocument(
  template: TemplateDocument,
  schemaConfigId?: string
): DynamicTemplateDocumentWithBase {
  // Extrai campos que devem ir para metadata
  const {
    docType,
    area,
    jurisdiction,
    complexity,
    tags,
    summary,
    qualityScore,
    isGold,
    isSilver,
    ...rest
  } = template

  // Constrói metadata com campos dinâmicos
  const metadata: DynamicTemplateDocument = {
    docType,
    area,
    jurisdiction: jurisdiction || 'BR',
    complexity,
    tags: tags || [],
    summary,
    qualityScore,
    isGold: isGold || false,
    isSilver: isSilver || false,
    // Preserva metadata existente se houver
    ...(template.metadata || {}),
  }

  return {
    ...rest,
    // Inclui campos obrigatórios do TemplateDocument (mesmo que também estejam em metadata)
    docType,
    area,
    jurisdiction: jurisdiction || 'BR',
    complexity,
    tags: tags || [],
    summary,
    qualityScore,
    isGold: isGold || false,
    isSilver: isSilver || false,
    metadata,
    schemaConfigId,
  }
}

/**
 * Converte DynamicTemplateDocumentWithBase para TemplateDocument
 */
export function fromDynamicTemplateDocument(
  dynamic: DynamicTemplateDocumentWithBase
): TemplateDocument {
  const { metadata, schemaConfigId, ...rest } = dynamic

  return {
    ...rest,
    docType: metadata.docType as TemplateDocument['docType'],
    area: metadata.area as TemplateDocument['area'],
    jurisdiction: (metadata.jurisdiction as string) || 'BR',
    complexity: metadata.complexity as TemplateDocument['complexity'],
    tags: (metadata.tags as string[]) || [],
    summary: metadata.summary as string,
    qualityScore: metadata.qualityScore as number | undefined,
    isGold: (metadata.isGold as boolean) || false,
    isSilver: (metadata.isSilver as boolean) || false,
    metadata: metadata,
  }
}
