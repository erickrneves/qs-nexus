'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'

interface SchemaPromptPreviewProps {
  schemaId?: string
}

interface PromptPreviewResponse {
  prompt: string | null
  schemaName?: string
  schemaId?: string
  error?: string
}

export function SchemaPromptPreview({ schemaId }: SchemaPromptPreviewProps) {
  const [preview, setPreview] = useState<PromptPreviewResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchPreview() {
      try {
        setIsLoading(true)
        const url = schemaId
          ? `/api/template-schema/prompt-preview?schemaId=${schemaId}`
          : '/api/template-schema/prompt-preview'
        const response = await fetch(url)
        const data = await response.json()
        setPreview(data)
      } catch (error) {
        console.error('Error fetching prompt preview:', error)
        setPreview({
          prompt: null,
          error: 'Erro ao carregar preview do prompt',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPreview()
  }, [schemaId])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Preview do Prompt do Schema</CardTitle>
          <CardDescription className="text-xs">
            Visualização do prompt gerado a partir do schema ativo
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    )
  }

  if (!preview || preview.error || !preview.prompt) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Preview do Prompt do Schema</CardTitle>
          <CardDescription className="text-xs">
            Visualização do prompt gerado a partir do schema ativo
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div className="text-sm text-destructive">
              {preview?.error || 'Nenhum schema ativo encontrado. Crie um schema de template primeiro.'}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Preview do Prompt do Schema</CardTitle>
        <CardDescription className="text-xs">
          {preview.schemaName
            ? `Prompt gerado a partir do schema: ${preview.schemaName}`
            : 'Visualização do prompt gerado a partir do schema ativo'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground mb-2">
            Esta seção será automaticamente adicionada ao final do System Prompt durante a classificação.
          </div>
          <pre className="text-xs font-mono bg-muted p-4 rounded overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap">
            <code>{preview.prompt}</code>
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}

