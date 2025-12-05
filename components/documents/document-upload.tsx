'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import { useOrganization } from '@/lib/contexts/organization-context'
import { Upload, X, FileIcon, Loader2 } from 'lucide-react'
import { validateFileType, validateFileSize, formatFileSize } from '@/lib/utils/file-upload'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  documentType?: 'general' | 'csv' | 'sped'
  acceptedFileTypes?: string
  maxSizeMB?: number
  title?: string
  description?: string
}

export function DocumentUploadDialog({
  open,
  onOpenChange,
  onSuccess,
  documentType = 'general',
  acceptedFileTypes = '.pdf,.docx,.doc,.txt',
  maxSizeMB = 50,
  title = 'Upload de Documentos',
  description = 'Selecione arquivos para upload',
}: Props) {
  const { currentOrg } = useOrganization()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)

  if (!open) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const acceptedTypesArray = acceptedFileTypes.split(',').map(t => t.trim())
    
    // Para SPED, aceitar apenas 1 arquivo
    if (documentType === 'sped' && selectedFiles.length > 0) {
      toast.error('Apenas 1 arquivo SPED por vez')
      e.target.value = ''
      return
    }
    
    const validFiles = files.filter(file => {
      if (!validateFileType(file, acceptedTypesArray)) {
        toast.error(`${file.name}: tipo não aceito`)
        return false
      }
      if (!validateFileSize(file, maxSizeMB)) {
        toast.error(`${file.name}: muito grande (máx ${maxSizeMB}MB)`)
        return false
      }
      return true
    })

    // Para SPED, pegar apenas o primeiro arquivo
    if (documentType === 'sped') {
      setSelectedFiles(validFiles.slice(0, 1))
    } else {
      setSelectedFiles(prev => [...prev, ...validFiles])
    }
    e.target.value = ''
  }

  const handleUpload = async () => {
    if (!currentOrg) {
      toast.error('Selecione uma organização')
      return
    }

    if (selectedFiles.length === 0) {
      toast.error('Selecione arquivos')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      selectedFiles.forEach(file => formData.append('files', file))
      formData.append('organizationId', currentOrg.id)
      formData.append('documentType', documentType)

      // Determinar endpoint baseado no tipo
      let endpoint = '/api/documents/upload'
      if (documentType === 'csv') {
        endpoint = '/api/csv/upload'
      } else if (documentType === 'sped') {
        endpoint = '/api/sped/upload'
        // Para SPED, enviar apenas o primeiro arquivo (não suporta múltiplos)
        formData.delete('files')
        formData.append('file', selectedFiles[0])
      }
      
      const response = await fetch(endpoint, { method: 'POST', body: formData })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao fazer upload')
      }

      const result = await response.json()
      
      if (documentType === 'sped') {
        if (result.warning) {
          toast(result.message || 'Arquivo SPED importado com sucesso!', {
            icon: '⚠️',
            duration: 5000,
          })
        } else {
          toast.success(result.message || 'Arquivo SPED importado com sucesso!')
        }
      } else {
        toast.success(`${selectedFiles.length} arquivo(s) enviado(s)!`)
      }
      setSelectedFiles([])
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error('[UPLOAD] Erro:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFiles([])
      onOpenChange(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <Upload className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Upload de Documentos</h2>
              <p className="text-sm opacity-90">Envie PDFs, documentos Word ou arquivos de texto</p>
            </div>
          </div>
          <button onClick={handleClose} disabled={isUploading} className="text-white hover:bg-white/20 p-2 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              📄 <strong>Documentos - Pipeline RAG Completo</strong>
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Converte para Markdown, classifica com IA e gera embeddings para busca semântica
            </p>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm font-medium mb-1">Arraste arquivos aqui ou clique para selecionar</p>
            <p className="text-xs text-gray-500 mb-4">
              Tipos aceitos: {acceptedFileTypes} | Máx: {maxSizeMB}MB
            </p>
            
            <input
              type="file"
              multiple
              accept={acceptedFileTypes}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="file-upload-input"
              disabled={!currentOrg}
            />
            
            <Button
              type="button"
              variant="outline"
              disabled={!currentOrg}
              onClick={() => document.getElementById('file-upload-input')?.click()}
            >
              Selecionar Arquivos
            </Button>
          </div>

          {/* Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">
                {selectedFiles.length} arquivo(s) selecionado(s)
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-3 flex-1">
                      <FileIcon className="h-5 w-5 text-blue-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))}
                      disabled={isUploading}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!currentOrg && (
            <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded border border-amber-200">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                ⚠️ Selecione uma organização no menu lateral
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={isUploading || selectedFiles.length === 0 || !currentOrg}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Fazer Upload
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

