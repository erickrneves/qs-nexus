'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useProcessStream } from '@/hooks/use-process-stream'
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react'

interface ProcessingProgressProps {
  jobId: string | null
}

const statusIcons = {
  pending: Clock,
  processing: Clock,
  completed: CheckCircle,
  failed: XCircle,
}

const statusColors = {
  pending: 'bg-yellow-500',
  processing: 'bg-orange-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
}

export function ProcessingProgress({ jobId }: ProcessingProgressProps) {
  const { status, files, error } = useProcessStream(jobId)

  if (!jobId || status === 'idle') {
    return null
  }

  const fileArray = Object.values(files)
  const totalProgress =
    fileArray.length > 0
      ? fileArray.reduce((acc: number, file: any) => acc + (file.progress || 0), 0) /
        fileArray.length
      : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Processamento em Andamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso Geral</span>
            <span>{Math.round(totalProgress)}%</span>
          </div>
          <Progress value={totalProgress} />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {fileArray.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aguardando início do processamento...</p>
          ) : (
            fileArray.map((file: any, index: number) => {
              const StatusIcon = statusIcons[file.status as keyof typeof statusIcons] || Clock
              return (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <StatusIcon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{file.fileName}</p>
                      {file.currentStep && file.totalSteps && (
                        <p className="text-xs text-muted-foreground">
                          Etapa {file.currentStep} de {file.totalSteps}
                        </p>
                      )}
                      {file.progress !== undefined && (
                        <Progress value={file.progress} className="mt-2 h-1" />
                      )}
                    </div>
                  </div>
                  <Badge
                    className={
                      statusColors[file.status as keyof typeof statusColors] || 'bg-gray-500'
                    }
                    variant="default"
                  >
                    {file.status}
                  </Badge>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
