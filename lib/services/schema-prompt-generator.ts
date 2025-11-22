import { TemplateSchemaConfig, FieldDefinition, EnumFieldDefinition, NumberFieldDefinition, ArrayFieldDefinition, ObjectFieldDefinition, UnionFieldDefinition } from '../types/template-schema'

/**
 * Type guards para FieldDefinition
 */
function isEnumField(field: FieldDefinition): field is EnumFieldDefinition {
  return field.type === 'enum'
}

function isNumberField(field: FieldDefinition): field is NumberFieldDefinition {
  return field.type === 'number'
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
 * Gera descrição de tipo para um campo
 */
function getTypeDescription(field: FieldDefinition, indent: number = 0): string {
  const indentStr = '  '.repeat(indent)
  
  switch (field.type) {
    case 'string':
      return 'string'
    
    case 'number': {
      if (isNumberField(field)) {
        const parts: string[] = ['number']
        if (field.min !== undefined && field.max !== undefined) {
          parts.push(`min: ${field.min}, max: ${field.max}`)
        } else if (field.min !== undefined) {
          parts.push(`min: ${field.min}`)
        } else if (field.max !== undefined) {
          parts.push(`max: ${field.max}`)
        }
        return parts.join(', ')
      }
      return 'number'
    }
    
    case 'boolean':
      return 'boolean'
    
    case 'date':
      return 'date'
    
    case 'bigint':
      return 'bigint'
    
    case 'enum': {
      if (isEnumField(field)) {
        const values = field.enumValues.join(', ')
        return `enum (valores: ${values})`
      }
      return 'enum'
    }
    
    case 'literal': {
      const literalField = field as { literalValue: string | number | boolean }
      return `literal (valor: ${literalField.literalValue})`
    }
    
    case 'array': {
      if (isArrayField(field)) {
        if (field.itemType === 'object' && field.itemConfig && isObjectField(field.itemConfig)) {
          const fieldNames = field.itemConfig.objectFields.map(f => f.name).join(', ')
          return `array de objetos com campos: ${fieldNames}`
        }
        // Para tipos primitivos, retorna descrição simples
        if (['string', 'number', 'boolean', 'date', 'bigint'].includes(field.itemType)) {
          return `array de ${field.itemType}`
        }
        // Para outros tipos, tenta gerar descrição recursiva
        if (field.itemConfig) {
          return `array de ${getTypeDescription(field.itemConfig, indent)}`
        }
        return `array de ${field.itemType}`
      }
      return 'array'
    }
    
    case 'object': {
      if (isObjectField(field)) {
        const fieldNames = field.objectFields.map(f => f.name).join(', ')
        return `objeto com campos: ${fieldNames}`
      }
      return 'objeto'
    }
    
    case 'union': {
      if (isUnionField(field)) {
        if (field.unionConfigs && field.unionConfigs.length > 0) {
          const types = field.unionConfigs.map(c => getTypeDescription(c, indent)).join(' ou ')
          return `union (${types})`
        }
        const types = field.unionTypes.join(' ou ')
        return `union (${types})`
      }
      return 'union'
    }
    
    default:
      // Type assertion necessário porque TypeScript não consegue garantir exaustividade
      return (field as { type: string }).type || 'unknown'
  }
}

/**
 * Gera descrição formatada de um campo aninhado (para objetos)
 */
function formatNestedField(field: FieldDefinition, index: number, indent: number = 1): string {
  const indentStr = '  '.repeat(indent)
  const isRequired = field.required !== false
  const namePart = isRequired ? `**${field.name}**` : `**${field.name}** (opcional)`
  const description = field.description || ''
  const typeDesc = getTypeDescription(field, indent)
  
  let result = `${indentStr}${index}. ${namePart}`
  
  if (description) {
    result += `: ${description}`
  }
  
  if (typeDesc) {
    result += ` (tipo: ${typeDesc})`
  }
  
  // Para objetos aninhados, listar campos
  if (isObjectField(field)) {
    result += '\n'
    field.objectFields.forEach((nestedField, nestedIndex) => {
      result += formatNestedField(nestedField, nestedIndex + 1, indent + 1)
      result += '\n'
    })
    result = result.trimEnd()
  }
  
  // Para arrays de objetos, mostrar estrutura
  if (isArrayField(field) && field.itemType === 'object' && field.itemConfig && isObjectField(field.itemConfig)) {
    result += '\n'
    result += `${indentStr}  Cada item contém:\n`
    field.itemConfig.objectFields.forEach((nestedField, nestedIndex) => {
      result += formatNestedField(nestedField, nestedIndex + 1, indent + 2)
      result += '\n'
    })
    result = result.trimEnd()
  }
  
  return result
}

/**
 * Gera prompt formatado para extração de campos baseado no schema configurado
 * 
 * @param schemaConfig - Configuração do schema de template
 * @returns String formatada com instruções de extração
 */
export function generateSchemaPrompt(schemaConfig: TemplateSchemaConfig): string {
  if (!schemaConfig.fields || schemaConfig.fields.length === 0) {
    return 'Extraia os campos configurados no schema.'
  }
  
  let prompt = 'Extraia:\n\n'
  
  schemaConfig.fields.forEach((field, index) => {
    const isRequired = field.required !== false
    const namePart = isRequired ? `**${field.name}**` : `**${field.name}** (opcional)`
    const description = field.description || ''
    const typeDesc = getTypeDescription(field)
    
    prompt += `${index + 1}. ${namePart}`
    
    if (description) {
      prompt += `: ${description}`
    }
    
    if (typeDesc) {
      prompt += ` (tipo: ${typeDesc})`
    }
    
    // Para objetos, listar campos aninhados
    if (isObjectField(field)) {
      prompt += '\n'
      field.objectFields.forEach((nestedField, nestedIndex) => {
        prompt += formatNestedField(nestedField, nestedIndex + 1, 1)
        prompt += '\n'
      })
      prompt = prompt.trimEnd()
    }
    
    // Para arrays de objetos, mostrar estrutura
    if (isArrayField(field) && field.itemType === 'object' && field.itemConfig && isObjectField(field.itemConfig)) {
      prompt += '\n'
      prompt += '  Cada item contém:\n'
      field.itemConfig.objectFields.forEach((nestedField, nestedIndex) => {
        prompt += formatNestedField(nestedField, nestedIndex + 1, 2)
        prompt += '\n'
      })
      prompt = prompt.trimEnd()
    }
    
    prompt += '\n'
  })
  
  return prompt.trimEnd()
}

