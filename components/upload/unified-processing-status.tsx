'use client'

/**
 * Dashboard Unificado de Status de Processamento
 * Exibe progresso de todos os tipos de arquivos: Documentos, SPED e CSV
 */

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Database, Table, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'

export interface ProcessingFile {
  id: string
  fileName: string
  fileType: 'document' | 'sped' | 'csv'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  currentStep?: number
  totalSteps?: number
  progress: number
  message?: string
  error?: string
  startedAt: Date
  completedAt?: Date
}

interface UnifiedProcessingStatusProps {
  files?: ProcessingFile[]
  onRefresh?: () => void
}

const FILE_TYPE_CONFIG = {
  document: {
    icon: FileText,
    label: 'Documentos',
    color: 'text-blue-500',
    steps: [
      'Upload',
      'Conversão para Markdown',
      'Filtro de tamanho',
      'Classificação IA',
      'Geração de chunks',
      'Geração de embeddings',
      'Salvamento'
    ]
  },
  sped: {
    icon: Database,
    label: 'SPED',
    color: 'text-green-500',
    steps: [
      'Upload',
      'Parse do arquivo',
      'Salvamento em BD',
      'Classificação IA',
      'Chunking contábil',
      'Geração de embeddings',
      'Finalização'
    ]
  },
  csv: {
    icon: Table,
    label: 'CSV',
    color: 'text-purple-500',
    steps: [
      'Upload',
      'Parse do arquivo',
      'Salvamento em BD',
      'Análise de estrutura',
      'Classificação IA',
      'Geração de chunks',
      'Geração de embeddings'
    ]
  }
}

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    label: 'Aguardando',
    color: 'text-gray-500',
    badgeVariant: 'secondary' as const
  },
  processing: {
    icon: Loader2,
    label: 'Processando',
    color: 'text-blue-500',
    badgeVariant: 'default' as const,
    animate: true
  },
  completed: {
    icon: CheckCircle,
    label: 'Concluído',
    color: 'text-green-500',
    badgeVariant: 'default' as const
  },
  failed: {
    icon: XCircle,
    label: 'Falhou',
    color: 'text-red-500',
    badgeVariant: 'destructive' as const
  }
}

function FileProcessingCard({ file }: { file: ProcessingFile }) {
  const typeConfig = FILE_TYPE_CONFIG[file.fileType]
  const statusConfig = STATUS_CONFIG[file.status]
  
  const TypeIcon = typeConfig.icon
  const StatusIcon = statusConfig.icon

  const duration = file.completedAt 
    ? Math.round((file.completedAt.getTime() - file.startedAt.getTime()) / 1000)
    : Math.round((Date.now() - file.startedAt.getTime()) / 1000)

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <TypeIcon className={`h-4 w-4 ${typeConfig.color} shrink-0`} />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm font-medium truncate">
                {file.fileName}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {typeConfig.label}
              </p>
            </div>
          </div>
          <Badge variant={statusConfig.badgeVariant} className="shrink-0">
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Status Icon */}
        <div className="flex items-center gap-2">
          <StatusIcon 
            className={`h-4 w-4 ${statusConfig.color} ${statusConfig.animate ? 'animate-spin' : ''}`} 
          />
          <span className="text-sm text-muted-foreground">
            {file.message || statusConfig.label}
          </span>
        </div>

        {/* Progress Bar */}
        {file.status === 'processing' && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>
                {file.currentStep && file.totalSteps && 
                  `Etapa ${file.currentStep}/${file.totalSteps}`
                }
              </span>
              <span className="font-medium">{Math.round(file.progress)}%</span>
            </div>
            <Progress value={file.progress} className="h-2" />
          </div>
        )}

        {/* Steps Progress */}
        {file.currentStep && file.totalSteps && (
          <div className="space-y-1">
            {typeConfig.steps.map((step, idx) => {
              const stepNum = idx + 1
              const isCompleted = stepNum < (file.currentStep || 0)
              const isCurrent = stepNum === file.currentStep
              const isPending = stepNum > (file.currentStep || 0)

              return (
                <div 
                  key={idx}
                  className={`flex items-center gap-2 text-xs ${
                    isCompleted ? 'text-green-600' :
                    isCurrent ? 'text-blue-600 font-medium' :
                    'text-gray-400'
                  }`}
                >
                  {isCompleted && <CheckCircle className="h-3 w-3" />}
                  {isCurrent && <Loader2 className="h-3 w-3 animate-spin" />}
                  {isPending && <Clock className="h-3 w-3" />}
                  <span>{step}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Error Message */}
        {file.error && (
          <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded">
            {file.error}
          </div>
        )}

        {/* Duration */}
        <div className="text-xs text-muted-foreground">
          Tempo: {formatDuration(duration)}
        </div>
      </CardContent>
    </Card>
  )
}

export function UnifiedProcessingStatus({ 
  files = [], 
  onRefresh 
}: UnifiedProcessingStatusProps) {
  const [activeTab, setActiveTab] = useState<string>('all')

  // Auto-refresh a cada 2 segundos quando há arquivos em processamento
  useEffect(() => {
    const hasProcessing = files.some(f => f.status === 'processing')
    if (hasProcessing && onRefresh) {
      const interval = setInterval(onRefresh, 2000)
      return () => clearInterval(interval)
    }
  }, [files, onRefresh])

  // Filtrar arquivos por tipo
  const documentFiles = files.filter(f => f.fileType === 'document')
  const spedFiles = files.filter(f => f.fileType === 'sped')
  const csvFiles = files.filter(f => f.fileType === 'csv')

  // Estatísticas gerais
  const stats = {
    total: files.length,
    processing: files.filter(f => f.status === 'processing').length,
    completed: files.filter(f => f.status === 'completed').length,
    failed: files.filter(f => f.status === 'failed').length,
    pending: files.filter(f => f.status === 'pending').length
  }

  if (files.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          <p>Nenhum arquivo em processamento</p>
        </CardContent>
      </Card>
    )
  }

  const renderFileList = (fileList: ProcessingFile[]) => {
    if (fileList.length === 0) {
      return (
        <div className="text-center py-6 text-muted-foreground text-sm">
          Nenhum arquivo nesta categoria
        </div>
      )
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {fileList.map(file => (
          <FileProcessingCard key={file.id} file={file} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header com estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle>Status de Processamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{stats.processing}</div>
              <div className="text-xs text-muted-foreground">Processando</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
              <div className="text-xs text-muted-foreground">Concluídos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
              <div className="text-xs text-muted-foreground">Falhados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-500">{stats.pending}</div>
              <div className="text-xs text-muted-foreground">Aguardando</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs por tipo de arquivo */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            Todos ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="document">
            <FileText className="h-4 w-4 mr-2" />
            Documentos ({documentFiles.length})
          </TabsTrigger>
          <TabsTrigger value="sped">
            <Database className="h-4 w-4 mr-2" />
            SPED ({spedFiles.length})
          </TabsTrigger>
          <TabsTrigger value="csv">
            <Table className="h-4 w-4 mr-2" />
            CSV ({csvFiles.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {renderFileList(files)}
        </TabsContent>

        <TabsContent value="document" className="mt-4">
          {renderFileList(documentFiles)}
        </TabsContent>

        <TabsContent value="sped" className="mt-4">
          {renderFileList(spedFiles)}
        </TabsContent>

        <TabsContent value="csv" className="mt-4">
          {renderFileList(csvFiles)}
        </TabsContent>
      </Tabs>
    </div>
  )
}

