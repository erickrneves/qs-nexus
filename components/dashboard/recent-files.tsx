'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { FileText } from 'lucide-react'

interface RecentFile {
  id: string
  fileName: string
  status: string
  wordsCount: number | null
  processedAt: Date | null
  updatedAt: Date | null
}

interface RecentFilesProps {
  files: RecentFile[]
}

const statusColors: Record<string, string> = {
  completed: 'bg-green-500',
  pending: 'bg-yellow-500',
  processing: 'bg-orange-500',
  failed: 'bg-red-500',
  rejected: 'bg-gray-500',
}

export function RecentFiles({ files }: RecentFilesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Arquivos Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {files.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum arquivo processado ainda</p>
          ) : (
            files.map(file => (
              <Link
                key={file.id}
                href={`/files/${file.id}`}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{file.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.wordsCount ? `${file.wordsCount} palavras` : 'Sem contagem'}
                    </p>
                  </div>
                </div>
                <Badge className={statusColors[file.status] || 'bg-gray-500'} variant="default">
                  {file.status}
                </Badge>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
