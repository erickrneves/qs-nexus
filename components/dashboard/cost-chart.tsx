'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp } from 'lucide-react'

interface CostChartProps {
  totalCost: number
  costByProvider: Array<{ provider: string; cost: number }>
  costByModel: Array<{ model: string; provider: string; cost: number }>
  totalDocuments: number
}

export function CostChart({ totalCost, costByProvider, costByModel, totalDocuments }: CostChartProps) {
  const averageCostPerDocument = totalDocuments > 0 ? totalCost / totalDocuments : 0

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value)
  }

  // Prepara dados para gráfico de provider
  const providerData = costByProvider.map(item => ({
    provider: item.provider === 'openai' ? 'OpenAI' : 'Google',
    cost: Number(item.cost),
  }))

  // Prepara dados para gráfico de modelo (top 10)
  const modelData = costByModel.slice(0, 10).map(item => ({
    model: item.model,
    provider: item.provider === 'openai' ? 'OpenAI' : 'Google',
    cost: Number(item.cost),
  }))

  return (
    <div className="space-y-6">
      {/* Cards de totais */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
            <p className="text-xs text-muted-foreground">
              Total gasto em classificação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Médio por Documento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageCostPerDocument)}</div>
            <p className="text-xs text-muted-foreground">
              Média de {totalDocuments.toLocaleString()} documentos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de custos por provider */}
      {providerData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Custos por Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={providerData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="provider" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="cost" fill="#8884d8" name="Custo (USD)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de custos por modelo */}
      {modelData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Custos por Modelo (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={modelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                <YAxis dataKey="model" type="category" width={150} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="cost" fill="#82ca9d" name="Custo (USD)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {providerData.length === 0 && modelData.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              Nenhum dado de custo disponível ainda
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

