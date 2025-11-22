'use client'

import { useState } from 'react'
import {
  FieldDefinition,
  FieldType,
  NumberFieldDefinition,
  EnumFieldDefinition,
  LiteralFieldDefinition,
  ArrayFieldDefinition,
} from '@/lib/types/template-schema'
import { FieldTypeSelector } from './field-type-selector'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-react'

interface SchemaFieldEditorProps {
  field: FieldDefinition
  onChange: (field: FieldDefinition) => void
  onDelete?: () => void
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

export function SchemaFieldEditor({ field, onChange, onDelete }: SchemaFieldEditorProps) {
  const [localField, setLocalField] = useState<FieldDefinition>(field)

  function updateField(updates: Partial<FieldDefinition>) {
    const updated = { ...localField, ...updates }
    setLocalField(updated)
    onChange(updated)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Campo: {localField.name || 'Sem nome'}</CardTitle>
          {onDelete && (
            <Button variant="outline" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="field-name">Nome do Campo</Label>
          <Input
            id="field-name"
            value={localField.name}
            onChange={e => updateField({ name: e.target.value })}
            placeholder="ex: docType"
            required
          />
        </div>

        <FieldTypeSelector
          value={localField.type}
          onChange={type => {
            // Reset field-specific properties when type changes
            const baseField: FieldDefinition = {
              ...localField,
              type,
            }
            updateField(baseField)
          }}
        />

        <div className="space-y-2">
          <Label htmlFor="field-description">Descrição (opcional)</Label>
          <Textarea
            id="field-description"
            value={localField.description || ''}
            onChange={e => updateField({ description: e.target.value || undefined })}
            placeholder="Descrição do campo para documentação"
            rows={2}
          />
        </div>

        {/* Configurações específicas por tipo */}
        {isNumberField(localField) && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="field-min">Min (opcional)</Label>
              <Input
                id="field-min"
                type="number"
                value={localField.min || ''}
                onChange={e =>
                  updateField({
                    ...localField,
                    type: 'number',
                    min: e.target.value ? parseFloat(e.target.value) : undefined,
                  } as FieldDefinition)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="field-max">Max (opcional)</Label>
              <Input
                id="field-max"
                type="number"
                value={localField.max || ''}
                onChange={e =>
                  updateField({
                    ...localField,
                    type: 'number',
                    max: e.target.value ? parseFloat(e.target.value) : undefined,
                  } as FieldDefinition)
                }
              />
            </div>
          </div>
        )}

        {isEnumField(localField) && (
          <div className="space-y-2">
            <Label>Valores do Enum</Label>
            <div className="space-y-2">
              {(localField.enumValues || []).map((value: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={value}
                    onChange={e => {
                      const newValues = [...localField.enumValues]
                      newValues[index] = e.target.value
                      updateField({
                        ...localField,
                        type: 'enum',
                        enumValues: newValues,
                      } as FieldDefinition)
                    }}
                    placeholder="Valor do enum"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newValues = [...localField.enumValues]
                      newValues.splice(index, 1)
                      updateField({
                        ...localField,
                        type: 'enum',
                        enumValues: newValues,
                      } as FieldDefinition)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newValues = [...(localField.enumValues || []), '']
                  updateField({
                    ...localField,
                    type: 'enum',
                    enumValues: newValues,
                  } as FieldDefinition)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Valor
              </Button>
            </div>
          </div>
        )}

        {isLiteralField(localField) && (
          <div className="space-y-2">
            <Label htmlFor="field-literal">Valor Literal</Label>
            <Input
              id="field-literal"
              value={String(localField.literalValue || '')}
              onChange={e => {
                let value: string | number | boolean = e.target.value
                // Tenta converter para número ou boolean
                if (value === 'true') value = true
                else if (value === 'false') value = false
                else if (!isNaN(Number(value)) && value !== '') value = Number(value)
                updateField({
                  ...localField,
                  type: 'literal',
                  literalValue: value,
                } as FieldDefinition)
              }}
              placeholder="Valor literal (string, number ou boolean)"
            />
          </div>
        )}

        {isArrayField(localField) && (
          <div className="space-y-2">
            <Label htmlFor="field-item-type">Tipo do Item</Label>
            <FieldTypeSelector
              value={localField.itemType}
              onChange={itemType =>
                updateField({
                  ...localField,
                  type: 'array',
                  itemType,
                } as FieldDefinition)
              }
            />
            <p className="text-xs text-muted-foreground">
              Arrays de objetos requerem configuração adicional (não suportado na versão básica)
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="field-default">Valor Padrão (opcional)</Label>
          <Input
            id="field-default"
            value={localField.defaultValue !== undefined ? String(localField.defaultValue) : ''}
            onChange={e => {
              let value: any = e.target.value
              if (value === '') {
                updateField({ ...localField, defaultValue: undefined })
                return
              }
              // Tenta converter baseado no tipo
              if (localField.type === 'number') {
                value = parseFloat(value)
              } else if (localField.type === 'boolean') {
                value = value === 'true'
              }
              updateField({ ...localField, defaultValue: value })
            }}
            placeholder="Valor padrão do campo"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="field-required"
            checked={localField.required !== false}
            onCheckedChange={checked => updateField({ ...localField, required: checked === true })}
          />
          <Label htmlFor="field-required" className="cursor-pointer">
            Campo obrigatório
          </Label>
        </div>
      </CardContent>
    </Card>
  )
}

