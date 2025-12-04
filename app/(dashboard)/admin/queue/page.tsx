'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'

interface QueueStats {
  waiting: number
  active: number
  completed: number
  failed: number
}

export default function QueueMonitorPage() {
  const [stats, setStats] = useState<QueueStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/admin/queue/stats')
      
      if (!res.ok) {
        throw new Error('Falha ao carregar estatísticas')
      }
      
      const data = await res.json()
      setStats(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 5000) // Atualiza a cada 5s
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monitoramento de Fila</h1>
          <p className="text-muted-foreground">
            Status do processamento SPED em tempo real
          </p>
        </div>
        <Button onClick={loadStats} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Certifique-se de que Redis está configurado e o worker está rodando.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aguardando</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.waiting}</div>
              <p className="text-xs text-muted-foreground">
                Jobs na fila
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processando</CardTitle>
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                Em execução
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">
                Processados com sucesso
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Falhados</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.failed}</div>
              <p className="text-xs text-muted-foreground">
                Com erro
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona</CardTitle>
          <CardDescription>
            Processamento SPED com BullMQ + Redis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">📋 Fluxo de Processamento</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Upload de SPED cria registro com status "pending"</li>
              <li>Job adicionado automaticamente à fila Redis</li>
              <li>Worker Heroku pega job e inicia processamento</li>
              <li>Parser extrai dados dos registros SPED</li>
              <li>Dados salvos no banco (contas, lançamentos)</li>
              <li>Status atualizado para "completed" ou "failed"</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold mb-2">🔧 Comandos Úteis Heroku</h3>
            <div className="space-y-2">
              <code className="block bg-muted p-2 rounded text-xs">
                heroku logs --tail --dyno worker -a qs-nexus
              </code>
              <code className="block bg-muted p-2 rounded text-xs">
                heroku ps -a qs-nexus
              </code>
              <code className="block bg-muted p-2 rounded text-xs">
                heroku redis:info -a qs-nexus
              </code>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Atenção:</strong> Esta página requer que Redis esteja configurado e o worker dyno esteja ativo.
              Ver <code className="bg-muted px-1 rounded">HEROKU_WORKER_SETUP.md</code> para instruções.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

