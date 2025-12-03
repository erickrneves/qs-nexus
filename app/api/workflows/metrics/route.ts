import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { metricsCollector } from '@/lib/orchestration/workflow-metrics'

/**
 * GET /api/workflows/metrics
 * Obtém métricas de execuções de workflows
 */
export async function GET(request: NextRequest) {
  // Verificar autenticação
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { user } = authResult

  try {
    const searchParams = request.nextUrl.searchParams
    const executionId = searchParams.get('executionId')

    // Se pediu métricas de uma execução específica
    if (executionId) {
      const metrics = metricsCollector.get(executionId)
      
      if (!metrics) {
        return NextResponse.json(
          { error: 'Métricas não encontradas' },
          { status: 404 }
        )
      }

      // Verificar acesso
      if (user.globalRole !== 'super_admin' && metrics.userId !== user.id) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        )
      }

      return NextResponse.json({ metrics })
    }

    // Listar todas as métricas (filtradas por usuário se não super_admin)
    const allMetrics = metricsCollector.listAll()
    
    const filteredMetrics = user.globalRole === 'super_admin'
      ? allMetrics
      : allMetrics.filter(m => m.userId === user.id)

    // Calcular agregados
    const totalExecutions = filteredMetrics.length
    const completedExecutions = filteredMetrics.filter(m => m.status === 'completed').length
    const failedExecutions = filteredMetrics.filter(m => m.status === 'failed').length
    const totalTokens = filteredMetrics.reduce((sum, m) => sum + m.tokens.total, 0)
    const totalCost = filteredMetrics.reduce((sum, m) => sum + m.cost.total, 0)

    return NextResponse.json({
      summary: {
        totalExecutions,
        completedExecutions,
        failedExecutions,
        successRate: totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0,
        totalTokens,
        totalCost,
      },
      metrics: filteredMetrics,
    })
  } catch (error) {
    console.error('Erro ao buscar métricas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar métricas' },
      { status: 500 }
    )
  }
}

