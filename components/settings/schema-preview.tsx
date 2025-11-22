'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  TemplateSchemaConfig,
  FieldDefinition,
  NumberFieldDefinition,
  EnumFieldDefinition,
  LiteralFieldDefinition,
  ArrayFieldDefinition,
} from '@/lib/types/template-schema'
import { buildZodSchemaFromConfig } from '@/lib/services/schema-builder'
import { useEffect, useState } from 'react'

interface SchemaPreviewProps {
  config: TemplateSchemaConfig | null
}

// Type guards
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

export function SchemaPreview({ config }: SchemaPreviewProps) {
  const [schemaCode, setSchemaCode] = useState<string>('')

  useEffect(() => {
    if (!config || config.fields.length === 0) {
      setSchemaCode('// Nenhum campo definido')
      return
    }

    try {
      const zodSchema = buildZodSchemaFromConfig(config)
      // Gera uma representação textual do schema
      const fields = config.fields.map(field => {
        let fieldDef = `${field.name}: `
        
        switch (field.type) {
          case 'string':
            fieldDef += 'z.string()'
            break
          case 'number':
            fieldDef += 'z.number()'
            if (isNumberField(field)) {
              if (field.min !== undefined) fieldDef += `.min(${field.min})`
              if (field.max !== undefined) fieldDef += `.max(${field.max})`
            }
            break
          case 'boolean':
            fieldDef += 'z.boolean()'
            break
          case 'date':
            fieldDef += 'z.date()'
            break
          case 'bigint':
            fieldDef += 'z.bigint()'
            break
          case 'enum':
            if (isEnumField(field)) {
              fieldDef += `z.enum([${field.enumValues.map((v: string) => `"${v}"`).join(', ')}])`
            }
            break
          case 'literal':
            if (isLiteralField(field)) {
              const val = typeof field.literalValue === 'string' 
                ? `"${field.literalValue}"` 
                : String(field.literalValue)
              fieldDef += `z.literal(${val})`
            }
            break
          case 'array':
            if (isArrayField(field)) {
              fieldDef += `z.array(${field.itemType})`
            }
            break
          case 'object':
            fieldDef += 'z.object({ ... })'
            break
          case 'union':
            fieldDef += 'z.union([ ... ])'
            break
        }

        if (field.required === false) {
          fieldDef += '.optional()'
        }
        if (field.defaultValue !== undefined) {
          fieldDef += `.default(${JSON.stringify(field.defaultValue)})`
        }
        if (field.description) {
          fieldDef += `.describe("${field.description}")`
        }

        return `  ${fieldDef}`
      }).join(',\n')

      setSchemaCode(`z.object({\n${fields}\n})`)
    } catch (error) {
      setSchemaCode(`// Erro ao gerar preview: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }, [config])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Preview do Schema Zod</CardTitle>
        <CardDescription className="text-xs">
          Visualização do schema Zod gerado a partir da configuração
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <pre className="text-xs font-mono bg-muted p-4 rounded overflow-x-auto max-h-96 overflow-y-auto">
          <code>{schemaCode}</code>
        </pre>
      </CardContent>
    </Card>
  )
}

