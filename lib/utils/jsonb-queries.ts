/**
 * Helpers para Queries JSONB
 * 
 * Facilita buscar e filtrar dados na tabela normalized_data
 */

import { sql } from 'drizzle-orm'

/**
 * Constrói uma condição SQL para buscar por campo JSONB
 * 
 * @example
 * // Buscar onde numero_contrato = '123/2025'
 * jsonbField('data', 'numero_contrato', '=', '123/2025')
 * // Resultado: data->>'numero_contrato' = '123/2025'
 */
export function jsonbField(
  column: string,
  field: string,
  operator: '=' | '>' | '<' | '>=' | '<=' | '!=' | 'LIKE' | 'ILIKE',
  value: string | number | boolean
) {
  const valueStr = typeof value === 'string' ? `'${value}'` : value
  return sql.raw(`${column}->>'${field}' ${operator} ${valueStr}`)
}

/**
 * Constrói condição para valores numéricos no JSONB
 * 
 * @example
 * jsonbNumeric('data', 'valor', '>', 10000)
 * // Resultado: (data->>'valor')::numeric > 10000
 */
export function jsonbNumeric(
  column: string,
  field: string,
  operator: '=' | '>' | '<' | '>=' | '<=' | '!=',
  value: number
) {
  return sql.raw(`(${column}->>'${field}')::numeric ${operator} ${value}`)
}

/**
 * Constrói condição para datas no JSONB
 * 
 * @example
 * jsonbDate('data', 'data_contrato', '>=', '2025-01-01')
 */
export function jsonbDate(
  column: string,
  field: string,
  operator: '=' | '>' | '<' | '>=' | '<=' | '!=',
  value: string
) {
  return sql.raw(`(${column}->>'${field}')::date ${operator} '${value}'::date`)
}

/**
 * Verifica se campo existe no JSONB
 * 
 * @example
 * jsonbHasField('data', 'numero_contrato')
 * // Resultado: data ? 'numero_contrato'
 */
export function jsonbHasField(column: string, field: string) {
  return sql.raw(`${column} ? '${field}'`)
}

/**
 * Busca em múltiplos campos (OR)
 * 
 * @example
 * jsonbSearchAny('data', ['contratante', 'contratado'], 'Empresa X')
 */
export function jsonbSearchAny(
  column: string,
  fields: string[],
  searchTerm: string
) {
  const conditions = fields
    .map(field => `${column}->>'${field}' ILIKE '%${searchTerm}%'`)
    .join(' OR ')
  return sql.raw(`(${conditions})`)
}

/**
 * Extrai campo do JSONB para usar no SELECT
 * 
 * @example
 * db.select({
 *   numero: jsonbExtract('data', 'numero_contrato')
 * }).from(normalizedData)
 */
export function jsonbExtract(column: string, field: string) {
  return sql.raw(`${column}->>'${field}'`)
}

/**
 * Extrai campo numérico
 */
export function jsonbExtractNumeric(column: string, field: string) {
  return sql.raw(`(${column}->>'${field}')::numeric`)
}

/**
 * Extrai campo de data
 */
export function jsonbExtractDate(column: string, field: string) {
  return sql.raw(`(${column}->>'${field}')::date`)
}

// ================================================================
// Exemplos de uso completos
// ================================================================

/**
 * EXEMPLO 1: Buscar contratos com valor > 10000
 * 
 * const contratos = await db
 *   .select()
 *   .from(normalizedData)
 *   .where(
 *     and(
 *       eq(normalizedData.templateId, contratoTemplateId),
 *       jsonbNumeric('data', 'valor', '>', 10000)
 *     )
 *   )
 */

/**
 * EXEMPLO 2: Buscar por texto em múltiplos campos
 * 
 * const results = await db
 *   .select()
 *   .from(normalizedData)
 *   .where(
 *     and(
 *       eq(normalizedData.organizationId, orgId),
 *       jsonbSearchAny('data', ['contratante', 'contratado'], 'Empresa')
 *     )
 *   )
 */

/**
 * EXEMPLO 3: Extrair campos específicos
 * 
 * const contratos = await db
 *   .select({
 *     id: normalizedData.id,
 *     numero: sql`data->>'numero_contrato'`,
 *     valor: sql`(data->>'valor')::numeric`,
 *     data: sql`(data->>'data_contrato')::date`,
 *   })
 *   .from(normalizedData)
 *   .where(eq(normalizedData.templateId, templateId))
 */

/**
 * EXEMPLO 4: Ordenar por campo JSONB
 * 
 * const results = await db
 *   .select()
 *   .from(normalizedData)
 *   .where(eq(normalizedData.templateId, templateId))
 *   .orderBy(sql`(data->>'valor')::numeric DESC`)
 */

