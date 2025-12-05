'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AssignTemplateDialog } from '@/components/documents/assign-template-dialog'
import { AiTemplateWizard } from '@/components/templates/ai-template-wizard'
import { NormalizedDataPreview } from '@/components/documents/normalized-data-preview'
import { NormalizationPreviewDialog } from '@/components/documents/normalization-preview-dialog'
import { toast } from 'react-hot-toast'
import {
  ArrowLeft,
  FileText,
  Download,
  Trash2,
  Calendar,
  User,
  HardDrive,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react'

interface DocumentData {
  id: string
  fileName: string
  originalFileName: string
  fileSize: number
  fileHash: string
  status: string
  documentType: string
  createdAt: string
  uploadedBy?: { name: string; email: string }
  normalizationTemplateId?: string
  normalizationStatus?: string
  normalizationCompletedAt?: string
  normalizationError?: string
  normalizationProgress?: number
  normalizationDraftData?: any
  normalizationConfidenceScore?: number
  customTableRecordId?: string
  organizationId: string
}

export default function DocumentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const documentId = params?.id as string

  const [documentData, setDocumentData] = useState<DocumentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAssignTemplate, setShowAssignTemplate] = useState(false)
  const [showAiWizard, setShowAiWizard] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionProgress, setExtractionProgress] = useState(0)
  const [extractionMessage, setExtractionMessage] = useState('')
  const [normalizedData, setNormalizedData] = useState<any>(null)
  const [templateFields, setTemplateFields] = useState<any>(null)
  const [loadingNormalizedData, setLoadingNormalizedData] = useState(false)

  useEffect(() => {
    if (documentId) {
      loadDocument()
      // Auto-refresh a cada 3s se estiver processando
      const interval = setInterval(() => {
        if (documentData?.normalizationStatus === 'extracting' || 
            documentData?.normalizationStatus === 'saving' || 
            documentData?.normalizationStatus === 'validating') {
          loadDocument(true)
        }
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [documentId, documentData?.normalizationStatus])

  // Abrir preview automaticamente quando status = draft
  useEffect(() => {
    if (documentData?.normalizationStatus === 'draft') {
      setShowPreviewDialog(true)
    }
  }, [documentData?.normalizationStatus, documentData?.id])

  const loadDocument = async (silent = false) => {
    if (!silent) setLoading(true)

    try {
      const res = await fetch(`/api/documents/${documentId}`)
      if (!res.ok) throw new Error('Documento não encontrado')
      const data = await res.json()
      setDocumentData(data.document)
      
      // Se normalização completa, buscar dados normalizados
      if (data.document.normalizationStatus === 'completed') {
        loadNormalizedData()
      }
      
      // Se status = draft, carregar template fields
      if (data.document.normalizationStatus === 'draft' && data.document.normalizationTemplateId) {
        loadTemplateFields(data.document.normalizationTemplateId)
      }
    } catch (error) {
      console.error('Erro ao carregar documento:', error)
      toast.error('Erro ao carregar documento')
    } finally {
      setLoading(false)
    }
  }

  const loadNormalizedData = async () => {
    setLoadingNormalizedData(true)
    try {
      const res = await fetch(`/api/documents/${documentId}/normalized-data`)
      if (res.ok) {
        const data = await res.json()
        setNormalizedData(data.normalizedData?.data)
        setTemplateFields(data.templateFields)
      }
    } catch (error) {
      console.error('Erro ao carregar dados normalizados:', error)
    } finally {
      setLoadingNormalizedData(false)
    }
  }

  const loadTemplateFields = async (templateId: string) => {
    try {
      console.log('[DEBUG] Carregando template fields para:', templateId)
      const res = await fetch(`/api/templates/${templateId}`)
      if (res.ok) {
        const data = await res.json()
        console.log('[DEBUG] Template fields carregados:', data.template.fields)
        setTemplateFields(data.template.fields || [])
      }
    } catch (error) {
      console.error('Erro ao carregar template fields:', error)
    }
  }

  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}/download`)
      if (!res.ok) throw new Error('Erro ao fazer download')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = documentData?.originalFileName || documentData?.fileName || 'document'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Download iniciado')
    } catch (error) {
      toast.error('Erro ao fazer download')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja deletar este documento?')) return

    try {
      const res = await fetch(`/api/documents/${documentId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Documento deletado')
        router.push('/documentos')
      } else {
        toast.error('Erro ao deletar documento')
      }
    } catch (error) {
      toast.error('Erro ao deletar documento')
    }
  }

  const handleExtractData = async () => {
    if (!documentData?.normalizationTemplateId) {
      toast.error('Selecione um template primeiro')
      return
    }

    setIsExtracting(true)
    setExtractionProgress(0)
    setExtractionMessage('Iniciando extração...')

    try {
      const res = await fetch(`/api/documents/${documentId}/extract-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: documentData.normalizationTemplateId }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao extrair dados')
      }

      const data = await res.json()
      
      toast.success('Dados extraídos! Revise antes de salvar.')
      await loadDocument()
      setShowPreviewDialog(true)
    } catch (error) {
      console.error('Erro:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao extrair dados')
    } finally {
      setIsExtracting(false)
      setExtractionProgress(0)
      setExtractionMessage('')
    }
  }

  const handleApproveDraft = async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}/approve-draft`, { method: 'POST' })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao aprovar')
      }
      
      toast.success('Dados aprovados e salvos!')
      setShowPreviewDialog(false)
      await loadDocument()
    } catch (error) {
      console.error('Erro:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao aprovar dados')
      throw error
    }
  }

  const handleRejectDraft = async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}/reject-draft`, { method: 'POST' })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao rejeitar')
      }
      
      toast.success('Rascunho rejeitado. Você pode reprocessar.')
      setShowPreviewDialog(false)
      await loadDocument()
    } catch (error) {
      console.error('Erro:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao rejeitar')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const getStatusInfo = (status?: string) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, color: 'bg-green-500', text: 'Completo' }
      case 'failed':
        return { icon: XCircle, color: 'bg-red-500', text: 'Falhou' }
      case 'saving':
      case 'validating':
        return { icon: Loader2, color: 'bg-blue-500', text: 'Processando', spin: true }
      default:
        return { icon: AlertCircle, color: 'bg-gray-400', text: 'Pendente' }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando documento...</p>
        </div>
      </div>
    )
  }

  if (!documentData) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <FileText className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Documento não encontrado</h2>
        <Button onClick={() => router.push('/documentos')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    )
  }

  const statusInfo = getStatusInfo(documentData.normalizationStatus)
  const StatusIcon = statusInfo.icon

  return (
    <div className="flex flex-1 flex-col gap-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" onClick={() => router.push('/documentos')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8" />
            {documentData.originalFileName}
          </h1>
          <Badge variant="outline">{documentData.documentType.toUpperCase()}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Deletar
          </Button>
        </div>
      </div>

      {/* Informações Básicas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Tamanho
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatFileSize(documentData.fileSize)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Upload
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {new Date(documentData.createdAt).toLocaleDateString('pt-BR')}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(documentData.createdAt).toLocaleTimeString('pt-BR')}
            </p>
          </CardContent>
        </Card>

        {documentData.uploadedBy && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Enviado por
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{documentData.uploadedBy.name}</p>
              <p className="text-xs text-muted-foreground truncate">{documentData.uploadedBy.email}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Hash</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-mono text-muted-foreground truncate">
              {documentData.fileHash?.substring(0, 16)}...
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Normalização */}
      <Card>
        <CardHeader>
          <CardTitle>Normalização de Dados</CardTitle>
          <CardDescription>
            Processo em 3 etapas: Upload → Template → Processamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Upload - Sempre completo */}
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white shrink-0">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">1. Upload e Pré-validação</h4>
              <p className="text-sm text-muted-foreground">
                Arquivo salvo e validado - Hash: {documentData.fileHash?.substring(0, 16)}...
              </p>
            </div>
          </div>

          {/* Step 2: Template */}
          <div className="flex items-start gap-3">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${
                documentData.normalizationTemplateId ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}
            >
              {documentData.normalizationTemplateId ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">2. Template de Normalização</h4>
                  <p className="text-sm text-muted-foreground">
                    {documentData.normalizationTemplateId
                      ? `Template: ${documentData.normalizationTemplateId.substring(0, 8)}...`
                      : 'Nenhum template selecionado'}
                  </p>
                </div>
                {!documentData.normalizationTemplateId && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowAssignTemplate(true)}>
                      Escolher Template
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setShowAiWizard(true)}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      Criar com IA
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Extração de Dados */}
          <div className="flex items-start gap-3">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${statusInfo.color} text-white`}>
              <StatusIcon className={`h-4 w-4 ${statusInfo.spin ? 'animate-spin' : ''}`} />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">3. Extração de Dados</h4>
              <p className="text-sm text-muted-foreground">
                {documentData.normalizationStatus === 'completed' && documentData.customTableRecordId
                  ? `Dados salvos - ID: ${documentData.customTableRecordId.substring(0, 8)}...`
                  : documentData.normalizationStatus === 'draft'
                  ? `Rascunho pronto - ${documentData.normalizationConfidenceScore}% de confiança`
                  : documentData.normalizationStatus === 'failed'
                  ? `Erro: ${documentData.normalizationError || 'Erro desconhecido'}`
                  : documentData.normalizationStatus === 'extracting'
                  ? `Extraindo dados... ${documentData.normalizationProgress || 0}%`
                  : documentData.normalizationStatus === 'saving' || documentData.normalizationStatus === 'validating'
                  ? 'Processando dados...'
                  : 'Aguardando extração'}
              </p>
              {documentData.normalizationStatus === 'extracting' && documentData.normalizationProgress && (
                <div className="mt-2">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${documentData.normalizationProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {documentData.normalizationProgress}% completo
                  </p>
                </div>
              )}
              {documentData.normalizationCompletedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Concluído em {new Date(documentData.normalizationCompletedAt).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          </div>

          {/* Status e Ações */}
          {documentData.normalizationStatus === 'completed' && (
            <div className="pt-4 border-t">
              <Badge className="bg-green-500 text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                NORMALIZAÇÃO COMPLETA
              </Badge>
            </div>
          )}

          {documentData.normalizationStatus === 'failed' && (
            <div className="pt-4 border-t">
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                ERRO NO PROCESSAMENTO
              </Badge>
              {documentData.normalizationError && (
                <p className="text-sm text-red-600 mt-2">{documentData.normalizationError}</p>
              )}
            </div>
          )}

          {documentData.normalizationStatus === 'pending' && documentData.normalizationTemplateId && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                Template selecionado! Clique abaixo para extrair os dados.
              </p>
              <Button onClick={handleExtractData} disabled={isExtracting} className="w-full">
                {isExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {extractionMessage || 'Extraindo dados...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Extrair Dados do Documento
                  </>
                )}
              </Button>
              {isExtracting && extractionProgress > 0 && (
                <div className="mt-3">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${extractionProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-1">
                    {extractionProgress}%
                  </p>
                </div>
              )}
            </div>
          )}

          {documentData.normalizationStatus === 'draft' && (
            <div className="pt-4 border-t">
              <Badge variant="secondary" className="mb-3">
                <AlertCircle className="h-3 w-3 mr-1" />
                RASCUNHO - Aguardando Revisão
              </Badge>
              <p className="text-sm text-muted-foreground mb-3">
                Os dados foram extraídos (Confiança: {documentData.normalizationConfidenceScore}%). 
                Revise antes de salvar definitivamente.
              </p>
              <Button 
                onClick={() => setShowPreviewDialog(true)} 
                className="w-full" 
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                Revisar Dados Extraídos
              </Button>
            </div>
          )}

          {documentData.normalizationStatus === 'pending' && !documentData.normalizationTemplateId && (
            <div className="pt-4 border-t">
              <Badge variant="secondary">
                <AlertCircle className="h-3 w-3 mr-1" />
                AGUARDANDO TEMPLATE
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Escolha um template primeiro (Etapa 2 acima)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview dos Dados Normalizados */}
      {documentData.normalizationStatus === 'completed' && (
        <div className="space-y-3">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Dados Extraídos do Documento
          </h2>
          {loadingNormalizedData ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <NormalizedDataPreview 
              data={normalizedData} 
              templateFields={templateFields}
            />
          )}
        </div>
      )}

      {/* Dialogs */}
      <AssignTemplateDialog
        open={showAssignTemplate}
        onOpenChange={setShowAssignTemplate}
        documentId={documentData.id}
        organizationId={documentData.organizationId}
        onSuccess={() => loadDocument()}
      />

      <AiTemplateWizard
        open={showAiWizard}
        onClose={() => setShowAiWizard(false)}
        documentId={documentData.id}
        onTemplateCreated={() => loadDocument()}
      />

      {/* Preview Dialog */}
      <NormalizationPreviewDialog
        open={showPreviewDialog}
        onClose={() => setShowPreviewDialog(false)}
        documentId={documentData.id}
        draftData={documentData.normalizationDraftData || {}}
        templateFields={templateFields || []}
        confidenceScore={documentData.normalizationConfidenceScore || 0}
        onApprove={handleApproveDraft}
        onReprocess={handleRejectDraft}
      />
    </div>
  )
}
