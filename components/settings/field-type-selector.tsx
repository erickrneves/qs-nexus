'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FieldType } from '@/lib/types/template-schema'

interface FieldTypeSelectorProps {
  value: FieldType
  onChange: (type: FieldType) => void
}

const fieldTypes: { value: FieldType; label: string; description: string }[] = [
  { value: 'string', label: 'String', description: 'Texto simples' },
  { value: 'number', label: 'Number', description: 'Número (com min/max opcionais)' },
  { value: 'boolean', label: 'Boolean', description: 'Verdadeiro ou falso' },
  { value: 'date', label: 'Date', description: 'Data' },
  { value: 'bigint', label: 'BigInt', description: 'Número inteiro grande' },
  { value: 'enum', label: 'Enum', description: 'Lista de valores permitidos' },
  { value: 'literal', label: 'Literal', description: 'Valor literal específico' },
  { value: 'array', label: 'Array', description: 'Lista de valores' },
  { value: 'object', label: 'Object', description: 'Objeto com campos aninhados' },
  { value: 'union', label: 'Union', description: 'Múltiplos tipos possíveis' },
]

export function FieldTypeSelector({ value, onChange }: FieldTypeSelectorProps) {
  const selectedType = fieldTypes.find(t => t.value === value)

  return (
    <div className="space-y-2">
      <Label htmlFor="field-type">Tipo de Campo</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="field-type">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {fieldTypes.map(type => (
            <SelectItem key={type.value} value={type.value}>
              <div className="flex flex-col">
                <span className="font-medium">{type.label}</span>
                <span className="text-xs text-muted-foreground">{type.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedType && (
        <p className="text-xs text-muted-foreground">{selectedType.description}</p>
      )}
    </div>
  )
}

