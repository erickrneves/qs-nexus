'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface AreaChartProps {
  data: Array<{ area: string; count: number }>
}

export function AreaChart({ data }: AreaChartProps) {
  const chartData = data.map(item => ({
    name: item.area.charAt(0).toUpperCase() + item.area.slice(1),
    quantidade: item.count,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="quantidade" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  )
}
