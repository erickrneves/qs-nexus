'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

interface StatsCardsProps {
  total: number
  pending: number
  processing: number
  completed: number
  failed: number
  rejected: number
  progress: number
}

export function StatsCards({
  total,
  pending,
  processing,
  completed,
  failed,
  rejected,
  progress,
}: StatsCardsProps) {
  const stats = [
    {
      title: 'Total',
      value: total,
      icon: FileText,
      description: 'Documentos no sistema',
      color: 'text-blue-600',
    },
    {
      title: 'Concluídos',
      value: completed,
      icon: CheckCircle,
      description: `${progress}% processados`,
      color: 'text-green-600',
    },
    {
      title: 'Pendentes',
      value: pending,
      icon: Clock,
      description: 'Aguardando processamento',
      color: 'text-yellow-600',
    },
    {
      title: 'Em Processamento',
      value: processing,
      icon: AlertCircle,
      description: 'Sendo processados',
      color: 'text-orange-600',
    },
    {
      title: 'Falhados',
      value: failed,
      icon: XCircle,
      description: 'Erro no processamento',
      color: 'text-red-600',
    },
    {
      title: 'Rejeitados',
      value: rejected,
      icon: XCircle,
      description: 'Fora dos critérios',
      color: 'text-gray-600',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map(stat => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
