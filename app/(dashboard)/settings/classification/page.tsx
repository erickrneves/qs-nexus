'use client'

import { useState, useEffect } from 'react'
import { SettingsLayout } from '@/components/settings/settings-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ClassificationForm } from '@/components/settings/classification-form'
import { toast } from 'react-hot-toast'
import { Plus, Trash2, Edit2, FileCode, Zap, Settings2, FileText, Database } from 'lucide-react'
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

type DocumentType = 'juridico' | 'contabil' | 'geral'

interface ClassificationConfig {
  id: string
  name: string
  documentType: DocumentType
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

export default function ClassificationSettingsPage() {
  const [configs, setConfigs] = useState<ClassificationConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<ClassificationConfig | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<DocumentType>('juridico')

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

  function handleNew() {
    setEditingConfig(null)
    setIsDrawerOpen(true)
  }

  function handleEdit(config: ClassificationConfig) {
    setEditingConfig(config)
    setIsDrawerOpen(true)
  }

  function handleCloseDrawer() {
    setIsDrawerOpen(false)
    setEditingConfig(null)
  }

  async function handleSubmit(formData: {
    name: string
    documentType: DocumentType
    systemPrompt: string
    modelProvider: 'openai' | 'google'
    modelName: string
    maxInputTokens: number
    maxOutputTokens: number
    extractionFunctionCode?: string
    isActive: boolean
  }) {
    try {
      setIsSubmitting(true)
      const url = editingConfig
        ? `/api/classification/configs/${editingConfig.id}`
        : '/api/classification/configs'
      const method = editingConfig ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao salvar configuração')
      }

      toast.success(editingConfig ? 'Configuração atualizada' : 'Configuração criada')
      handleCloseDrawer()
      fetchConfigs()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
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

  const juridicoConfigs = configs.filter(c => c.documentType === 'juridico')
  const contabilConfigs = configs.filter(c => c.documentType === 'contabil')
  const geralConfigs = configs.filter(c => c.documentType === 'geral')

  const activeJuridicoConfig = juridicoConfigs.find(c => c.isActive)
  const activeContabilConfig = contabilConfigs.find(c => c.isActive)

  function renderConfigCards(filteredConfigs: ClassificationConfig[], documentType: DocumentType) {
    const activeConfig = filteredConfigs.find(c => c.isActive)
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Configurações Ativas</h3>
            <p className="text-sm text-muted-foreground">
              Configuração utilizada para classificar documentos deste tipo
            </p>
          </div>
          <Button onClick={() => {
            setEditingConfig(null)
            setActiveTab(documentType)
            setIsDrawerOpen(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Configuração
          </Button>
        </div>

        {activeConfig && (
          <Card className="border-primary">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{activeConfig.name}</CardTitle>
                    <Badge variant="default" className="bg-green-500">
                      <Zap className="h-3 w-3 mr-1" />
                      Ativa
                    </Badge>
                  </div>
                  <CardDescription>
                    Modelo: {activeConfig.modelProvider === 'openai' ? 'OpenAI' : 'Google'} - {activeConfig.modelName}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(activeConfig)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Tokens de Entrada:</span>
                  <span className="ml-2 font-medium">{activeConfig.maxInputTokens.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tokens de Saída:</span>
                  <span className="ml-2 font-medium">{activeConfig.maxOutputTokens.toLocaleString()}</span>
                </div>
              </div>
              {activeConfig.extractionFunctionCode && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileCode className="h-4 w-4" />
                  <span>Função de extração customizada</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {filteredConfigs.filter(c => !c.isActive).length > 0 && (
          <>
            <div className="pt-4">
              <h3 className="text-lg font-medium mb-3">Outras Configurações</h3>
            </div>
            <div className="grid gap-4">
              {filteredConfigs.filter(c => !c.isActive).map(config => (
                <Card key={config.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{config.name}</CardTitle>
                        <CardDescription>
                          {config.modelProvider === 'openai' ? 'OpenAI' : 'Google'} - {config.modelName}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(config)}>
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
                  </CardHeader>
                </Card>
              ))}
            </div>
          </>
        )}

        {filteredConfigs.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Settings2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Nenhuma configuração criada</p>
              <p className="text-sm text-muted-foreground mb-4">
                Crie sua primeira configuração para este tipo de documento
              </p>
              <Button onClick={() => {
                setEditingConfig(null)
                setActiveTab(documentType)
                setIsDrawerOpen(true)
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Configuração
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <SettingsLayout>
      <div className="flex flex-1 flex-col space-y-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DocumentType)} className="flex-1 flex flex-col">
          <TabsList className="grid w-full max-w-lg grid-cols-2 bg-muted p-1" style={{ backgroundColor: 'hsl(var(--muted))' }}>
            <TabsTrigger 
              value="juridico" 
              className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow"
              style={{ ['--tab-active-bg' as string]: 'hsl(var(--card))' }}
            >
              <FileText className="h-4 w-4" />
              Documentos Jurídicos
            </TabsTrigger>
            <TabsTrigger 
              value="contabil" 
              className="flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow"
              style={{ ['--tab-active-bg' as string]: 'hsl(var(--card))' }}
            >
              <Database className="h-4 w-4" />
              Dados Contábeis (SPED)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="juridico" className="mt-6 flex-1">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              renderConfigCards(juridicoConfigs, 'juridico')
            )}
          </TabsContent>

          <TabsContent value="contabil" className="mt-6 flex-1">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              renderConfigCards(contabilConfigs, 'contabil')
            )}
          </TabsContent>
        </Tabs>

        {/* Drawer para Criar/Editar */}
        <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <SheetContent side="right" className="sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>
                {editingConfig ? 'Editar Configuração' : 'Nova Configuração'}
              </SheetTitle>
              <SheetDescription>
                {editingConfig
                  ? 'Atualize os campos abaixo e salve as alterações'
                  : 'Crie uma nova configuração de classificação'}
              </SheetDescription>
            </SheetHeader>
            <ClassificationForm
              config={editingConfig || undefined}
              defaultDocumentType={activeTab}
              onSubmit={handleSubmit}
              onCancel={handleCloseDrawer}
              isLoading={isSubmitting}
            />
          </SheetContent>
        </Sheet>

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
