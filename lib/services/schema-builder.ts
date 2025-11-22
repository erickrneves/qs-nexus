import { z } from 'zod'
import {
  FieldDefinition,
  TemplateSchemaConfig,
  NumberFieldDefinition,
  EnumFieldDefinition,
  LiteralFieldDefinition,
  ArrayFieldDefinition,
  ObjectFieldDefinition,
  UnionFieldDefinition,
} from '../types/template-schema'

/**
 * Type guards para FieldDefinition
 */
function isNumberField(field: FieldDefinition): field is NumberFieldDefinition {
  return field.type === 'number'
}

function isEnumField(field: FieldDefinition): field is EnumFieldDefinition {
  return field.type === 'enum'
}

function isLiteralField(field: FieldDefinition): field is LiteralFieldDefinition {
  return field.type === 'literal'
}

function isArrayField(field: FieldDefinition): field is ArrayFieldDefinition {
  return field.type === 'array'
}

function isObjectField(field: FieldDefinition): field is ObjectFieldDefinition {
  return field.type === 'object'
}

function isUnionField(field: FieldDefinition): field is UnionFieldDefinition {
  return field.type === 'union'
}

/**
 * Constrói um schema Zod baseado em uma definição de campo
 */
function buildFieldSchema(field: FieldDefinition): z.ZodTypeAny {
  let schema: z.ZodTypeAny

  switch (field.type) {
    case 'string':
      schema = z.string()
      break

    case 'number': {
      schema = z.number()
      if (isNumberField(field)) {
        if (field.min !== undefined) {
          schema = (schema as z.ZodNumber).min(field.min)
        }
        if (field.max !== undefined) {
          schema = (schema as z.ZodNumber).max(field.max)
        }
      }
      break
    }

    case 'boolean':
      schema = z.boolean()
      break

    case 'date':
      schema = z.date()
      break

    case 'bigint':
      schema = z.bigint()
      break

    case 'enum': {
      if (isEnumField(field)) {
        if (field.enumValues.length === 0) {
          throw new Error(`Campo enum "${field.name}" deve ter pelo menos um valor`)
        }
        schema = z.enum(field.enumValues as [string, ...string[]])
      } else {
        schema = z.string() // Fallback
      }
      break
    }

    case 'literal': {
      if (isLiteralField(field)) {
        schema = z.literal(field.literalValue)
      } else {
        schema = z.string() // Fallback
      }
      break
    }

    case 'array': {
      if (isArrayField(field)) {
        if (field.itemType === 'object' && field.itemConfig) {
          // Array de objetos
          const itemSchema = buildFieldSchema(field.itemConfig)
          schema = z.array(itemSchema)
        } else {
          // Array de primitivos
          const itemSchema = buildPrimitiveSchema(field.itemType)
          schema = z.array(itemSchema)
        }
      } else {
        schema = z.array(z.any()) // Fallback
      }
      break
    }

    case 'object': {
      if (isObjectField(field)) {
        const objectShape: Record<string, z.ZodTypeAny> = {}
        for (const objectField of field.objectFields) {
          const fieldSchema = buildFieldSchema(objectField)
          if (objectField.required !== false) {
            // Campo obrigatório por padrão (a menos que explicitamente marcado como opcional)
            objectShape[objectField.name] = fieldSchema
          } else {
            // Campo opcional
            objectShape[objectField.name] = fieldSchema.optional()
          }
        }
        schema = z.object(objectShape)
      } else {
        schema = z.object({}) // Fallback
      }
      break
    }

    case 'union': {
      if (isUnionField(field)) {
        const unionSchemas: z.ZodTypeAny[] = []
        if (field.unionConfigs && field.unionConfigs.length > 0) {
          // Usa configurações específicas para cada tipo
          for (const unionConfig of field.unionConfigs) {
            unionSchemas.push(buildFieldSchema(unionConfig))
          }
        } else {
          // Usa tipos primitivos padrão
          for (const unionType of field.unionTypes) {
            unionSchemas.push(buildPrimitiveSchema(unionType))
          }
        }
        if (unionSchemas.length === 0) {
          throw new Error(`Campo union "${field.name}" deve ter pelo menos um tipo`)
        }
        schema = z.union(unionSchemas as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]])
      } else {
        schema = z.any() // Fallback
      }
      break
    }

    default:
      throw new Error(`Tipo de campo não suportado: ${(field as any).type}`)
  }

  // Adiciona descrição se fornecida
  if (field.description) {
    schema = schema.describe(field.description)
  }

  // Aplica valor padrão se fornecido e campo não for obrigatório
  if (field.defaultValue !== undefined && field.required === false) {
    schema = schema.default(field.defaultValue)
  }

  // Torna opcional se não for obrigatório
  if (field.required === false && field.defaultValue === undefined) {
    schema = schema.optional()
  }

  return schema
}

/**
 * Constrói schema Zod para tipos primitivos
 */
function buildPrimitiveSchema(type: string): z.ZodTypeAny {
  switch (type) {
    case 'string':
      return z.string()
    case 'number':
      return z.number()
    case 'boolean':
      return z.boolean()
    case 'date':
      return z.date()
    case 'bigint':
      return z.bigint()
    default:
      return z.any()
  }
}

/**
 * Constrói schema Zod completo baseado em configuração de schema de template
 * 
 * @param config - Configuração do schema de template
 * @returns Schema Zod que pode ser usado para validação e classificação
 */
export function buildZodSchemaFromConfig(config: TemplateSchemaConfig): z.ZodSchema {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const field of config.fields) {
    const fieldSchema = buildFieldSchema(field)

    // Campos são obrigatórios por padrão, a menos que explicitamente marcados como opcionais
    if (field.required === false) {
      if (field.defaultValue !== undefined) {
        shape[field.name] = fieldSchema.default(field.defaultValue)
      } else {
        shape[field.name] = fieldSchema.optional()
      }
    } else {
      shape[field.name] = fieldSchema
    }
  }

  return z.object(shape)
}

/**
 * Valida uma definição de campo
 */
export function validateFieldDefinition(field: FieldDefinition): { valid: boolean; error?: string } {
  if (!field.name || field.name.trim() === '') {
    return { valid: false, error: 'Nome do campo é obrigatório' }
  }

  if (!field.type) {
    return { valid: false, error: 'Tipo do campo é obrigatório' }
  }

  // Validações específicas por tipo
  switch (field.type) {
    case 'enum':
      if (isEnumField(field)) {
        if (!field.enumValues || field.enumValues.length === 0) {
          return { valid: false, error: `Campo enum "${field.name}" deve ter pelo menos um valor` }
        }
      }
      break

    case 'literal':
      if (isLiteralField(field)) {
        if (field.literalValue === undefined || field.literalValue === null) {
          return { valid: false, error: `Campo literal "${field.name}" deve ter um valor` }
        }
      }
      break

    case 'number':
      if (isNumberField(field)) {
        if (field.min !== undefined && field.max !== undefined && field.min > field.max) {
          return { valid: false, error: `Campo number "${field.name}" tem min maior que max` }
        }
      }
      break

    case 'array':
      if (isArrayField(field)) {
        if (!field.itemType) {
          return { valid: false, error: `Campo array "${field.name}" deve ter um itemType` }
        }
        if (field.itemType === 'object' && !field.itemConfig) {
          return { valid: false, error: `Campo array "${field.name}" com itemType "object" deve ter itemConfig` }
        }
        if (field.itemConfig) {
          const itemValidation = validateFieldDefinition(field.itemConfig)
          if (!itemValidation.valid) {
            return { valid: false, error: `ItemConfig inválido para campo array "${field.name}": ${itemValidation.error}` }
          }
        }
      }
      break

    case 'object':
      if (isObjectField(field)) {
        if (!field.objectFields || field.objectFields.length === 0) {
          return { valid: false, error: `Campo object "${field.name}" deve ter pelo menos um campo` }
        }
        for (const objectField of field.objectFields) {
          const fieldValidation = validateFieldDefinition(objectField)
          if (!fieldValidation.valid) {
            return { valid: false, error: `Campo aninhado inválido em "${field.name}": ${fieldValidation.error}` }
          }
        }
      }
      break

    case 'union':
      if (isUnionField(field)) {
        if (!field.unionTypes || field.unionTypes.length === 0) {
          return { valid: false, error: `Campo union "${field.name}" deve ter pelo menos um tipo` }
        }
        if (field.unionConfigs) {
          for (const unionConfig of field.unionConfigs) {
            const configValidation = validateFieldDefinition(unionConfig)
            if (!configValidation.valid) {
              return { valid: false, error: `UnionConfig inválido para campo union "${field.name}": ${configValidation.error}` }
            }
          }
        }
      }
      break
  }

  return { valid: true }
}

/**
 * Valida uma configuração de schema de template
 */
export function validateTemplateSchemaConfig(config: {
  name: string
  fields: FieldDefinition[]
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!config.name || config.name.trim() === '') {
    errors.push('Nome do schema é obrigatório')
  }

  if (!config.fields || config.fields.length === 0) {
    errors.push('Schema deve ter pelo menos um campo')
  }

  // Valida cada campo
  const fieldNames = new Set<string>()
  for (const field of config.fields) {
    const fieldValidation = validateFieldDefinition(field)
    if (!fieldValidation.valid) {
      errors.push(fieldValidation.error || `Campo "${field.name}" inválido`)
    }

    // Verifica nomes duplicados
    if (fieldNames.has(field.name)) {
      errors.push(`Campo duplicado: "${field.name}"`)
    }
    fieldNames.add(field.name)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

