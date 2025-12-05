'use client'

/**
 * Página de Detalhes do Arquivo SPED
 * 
 * Exibe:
 * - Informações do arquivo
 * - Botão para processar ECD
 * - Resultados do processamento (BP e DRE)
 */

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, FileSpreadsheet, Play, CheckCircle2, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ECDResultsViewer } from '@/components/ecd/ecd-results-viewer'
import toast from 'react-hot-toast'

export default function SpedDetailPage() {
  const router = useRouter()
  const params = useParams()
  const spedId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [spedFile, setSpedFile] = useState<any>(null)
  const [ecdResults, setEcdResults] = useState<any>(null)

  useEffect(() => {
    if (spedId) {
      loadSpedFile()
      loadEcdResults()
    }
  }, [spedId])

  const loadSpedFile = async () => {
    try {
      const res = await fetch(`/api/sped/${spedId}`)
      if (!res.ok) throw new Error('Erro ao carregar arquivo SPED')
      const data = await res.json()
      setSpedFile(data)
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao carregar arquivo SPED')
    } finally {
      setLoading(false)
    }
  }

  const loadEcdResults = async () => {
    try {
      const res = await fetch(`/api/sped/${spedId}/ecd-results`)
      if (res.ok) {
        const data = await res.json()
        if (data.bp?.length > 0 || data.dre?.length > 0) {
          setEcdResults(data)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar resultados ECD:', error)
    }
  }

  const handleProcessECD = async () => {
    try {
      setProcessing(true)
      toast.loading('Processando ECD...', { id: 'process-ecd' })

      const res = await fetch(`/api/sped/${spedId}/process-ecd`, {
        method: 'POST',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao processar ECD')
      }

      const result = await res.json()
      
      toast.success(
        `ECD processado! BP: ${result.bp.count} contas, DRE: ${result.dre.count} contas`,
        { id: 'process-ecd', duration: 5000 }
      )

      // Recarregar resultados
      await loadEcdResults()
    } catch (error) {
      console.error('Erro:', error)
      toast.error(
        error instanceof Error ? error.message : 'Erro ao processar ECD',
        { id: 'process-ecd' }
      )
    } finally {
      setProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (!spedFile) return

    if (!confirm(`Deseja realmente deletar o arquivo "${spedFile.fileName}"?\n\nTodos os dados processados (BP e DRE) serão perdidos.\n\nEsta ação não pode ser desfeita.`)) {
      return
    }

    try {
      const res = await fetch(`/api/sped/${spedId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao deletar arquivo')
      }

      toast.success('Arquivo deletado com sucesso!')
      router.push('/sped')
    } catch (error) {
      console.error('Erro:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao deletar arquivo')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!spedFile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Arquivo SPED não encontrado</p>
        <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.back()} variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6" />
              {spedFile.fileName}
            </h1>
            <p className="text-sm text-muted-foreground">
              Arquivo SPED ECD
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!ecdResults && (
            <Button
              onClick={handleProcessECD}
              disabled={processing}
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Processar ECD Agora
                </>
              )}
            </Button>
          )}
          
          <Button
            onClick={handleDelete}
            variant="outline"
            size="lg"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Deletar
          </Button>
        </div>
      </div>

      {/* Informações do Arquivo */}
        <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações do Arquivo</CardTitle>
          </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Nome do Arquivo</p>
            <p className="text-sm">{spedFile.fileName}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">CNPJ</p>
            <p className="text-sm">{spedFile.cnpj}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Empresa</p>
            <p className="text-sm">{spedFile.companyName}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Período</p>
            <p className="text-sm">
              {new Date(spedFile.periodStart).toLocaleDateString('pt-BR')} até{' '}
              {new Date(spedFile.periodEnd).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Upload em</p>
            <p className="text-sm">{new Date(spedFile.createdAt).toLocaleString('pt-BR')}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <div className="flex items-center gap-2">
              {ecdResults ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">Processado</span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Aguardando processamento</span>
              )}
            </div>
          </div>
          </CardContent>
        </Card>

      {/* Resultados ECD */}
      {ecdResults && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resultados do Processamento</CardTitle>
          </CardHeader>
          <CardContent>
            <ECDResultsViewer
              spedFileId={spedId}
              bp={ecdResults.bp}
              dre={ecdResults.dre}
              metadata={ecdResults.metadata}
            />
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      {!ecdResults && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Este arquivo ainda não foi processado.
              </p>
              <p className="text-sm text-muted-foreground">
                Clique em "Processar ECD Agora" para extrair Balanço Patrimonial e DRE de 5 anos.
              </p>
              <div className="flex items-center justify-center gap-4 pt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span className="font-medium">💰 Custo:</span> $0.00 (sem IA)
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">⚡ Tempo:</span> ~2-5 segundos
                </div>
                </div>
              </div>
            </CardContent>
          </Card>
      )}
    </div>
  )
}
