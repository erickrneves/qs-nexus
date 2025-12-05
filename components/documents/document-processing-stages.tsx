'use client'

import { CheckCircle2, Circle, Loader2, XCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface ProcessingStage {
  id: string
  name: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped'
  startedAt?: string
  completedAt?: string
  errorMessage?: string
  details?: string
}

interface Props {
  stages: ProcessingStage[]
  overallStatus: 'pending' | 'processing' | 'completed' | 'failed'
  className?: string
}

const STAGE_DEFINITIONS = {
  upload: {
    name: '1. Upload',
    description: 'Arquivo recebido e salvo no sistema',
    icon: '📤',
  },
  conversion: {
    name: '2. Conversão',
    description: 'Transformação de PDF/DOCX em formato Markdown',
    icon: '🔄',
  },
  classification: {
    name: '3. Classificação Inteligente',
    description: 'IA extrai dados estruturados usando o Template de Normalização',
    icon: '🤖',
  },
  fragmentation: {
    name: '4. Fragmentação',
    description: 'Divisão do documento em pedaços menores (chunks)',
    icon: '✂️',
  },
  vectorization: {
    name: '5. Vetorização',
    description: 'Geração de embeddings para busca semântica',
    icon: '🧮',
  },
  indexing: {
    name: '6. Indexação',
    description: 'Armazenamento final no banco de dados',
    icon: '💾',
  },
}

export function DocumentProcessingStages({ stages, overallStatus, className }: Props) {
  const getStageIcon = (status: ProcessingStage['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-6 w-6 text-green-500" />
      case 'in_progress':
        return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-500" />
      case 'skipped':
        return <Circle className="h-6 w-6 text-gray-300" />
      default:
        return <Circle className="h-6 w-6 text-gray-300" />
    }
  }

  const getStatusColor = (status: ProcessingStage['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50'
      case 'in_progress':
        return 'border-blue-200 bg-blue-50'
      case 'failed':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getOverallStatusBadge = () => {
    switch (overallStatus) {
      case 'completed':
        return <Badge className="bg-green-500">✓ Processado com Sucesso</Badge>
      case 'processing':
        return <Badge className="bg-blue-500">⏳ Processando...</Badge>
      case 'failed':
        return <Badge variant="destructive">✗ Erro no Processamento</Badge>
      default:
        return <Badge variant="outline">⏸ Pendente</Badge>
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Fluxo de Processamento</CardTitle>
            <CardDescription>
              Acompanhe cada etapa do processamento do documento
            </CardDescription>
          </div>
          {getOverallStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stages.map((stage, index) => {
            const definition = STAGE_DEFINITIONS[stage.id as keyof typeof STAGE_DEFINITIONS]
            const isLast = index === stages.length - 1

            return (
              <div key={stage.id} className="relative">
                {/* Linha conectora */}
                {!isLast && (
                  <div
                    className={cn(
                      'absolute left-3 top-12 bottom-0 w-0.5',
                      stage.status === 'completed'
                        ? 'bg-green-300'
                        : stage.status === 'in_progress'
                        ? 'bg-blue-300'
                        : 'bg-gray-200'
                    )}
                  />
                )}

                {/* Card do estágio */}
                <div
                  className={cn(
                    'border rounded-lg p-4 transition-all',
                    getStatusColor(stage.status),
                    stage.status === 'in_progress' && 'shadow-md'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Ícone de status */}
                    <div className="flex-shrink-0 mt-0.5">{getStageIcon(stage.status)}</div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{definition?.icon}</span>
                        <h4 className="font-semibold text-base">{definition?.name || stage.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {definition?.description || stage.description}
                      </p>

                      {/* Detalhes adicionais */}
                      {stage.details && stage.status === 'in_progress' && (
                        <p className="text-xs text-blue-700 bg-blue-100 rounded px-2 py-1 inline-block">
                          {stage.details}
                        </p>
                      )}

                      {/* Mensagem de erro */}
                      {stage.status === 'failed' && stage.errorMessage && (
                        <div className="flex items-start gap-2 mt-2 p-2 bg-red-100 border border-red-200 rounded">
                          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-red-700">{stage.errorMessage}</p>
                        </div>
                      )}

                      {/* Timestamps */}
                      {stage.completedAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          Concluído em {new Date(stage.completedAt).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

