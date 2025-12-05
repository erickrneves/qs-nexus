'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'react-hot-toast'
import {
  Loader2,
  Sparkles,
  FileText,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  X,
} from 'lucide-react'

interface TemplateField {
  name: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'array'
  label: string
  description: string
  required: boolean
}

interface TemplateAnalysis {
  suggestedName: string
  suggestedDescription: string
  fields: TemplateField[]
  previewData: Record<string, any>
  confidence: number
}

interface Props {
  open: boolean
  onClose: () => void
  documentId: string
  onTemplateCreated?: () => void
}

export function AiTemplateWizard({ open, onClose, documentId, onTemplateCreated }: Props) {
  const [step, setStep] = useState(1)
  const [userDescription, setUserDescription] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [analysis, setAnalysis] = useState<TemplateAnalysis | null>(null)
  const [editedFields, setEditedFields] = useState<TemplateField[]>([])
  const [templateName, setTemplateName] = useState('')
  const [saveAsReusable, setSaveAsReusable] = useState(true)

  if (!open) return null

  const handleClose = () => {
    setStep(1)
    setUserDescription('')
    setAnalysis(null)
    setEditedFields([])
    setTemplateName('')
    setSaveAsReusable(true)
    onClose()
  }

  const handleAnalyze = async () => {
    if (!userDescription.trim()) {
      toast.error('Descreva o que deseja extrair')
      return
    }

    setAnalyzing(true)
    try {
      const res = await fetch('/api/ai/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, userDescription }),
      })

      if (!res.ok) throw new Error('Erro ao analisar')

      const data = await res.json()
      setAnalysis(data.analysis)
      setEditedFields(data.analysis.fields)
      setTemplateName(data.analysis.suggestedName)
      setStep(2)
      toast.success('Análise concluída!')
    } catch (error) {
      toast.error('Erro ao analisar documento')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleCreate = async () => {
    if (!templateName.trim()) {
      toast.error('Nome do template é obrigatório')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/ai/create-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          templateData: {
            name: templateName,
            fields: editedFields,
            previewData: analysis?.previewData || {},
            userDescription,
          },
          saveAsReusable,
          applyToDocument: true,
        }),
      })

      if (!res.ok) throw new Error('Erro ao criar template')

      toast.success('Template criado com sucesso!')
      handleClose()
      onTemplateCreated?.()
    } catch (error) {
      toast.error('Erro ao criar template')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <Sparkles className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Criar Template com IA</h2>
              <p className="text-sm opacity-90">Passo {step} de 4</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-white hover:bg-white/20 p-2 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Descrição */}
          {step === 1 && (
            <div className="space-y-4">
              <Label>O que você deseja extrair?</Label>
              <Textarea
                value={userDescription}
                onChange={(e) => setUserDescription(e.target.value)}
                placeholder="Ex: Extrair número da nota fiscal, data, valor total, fornecedor"
                rows={5}
              />
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 2 && analysis && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200">
                <p className="font-semibold text-green-900 dark:text-green-100">
                  ✓ {editedFields.length} campos identificados ({(analysis.confidence * 100).toFixed(0)}% confiança)
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Campos</h3>
                  <div className="space-y-2">
                    {editedFields.map((f, i) => (
                      <div key={i} className="p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                        <div className="font-medium">{f.label}</div>
                        <div className="text-xs text-gray-500">{f.name} ({f.type})</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Dados Extraídos</h3>
                  <div className="bg-gray-900 p-3 rounded text-xs font-mono text-green-400 max-h-64 overflow-auto">
                    {Object.entries(analysis.previewData).map(([k, v]) => (
                      <div key={k}>{k}: "{String(v)}"</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Editar */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <h3 className="font-medium">Editar Campos</h3>
                <Button
                  size="sm"
                  onClick={() =>
                    setEditedFields([...editedFields, { name: 'novo', type: 'text', label: 'Novo', description: '', required: false }])
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-3 max-h-96 overflow-auto">
                {editedFields.map((field, i) => (
                  <Card key={i}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between">
                        <Badge>#{i + 1}</Badge>
                        <button
                          onClick={() => setEditedFields(editedFields.filter((_, idx) => idx !== i))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Nome</Label>
                          <Input
                            value={field.name}
                            onChange={(e) => {
                              const newFields = [...editedFields]
                              newFields[i] = { ...newFields[i], name: e.target.value }
                              setEditedFields(newFields)
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Rótulo</Label>
                          <Input
                            value={field.label}
                            onChange={(e) => {
                              const newFields = [...editedFields]
                              newFields[i] = { ...newFields[i], label: e.target.value }
                              setEditedFields(newFields)
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={field.type}
                          onChange={(e) => {
                            const newFields = [...editedFields]
                            newFields[i] = { ...newFields[i], type: e.target.value as any }
                            setEditedFields(newFields)
                          }}
                          className="border rounded px-3 py-2"
                        >
                          <option value="text">Texto</option>
                          <option value="number">Número</option>
                          <option value="date">Data</option>
                          <option value="boolean">Boolean</option>
                        </select>

                        <label className="flex items-center gap-2">
                          <Checkbox
                            checked={field.required}
                            onCheckedChange={(checked) => {
                              const newFields = [...editedFields]
                              newFields[i] = { ...newFields[i], required: checked === true }
                              setEditedFields(newFields)
                            }}
                          />
                          <span className="text-sm">Obrigatório</span>
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Finalizar */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <Label>Nome do Template</Label>
                <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
              </div>

              <label className="flex items-center gap-3 p-4 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                <Checkbox checked={saveAsReusable} onCheckedChange={(c) => setSaveAsReusable(c === true)} />
                <div>
                  <p className="font-medium">Salvar como Template Reutilizável</p>
                  <p className="text-sm text-gray-500">Ficará disponível para outros documentos</p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-between bg-gray-50 dark:bg-gray-900">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>

          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            )}

            {step === 1 && (
              <Button onClick={handleAnalyze} disabled={analyzing || !userDescription.trim()}>
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analisar com IA
                  </>
                )}
              </Button>
            )}

            {step === 2 && (
              <Button onClick={() => setStep(3)}>
                Continuar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {step === 3 && (
              <Button onClick={() => setStep(4)}>
                Finalizar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {step === 4 && (
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Criar Template
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

