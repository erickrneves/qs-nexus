'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'

interface File {
  id: string
  fileName: string
  status: string
  templateArea?: string | null
  templateDocType?: string | null
  updatedAt: Date | null
}

interface FileListProps {
  files: File[]
}

const statusColors: Record<string, string> = {
  completed: 'bg-green-500',
  pending: 'bg-yellow-500',
  processing: 'bg-orange-500',
  failed: 'bg-red-500',
  rejected: 'bg-gray-500',
}

export function FileList({ files }: FileListProps) {
  return (
    <>
      {/* Tabela desktop - escondida em mobile */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Atualizado</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum arquivo encontrado
                </TableCell>
              </TableRow>
            ) : (
              files.map(file => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium">{file.fileName}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[file.status] || 'bg-gray-500'} variant="default">
                      {file.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{file.templateArea || '-'}</TableCell>
                  <TableCell>{file.templateDocType || '-'}</TableCell>
                  <TableCell>
                    {file.updatedAt ? new Date(file.updatedAt).toLocaleDateString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell>
                    <Link href={`/files/${file.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Cards mobile - visível apenas em mobile */}
      <div className="md:hidden space-y-4">
        {files.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Nenhum arquivo encontrado
            </CardContent>
          </Card>
        ) : (
          files.map(file => (
            <Card key={file.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-medium line-clamp-2">
                    {file.fileName}
                  </CardTitle>
                  <Link href={`/files/${file.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge className={statusColors[file.status] || 'bg-gray-500'} variant="default">
                    {file.status}
                  </Badge>
                </div>
                {file.templateArea && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Área:</span>
                    <span className="text-sm">{file.templateArea}</span>
                  </div>
                )}
                {file.templateDocType && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Tipo:</span>
                    <span className="text-sm">{file.templateDocType}</span>
                  </div>
                )}
                {file.updatedAt && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Atualizado:</span>
                    <span className="text-sm">
                      {new Date(file.updatedAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  )
}
