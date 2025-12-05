'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import { useOrganization } from '@/lib/contexts/organization-context'
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'

interface Template {
  id: string
  name: string
  description: string | null
  isActive: boolean
}

export default function UploadPage() {
  const { currentOrg } = useOrganization()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Carregar templates quando arquivos forem selecionados
  const loadTemplates = async () => {
    if (!currentOrg?.id) return
    
    setLoadingTemplates(true)
    try {
      const res = await fetch(`/api/templates?organizationId=${currentOrg.id}`)
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates.filter((t: Template) => t.isActive))
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    } finally {
      setLoadingTemplates(false)
    }
  }

  // Manipular seleção de arquivos
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setSelectedFiles(files)
      setSelectedTemplateId(null)
      await loadTemplates()
    }
  }

  // Drag & Drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setSelectedFiles(files)
      setSelectedTemplateId(null)
      await loadTemplates()
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Remover arquivo
  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    if (newFiles.length === 0) {
      setSelectedTemplateId(null)
      setTemplates([])
    }
  }

  // Upload
  const handleUpload = async () => {
    if (!selectedFiles.length || !selectedTemplateId || !currentOrg?.id) {
      toast.error('Complete todos os passos')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      selectedFiles.forEach(file => formData.append('files', file))
      formData.append('organizationId', currentOrg.id)
      formData.append('templateId', selectedTemplateId)

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao fazer upload')
      }

      const data = await res.json()
      toast.success(`${data.documents.length} documento(s) enviado(s)!`)
      
      // Limpar e redirecionar
      setSelectedFiles([])
      setSelectedTemplateId(null)
      setTemplates([])
      
      setTimeout(() => {
        window.location.href = '/documentos'
      }, 1500)
      
    } catch (error) {
      console.error('Erro:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao processar')
    } finally {
      setIsUploading(false)
    }
  }

  if (!currentOrg) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Selecione uma organização no menu lateral
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          Upload de Documentos
        </h1>
        <p className="text-muted-foreground">
          Processo em 3 passos: Selecione → Escolha Template → Envie
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo Upload</CardTitle>
          <CardDescription>
            Envie documentos PDF, Word ou TXT para normalização
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* PASSO 1: Selecionar Arquivos */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                1
              </div>
              <h3 className="font-semibold">Selecionar Arquivos</h3>
            </div>
            
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Arraste arquivos aqui ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, DOCX, DOC, TXT (máx. 20 arquivos)
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Lista de arquivos selecionados */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{selectedFiles.length} arquivo(s) selecionado(s)</span>
                </div>
                <div className="space-y-1">
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                      <span className="truncate">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(i)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* PASSO 2: Escolher Template */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3 pt-6 border-t">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  2
                </div>
                <h3 className="font-semibold">Escolher Template de Normalização</h3>
              </div>

              {loadingTemplates ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando templates...
                </div>
              ) : templates.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Nenhum template disponível.{' '}
                  <Link href="/templates/novo" className="text-primary hover:underline">
                    Criar novo template
                  </Link>
                </div>
              ) : (
                <div className="grid gap-2">
                  {templates.map((template) => (
                    <label
                      key={template.id}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTemplateId === template.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="template"
                        value={template.id}
                        checked={selectedTemplateId === template.id}
                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium">{template.name}</div>
                        {template.description && (
                          <div className="text-sm text-muted-foreground">{template.description}</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {selectedTemplateId && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                  <CheckCircle2 className="h-4 w-4" />
                  Template selecionado
                </div>
              )}
            </div>
          )}

          {/* PASSO 3: Enviar */}
          {selectedFiles.length > 0 && selectedTemplateId && (
            <div className="space-y-3 pt-6 border-t">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  3
                </div>
                <h3 className="font-semibold">Enviar e Processar</h3>
              </div>

              <Button
                onClick={handleUpload}
                disabled={isUploading}
                size="lg"
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Enviar {selectedFiles.length} Documento(s)
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Os documentos serão salvos, validados e ficarão prontos para normalização
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
