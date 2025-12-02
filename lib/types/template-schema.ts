import { z } from 'zod'

/**
 * Tipos Zod suportados para campos de template
 * Baseado nos tipos do ClassificationSchema atual
 */
export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'bigint'
  | 'enum'
  | 'literal'
  | 'array'
  | 'object'
  | 'union'

/**
 * Configuração base para um campo de template
 */
export interface BaseFieldDefinition {
  name: string
  type: FieldType
  description?: string
  required?: boolean
  defaultValue?: any
}

/**
 * Configuração para campo do tipo enum
 */
export interface EnumFieldDefinition extends BaseFieldDefinition {
  type: 'enum'
  enumValues: string[]
}

/**
 * Configuração para campo do tipo literal
 */
export interface LiteralFieldDefinition extends BaseFieldDefinition {
  type: 'literal'
  literalValue: string | number | boolean
}

/**
 * Configuração para campo do tipo number
 */
export interface NumberFieldDefinition extends BaseFieldDefinition {
  type: 'number'
  min?: number
  max?: number
}

/**
 * Configuração para campo do tipo array
 */
export interface ArrayFieldDefinition extends BaseFieldDefinition {
  type: 'array'
  itemType: FieldType
  itemConfig?: FieldDefinition // Para arrays de objetos ou tipos complexos
}

/**
 * Configuração para campo do tipo object
 */
export interface ObjectFieldDefinition extends BaseFieldDefinition {
  type: 'object'
  objectFields: FieldDefinition[]
}

/**
 * Configuração para campo do tipo union
 */
export interface UnionFieldDefinition extends BaseFieldDefinition {
  type: 'union'
  unionTypes: FieldType[]
  unionConfigs?: FieldDefinition[] // Configurações para cada tipo da union
}

/**
 * Definição de campo de template (union de todos os tipos)
 */
export type FieldDefinition =
  | BaseFieldDefinition
  | EnumFieldDefinition
  | LiteralFieldDefinition
  | NumberFieldDefinition
  | ArrayFieldDefinition
  | ObjectFieldDefinition
  | UnionFieldDefinition

/**
 * Configuração de schema de template
 * Armazenada no banco na tabela template_schema_configs
 */
export interface TemplateSchemaConfig {
  id: string
  name: string
  documentType: 'juridico' | 'contabil' | 'geral'
  fields: FieldDefinition[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Template document com campos dinâmicos
 * Os campos são definidos pelo schema configurado
 */
export type DynamicTemplateDocument = Record<string, any>

/**
 * Schema Zod para validar TemplateSchemaConfig
 */
export const FieldDefinitionSchema: z.ZodType<FieldDefinition> = z.lazy(() =>
  z.discriminatedUnion('type', [
    // Base types
    z.object({
      name: z.string(),
      type: z.enum(['string', 'boolean', 'date', 'bigint']),
      description: z.string().optional(),
      required: z.boolean().optional(),
      defaultValue: z.any().optional(),
    }),
    // Enum
    z.object({
      name: z.string(),
      type: z.literal('enum'),
      enumValues: z.array(z.string()),
      description: z.string().optional(),
      required: z.boolean().optional(),
      defaultValue: z.any().optional(),
    }),
    // Literal
    z.object({
      name: z.string(),
      type: z.literal('literal'),
      literalValue: z.union([z.string(), z.number(), z.boolean()]),
      description: z.string().optional(),
      required: z.boolean().optional(),
      defaultValue: z.any().optional(),
    }),
    // Number
    z.object({
      name: z.string(),
      type: z.literal('number'),
      min: z.number().optional(),
      max: z.number().optional(),
      description: z.string().optional(),
      required: z.boolean().optional(),
      defaultValue: z.number().optional(),
    }),
    // Array
    z.object({
      name: z.string(),
      type: z.literal('array'),
      itemType: z.enum(['string', 'number', 'boolean', 'date', 'bigint', 'enum', 'literal', 'array', 'object', 'union']),
      itemConfig: FieldDefinitionSchema.optional(),
      description: z.string().optional(),
      required: z.boolean().optional(),
      defaultValue: z.array(z.any()).optional(),
    }),
    // Object
    z.object({
      name: z.string(),
      type: z.literal('object'),
      objectFields: z.array(FieldDefinitionSchema),
      description: z.string().optional(),
      required: z.boolean().optional(),
      defaultValue: z.record(z.any()).optional(),
    }),
    // Union
    z.object({
      name: z.string(),
      type: z.literal('union'),
      unionTypes: z.array(z.enum(['string', 'number', 'boolean', 'date', 'bigint', 'enum', 'literal', 'array', 'object', 'union'])),
      unionConfigs: z.array(FieldDefinitionSchema).optional(),
      description: z.string().optional(),
      required: z.boolean().optional(),
      defaultValue: z.any().optional(),
    }),
  ])
)

export const TemplateSchemaConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  documentType: z.enum(['juridico', 'contabil', 'geral']).default('geral'),
  fields: z.array(FieldDefinitionSchema),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

