'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface StatusChartProps {
  pending: number
  processing: number
  completed: number
  failed: number
  rejected: number
}

const COLORS = {
  pending: '#eab308',
  processing: '#f97316',
  completed: '#22c55e',
  failed: '#ef4444',
  rejected: '#6b7280',
}

export function StatusChart({
  pending,
  processing,
  completed,
  failed,
  rejected,
}: StatusChartProps) {
  const data = [
    { name: 'Concluídos', value: completed, color: COLORS.completed },
    { name: 'Pendentes', value: pending, color: COLORS.pending },
    { name: 'Em Processamento', value: processing, color: COLORS.processing },
    { name: 'Falhados', value: failed, color: COLORS.failed },
    { name: 'Rejeitados', value: rejected, color: COLORS.rejected },
  ].filter(item => item.value > 0)

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
