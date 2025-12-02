'use client'

import { useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useSpedStream } from '@/hooks/use-sped-stream'
import { Database, CheckCircle, XCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface SpedProcessingProgressProps {
  jobId: string | null
  fileName?: string
  onComplete?: () => void
}

export function SpedProcessingProgress({ jobId, fileName, onComplete }: SpedProcessingProgressProps) {
  const { 
    status, 
    progress, 
    currentStep,
    totalSteps,
    message,
    error, 
    stats,
    jobComplete 
  } = useSpedStream(jobId)
  
  const prevJobCompleteRef = useRef(false)

  // Notificar quando o job é concluído ou há erros
  useEffect(() => {
    if (jobComplete && !prevJobCompleteRef.current) {
      prevJobCompleteRef.current = true
      
      if (onComplete) {
        onComplete()
      }
      
      if (error) {
        toast.error(`Erro ao processar SPED: ${error}`, { duration: 6000 })
      } else {
        toast.success(
          `SPED processado com sucesso! ${stats?.entries || 0} lançamentos importados`,
          { duration: 5000 }
        )
      }
    }
  }, [jobComplete, error, stats, onComplete])

  if (!jobId || status === 'idle') {
    return null
  }

  const statusIcon = {
    connecting: Clock,
    connected: Database,
    completed: CheckCircle,
    error: XCircle,
  }[status] || Clock

  const StatusIcon = statusIcon

  return (
    <Card className="border-emerald-500/30">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${
              status === 'completed' ? 'text-green-500' :
              status === 'error' ? 'text-red-500' :
              'text-orange-500'
            }`} />
            {jobComplete
              ? error
                ? 'Processamento Falhou'
                : 'Processamento Concluído'
              : 'Processando SPED'}
          </span>
          {jobComplete && (
            <Badge variant={error ? 'destructive' : 'default'}>
              {error ? 'Erro' : 'Sucesso'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nome do arquivo */}
        {fileName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Database className="h-4 w-4" />
            <span className="truncate">{fileName}</span>
          </div>
        )}

        {/* Barra de progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso Geral</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress 
            value={progress} 
            className="h-3"
          />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Etapa {currentStep} de {totalSteps}</span>
            {message && <span>• {message}</span>}
          </div>
        </div>

        {/* Estatísticas do parse */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <div>
                <p className="text-xs text-muted-foreground">Contas</p>
                <p className="text-sm font-medium">{stats.accounts?.toLocaleString('pt-BR') || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Saldos</p>
                <p className="text-sm font-medium">{stats.balances?.toLocaleString('pt-BR') || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Lançamentos</p>
                <p className="text-sm font-medium">{stats.entries?.toLocaleString('pt-BR') || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">Partidas</p>
                <p className="text-sm font-medium">{stats.items?.toLocaleString('pt-BR') || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Erro no processamento</p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Status de conexão */}
        {status === 'connecting' && (
          <p className="text-sm text-muted-foreground animate-pulse">
            Conectando ao servidor de processamento...
          </p>
        )}
      </CardContent>
    </Card>
  )
}

