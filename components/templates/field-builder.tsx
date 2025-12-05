'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import type { NormalizationField } from '@/lib/db/schema/normalization-templates'

interface FieldBuilderProps {
  fields: NormalizationField[]
  onChange: (fields: NormalizationField[]) => void
}

export function FieldBuilder({ fields, onChange }: FieldBuilderProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const addField = () => {
    const newField: NormalizationField = {
      fieldName: '',
      displayName: '',
      fieldType: 'text',
      isRequired: false,
      description: '',
    }
    onChange([...fields, newField])
    setEditingIndex(fields.length)
  }

  const updateField = (index: number, updates: Partial<NormalizationField>) => {
    const newFields = [...fields]
    newFields[index] = { ...newFields[index], ...updates }
    onChange(newFields)
  }

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index))
    if (editingIndex === index) {
      setEditingIndex(null)
    }
  }

  const generateFieldName = (displayName: string) => {
    return displayName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
  }

  return (
    <div className="space-y-4">
      {fields.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">
            Nenhum campo adicionado ainda
          </p>
          <Button onClick={addField} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Primeiro Campo
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {fields.map((field, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                  </div>

                  <div className="flex-1 space-y-4">
                    {/* Header do campo */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {editingIndex === index ? (
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Nome de Exibição *</Label>
                              <Input
                                value={field.displayName}
                                onChange={(e) => {
                                  const displayName = e.target.value
                                  updateField(index, {
                                    displayName,
                                    fieldName: field.fieldName || generateFieldName(displayName),
                                  })
                                }}
                                placeholder="Ex: Data do Contrato"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Nome no Banco *</Label>
                              <Input
                                value={field.fieldName}
                                onChange={(e) => updateField(index, { fieldName: e.target.value })}
                                placeholder="Ex: data_contrato"
                                pattern="[a-z0-9_]+"
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <h4 className="font-medium">
                              {field.displayName || 'Campo sem nome'}
                            </h4>
                            <p className="text-xs text-muted-foreground font-mono">
                              {field.fieldName}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                        >
                          {editingIndex === index ? 'Fechar' : 'Editar'}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeField(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {/* Detalhes do campo (quando editando) */}
                    {editingIndex === index && (
                      <div className="space-y-3 pt-3 border-t">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Tipo de Dado *</Label>
                            <Select
                              value={field.fieldType}
                              onValueChange={(value: any) => updateField(index, { fieldType: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Texto</SelectItem>
                                <SelectItem value="numeric">Número</SelectItem>
                                <SelectItem value="date">Data</SelectItem>
                                <SelectItem value="boolean">Verdadeiro/Falso</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center space-x-2 mt-6">
                            <Switch
                              id={`required-${index}`}
                              checked={field.isRequired}
                              onCheckedChange={(checked) => updateField(index, { isRequired: checked })}
                            />
                            <Label htmlFor={`required-${index}`} className="text-xs cursor-pointer">
                              Campo obrigatório
                            </Label>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Descrição</Label>
                          <Textarea
                            value={field.description || ''}
                            onChange={(e) => updateField(index, { description: e.target.value })}
                            placeholder="Descreva o que este campo armazena..."
                            rows={2}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Dica (Hint)</Label>
                          <Input
                            value={field.hint || ''}
                            onChange={(e) => updateField(index, { hint: e.target.value })}
                            placeholder="Ex: Localizado no cabeçalho do documento"
                          />
                        </div>

                        {field.fieldType === 'text' && (
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Tamanho Mínimo</Label>
                              <Input
                                type="number"
                                value={field.validationRules?.minLength || ''}
                                onChange={(e) => updateField(index, {
                                  validationRules: {
                                    ...field.validationRules,
                                    minLength: parseInt(e.target.value) || undefined,
                                  },
                                })}
                                placeholder="Ex: 3"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Tamanho Máximo</Label>
                              <Input
                                type="number"
                                value={field.validationRules?.maxLength || ''}
                                onChange={(e) => updateField(index, {
                                  validationRules: {
                                    ...field.validationRules,
                                    maxLength: parseInt(e.target.value) || undefined,
                                  },
                                })}
                                placeholder="Ex: 100"
                              />
                            </div>
                          </div>
                        )}

                        {field.fieldType === 'numeric' && (
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Valor Mínimo</Label>
                              <Input
                                type="number"
                                value={field.validationRules?.min || ''}
                                onChange={(e) => updateField(index, {
                                  validationRules: {
                                    ...field.validationRules,
                                    min: parseFloat(e.target.value) || undefined,
                                  },
                                })}
                                placeholder="Ex: 0"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Valor Máximo</Label>
                              <Input
                                type="number"
                                value={field.validationRules?.max || ''}
                                onChange={(e) => updateField(index, {
                                  validationRules: {
                                    ...field.validationRules,
                                    max: parseFloat(e.target.value) || undefined,
                                  },
                                })}
                                placeholder="Ex: 999999"
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-1">
                          <Label className="text-xs">Valor Padrão</Label>
                          <Input
                            value={field.defaultValue || ''}
                            onChange={(e) => updateField(index, { defaultValue: e.target.value })}
                            placeholder="Valor padrão se campo não for preenchido"
                          />
                        </div>
                      </div>
                    )}

                    {/* Resumo quando não está editando */}
                    {editingIndex !== index && (
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="font-medium">{field.fieldType}</span>
                        {field.isRequired && <span className="text-amber-600">Obrigatório</span>}
                        {field.description && <span>{field.description}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Button
            type="button"
            onClick={addField}
            variant="outline"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Campo
          </Button>
        </>
      )}
    </div>
  )
}

