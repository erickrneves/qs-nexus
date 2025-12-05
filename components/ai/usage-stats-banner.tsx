'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, DollarSign } from 'lucide-react'

export function UsageStatsBanner() {
  const [stats, setStats] = useState<{
    totalCalls: number
    estimatedTotalCost: number
    warning?: string
  } | null>(null)

  useEffect(() => {
    fetch('/api/ai/usage-stats')
      .then(res => res.json())
      .then(setStats)
      .catch(console.error)
  }, [])

  if (!stats || stats.totalCalls === 0) return null

  const isHighCost = stats.estimatedTotalCost > 0.5

  return (
    <div
      className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
        isHighCost ? 'bg-red-100 border-2 border-red-500' : 'bg-yellow-100 border-2 border-yellow-500'
      } max-w-sm z-50`}
    >
      <div className="flex items-start gap-3">
        {isHighCost ? (
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
        ) : (
          <DollarSign className="h-5 w-5 text-yellow-600 mt-0.5" />
        )}
        <div className="flex-1">
          <h3 className={`font-semibold text-sm ${isHighCost ? 'text-red-900' : 'text-yellow-900'}`}>
            Uso de OpenAI (Sessão Atual)
          </h3>
          <p className={`text-xs mt-1 ${isHighCost ? 'text-red-800' : 'text-yellow-800'}`}>
            {stats.totalCalls} chamadas • ~${stats.estimatedTotalCost.toFixed(4)}
          </p>
          {stats.warning && (
            <p className="text-xs mt-2 font-semibold text-red-900">
              ⚠️ {stats.warning}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

