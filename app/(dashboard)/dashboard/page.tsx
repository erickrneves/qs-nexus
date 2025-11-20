'use client'

import { useEffect, useState } from 'react'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { StatusChart } from '@/components/dashboard/status-chart'
import { AreaChart } from '@/components/dashboard/area-chart'
import { RecentFiles } from '@/components/dashboard/recent-files'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardSkeleton } from '@/components/loading-skeletons'
import { toast } from 'react-hot-toast'
import { AlertCircle } from 'lucide-react'

interface StatsData {
  summary: {
    total: number
    pending: number
    processing: number
    completed: number
    failed: number
    rejected: number
    progress: number
  }
  byArea: Array<{ area: string; count: number }>
  byDocType: Array<{ docType: string; count: number }>
  gold: number
  silver: number
  recentFiles: Array<{
    id: string
    fileName: string
    status: string
    wordsCount: number | null
    processedAt: Date | null
    updatedAt: Date | null
  }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch('/api/documents/stats', {
          next: { revalidate: 30 }, // Cache por 30 segundos
        })

        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        setStats(data)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erro desconhecido ao carregar estatísticas'
        console.error('Error fetching stats:', error)
        setError(errorMessage)
        toast.error('Erro ao carregar estatísticas. Tente novamente.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (error || !stats) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Erro ao carregar estatísticas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {error || 'Não foi possível carregar as estatísticas do dashboard.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-primary hover:underline"
            >
              Recarregar página
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">Visão geral do sistema RAG</p>
      </div>

      <StatsCards {...stats.summary} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusChart {...stats.summary} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Área Jurídica</CardTitle>
          </CardHeader>
          <CardContent>
            <AreaChart data={stats.byArea} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Documentos de Qualidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>GOLD:</span>
                <span className="font-bold text-yellow-600">{stats.gold}</span>
              </div>
              <div className="flex justify-between">
                <span>SILVER:</span>
                <span className="font-bold text-gray-400">{stats.silver}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <RecentFiles files={stats.recentFiles} />
      </div>
    </div>
  )
}
