'use client'

import { useCallback, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, Folder, X, FileText, FileSpreadsheet, Database } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  maxSize?: number // em MB
  maxFiles?: number
  acceptedTypes?: string[] // ex: ['.csv', '.txt', '.pdf']
}

const DEFAULT_TYPES = ['.docx', '.doc', '.pdf', '.txt', '.csv', '.sped']

export function FileUpload({
  onFilesSelected,
  maxSize = 50,
  maxFiles = 50,
  acceptedTypes = DEFAULT_TYPES,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)

  // Sincroniza arquivos com o callback após atualização do estado
  // Removido onFilesSelected das dependências para evitar loop infinito
  useEffect(() => {
    onFilesSelected(files)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files])

  const getFileIcon = (fileName: string) => {
    const lower = fileName.toLowerCase()
    if (lower.endsWith('.csv')) return <FileSpreadsheet className="h-4 w-4 text-green-500" />
    if (lower.endsWith('.sped') || (lower.endsWith('.txt') && lower.includes('sped')))
      return <Database className="h-4 w-4 text-emerald-500" />
    return <FileText className="h-4 w-4 text-blue-500" />
  }

  const isValidFile = useCallback(
    (file: File) => {
      const fileName = file.name.toLowerCase()
      return acceptedTypes.some(type => fileName.endsWith(type.toLowerCase()))
    },
    [acceptedTypes]
  )

  const handleFileSelect = useCallback(
    (selectedFiles: FileList | null) => {
      if (!selectedFiles) return

      const validFiles: File[] = []
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]

        // Verifica formato
        if (!isValidFile(file)) continue

        // Verifica tamanho
        if (file.size > maxSize * 1024 * 1024) continue

        // Verifica limite de arquivos
        if (files.length + validFiles.length >= maxFiles) break

        // Verifica duplicata
        const isDuplicate = files.some(f => f.name === file.name && f.size === file.size)
        if (isDuplicate) continue

        validFiles.push(file)
      }

      if (validFiles.length > 0) {
        setFiles(prev => [...prev, ...validFiles])
      }
    },
    [maxSize, maxFiles, files, isValidFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFileSelect(e.dataTransfer.files)
    },
    [handleFileSelect]
  )

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const clearFiles = useCallback(() => {
    setFiles([])
  }, [])

  const handleFolderSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(e.target.files)
    },
    [handleFileSelect]
  )

  const acceptString = acceptedTypes.join(',')
  const typesDisplay = acceptedTypes.map(t => t.toUpperCase().replace('.', '')).join(', ')

  return (
    <div className="space-y-4">
      <Card
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed transition-all duration-200 ${
          isDragging
            ? 'border-emerald-500 bg-emerald-500/5 scale-[1.01]'
            : 'border-muted hover:border-muted-foreground/50'
        }`}
      >
        <CardContent className="flex flex-col items-center justify-center p-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 mb-4">
            <Upload className="h-8 w-8 text-emerald-500" />
          </div>
          <p className="text-lg font-semibold mb-2">Arraste arquivos aqui ou clique para selecionar</p>
          <p className="text-sm text-muted-foreground mb-1">Formatos aceitos: {typesDisplay}</p>
          <p className="text-sm text-muted-foreground mb-6">
            Tamanho máximo: {maxSize}MB por arquivo • Limite: {maxFiles} arquivos
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <FileText className="h-4 w-4 mr-2" />
              Selecionar Arquivos
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('folder-input')?.click()}
            >
              <Folder className="h-4 w-4 mr-2" />
              Selecionar Pasta
            </Button>
          </div>
          <input
            id="file-input"
            type="file"
            multiple
            accept={acceptString}
            className="hidden"
            onChange={e => handleFileSelect(e.target.files)}
          />
          <input
            id="folder-input"
            type="file"
            {...({ webkitdirectory: '' } as any)}
            multiple
            accept={acceptString}
            className="hidden"
            onChange={handleFolderSelect}
          />
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {files.length} arquivo(s) selecionado(s)
                  {files.length >= maxFiles && (
                    <span className="text-amber-500 ml-2">(limite atingido)</span>
                  )}
                </p>
                <Button type="button" variant="ghost" size="sm" onClick={clearFiles}>
                  <X className="h-4 w-4 mr-1" />
                  Limpar todos
                </Button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between rounded-lg border bg-muted/50 p-3 transition-colors hover:bg-muted group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(file.name)}
                      <span className="text-sm truncate">{file.name}</span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remover arquivo</span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
