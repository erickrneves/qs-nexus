'use client'

import { useState, useEffect } from 'react'
import { SettingsLayout } from '@/components/settings/settings-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ModelSelector } from '@/components/settings/model-selector'
import { CodeEditor } from '@/components/settings/code-editor'
import { SchemaPromptPreview } from '@/components/settings/schema-prompt-preview'
import { toast } from 'react-hot-toast'
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ClassificationConfig {
  id: string
  name: string
  systemPrompt: string
  modelProvider: 'openai' | 'google'
  modelName: string
  maxInputTokens: number
  maxOutputTokens: number
  extractionFunctionCode?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const DEFAULT_EXTRACTION_FUNCTION = `function extractContent(markdown) {
  const lines = markdown.split('\\n');
  const extracted = [];
  
  // Primeiras 3000 caracteres
  let headerContent = '';
  let charCount = 0;
  for (let i = 0; i < lines.length && charCount < 3000; i++) {
    const line = lines[i];
    charCount += line.length + 1;
    headerContent += line + '\\n';
  }
  extracted.push(headerContent.trim());
  
  // Estrutura de seções
  const sectionHeaders = [];
  for (const line of lines) {
    if (line.trim().match(/^#{1,3}\\s+/)) {
      sectionHeaders.push(line.trim());
    }
  }
  extracted.push('\\n## Estrutura:\\n' + sectionHeaders.join('\\n'));
  
  // Últimas 3000 caracteres
  let footerContent = '';
  charCount = 0;
  for (let i = lines.length - 1; i >= 0 && charCount < 3000; i--) {
    const line = lines[i];
    charCount += line.length + 1;
    footerContent = line + '\\n' + footerContent;
  }
  extracted.push(footerContent.trim());
  
  return extracted.join('\\n\\n---\\n\\n');
}`

export default function ClassificationSettingsPage() {
  const [configs, setConfigs] = useState<ClassificationConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    systemPrompt: '',
    modelProvider: 'openai' as 'openai' | 'google',
    modelName: 'gpt-4o-mini',
    maxInputTokens: 128000,
    maxOutputTokens: 16384,
    extractionFunctionCode: '',
    isActive: false,
  })

  useEffect(() => {
    fetchConfigs()
  }, [])

  async function fetchConfigs() {
    try {
      setIsLoading(true)
      const response = await fetch('/api/classification/configs')
      if (!response.ok) throw new Error('Erro ao carregar configurações')
      const data = await response.json()
      setConfigs(data.configs)
    } catch (error) {
      toast.error('Erro ao carregar configurações')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const url = editingId
        ? `/api/classification/configs/${editingId}`
        : '/api/classification/configs'
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao salvar configuração')
      }

      toast.success(editingId ? 'Configuração atualizada' : 'Configuração criada')
      resetForm()
      fetchConfigs()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar')
      console.error(error)
    }
  }

  function resetForm() {
    setEditingId(null)
    setFormData({
      name: '',
      systemPrompt: '',
      modelProvider: 'openai',
      modelName: 'gpt-4o-mini',
      maxInputTokens: 128000,
      maxOutputTokens: 16384,
      extractionFunctionCode: '',
      isActive: false,
    })
  }

  function handleEdit(config: ClassificationConfig) {
    setEditingId(config.id)
    setFormData({
      name: config.name,
      systemPrompt: config.systemPrompt,
      modelProvider: config.modelProvider,
      modelName: config.modelName,
      maxInputTokens: config.maxInputTokens,
      maxOutputTokens: config.maxOutputTokens,
      extractionFunctionCode: config.extractionFunctionCode || '',
      isActive: config.isActive,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id: string) {
    try {
      const response = await fetch(`/api/classification/configs/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Erro ao deletar')
      toast.success('Configuração deletada')
      fetchConfigs()
      setShowDeleteDialog(null)
    } catch (error) {
      toast.error('Erro ao deletar configuração')
      console.error(error)
    }
  }

  const activeConfig = configs.find(c => c.isActive)

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Configurações de Classificação</h2>
          <p className="text-muted-foreground">
            Gerencie modelos de IA, prompts e funções de extração para classificação de documentos
          </p>
        </div>

        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Editar Configuração' : 'Nova Configuração'}</CardTitle>
            <CardDescription>
              {editingId
                ? 'Atualize os campos abaixo e salve as alterações'
                : 'Crie uma nova configuração de classificação'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Configuração</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Classificação Padrão"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Textarea
                  id="systemPrompt"
                  value={formData.systemPrompt}
                  onChange={e => setFormData({ ...formData, systemPrompt: e.target.value })}
                  placeholder="Instruções para o modelo de IA..."
                  rows={8}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  O prompt do schema será automaticamente adicionado ao final deste prompt durante a classificação.
                </p>
              </div>

              <SchemaPromptPreview />

              <ModelSelector
                provider={formData.modelProvider}
                modelName={formData.modelName}
                onProviderChange={provider => {
                  setFormData({
                    ...formData,
                    modelProvider: provider,
                    modelName: provider === 'openai' ? 'gpt-4o-mini' : 'gemini-2.5-flash',
                  })
                }}
                onModelChange={modelName => setFormData({ ...formData, modelName })}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxInputTokens">Max Input Tokens</Label>
                  <Input
                    id="maxInputTokens"
                    type="number"
                    value={formData.maxInputTokens}
                    onChange={e =>
                      setFormData({ ...formData, maxInputTokens: parseInt(e.target.value) })
                    }
                    required
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxOutputTokens">Max Output Tokens</Label>
                  <Input
                    id="maxOutputTokens"
                    type="number"
                    value={formData.maxOutputTokens}
                    onChange={e =>
                      setFormData({ ...formData, maxOutputTokens: parseInt(e.target.value) })
                    }
                    required
                    min={1}
                  />
                </div>
              </div>

              <CodeEditor
                label="Função de Extração (JavaScript)"
                value={formData.extractionFunctionCode}
                onChange={value => setFormData({ ...formData, extractionFunctionCode: value })}
                placeholder="function extractContent(markdown) { ... }"
                description="Função JavaScript customizada para extrair conteúdo relevante. Deixe vazio para usar a função padrão."
                defaultCode={DEFAULT_EXTRACTION_FUNCTION}
                showDefault={true}
                rows={10}
              />

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={checked =>
                    setFormData({ ...formData, isActive: checked === true })
                  }
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Marcar como configuração ativa
                </Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingId ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Configuração
                    </>
                  )}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Lista de Configurações */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações Existentes</CardTitle>
            <CardDescription>
              {activeConfig
                ? `Configuração ativa: ${activeConfig.name}`
                : 'Nenhuma configuração ativa'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : configs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma configuração criada ainda
              </div>
            ) : (
              <div className="space-y-2">
                {configs.map(config => (
                  <div
                    key={config.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{config.name}</h3>
                        {config.isActive && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                            Ativa
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {config.modelProvider} / {config.modelName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tokens: {config.maxInputTokens.toLocaleString()} input /{' '}
                        {config.maxOutputTokens.toLocaleString()} output
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(config)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteDialog(config.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Confirmação de Delete */}
        <AlertDialog open={showDeleteDialog !== null} onOpenChange={() => setShowDeleteDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja deletar esta configuração? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => showDeleteDialog && handleDelete(showDeleteDialog)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SettingsLayout>
  )
}

