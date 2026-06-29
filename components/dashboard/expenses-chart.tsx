"use client"

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"

type Props = {
  data: {
    month: string
    income: number
    expenses: number
  }[]
  currency: "ARS" | "USD"
}

export function ExpensesChart({ data, currency }: Props) {
  const symbol = currency === "USD" ? "US$" : "$"

  return (
    <div className="w-full h-[340px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 60, bottom: 10 }}
          barGap={6}
        >

          {/* GRID MÁS SUAVE */}
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            opacity={0.6}
          />

          {/* X AXIS */}
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />

          {/* Y AXIS (FIX ESPACIO + FORMATO MONEDA) */}
          <YAxis
            width={90}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) =>
              `${symbol} ${value.toLocaleString("es-AR", {
                maximumFractionDigits: 0,
              })}`
            }
          />

          {/* TOOLTIP PRO */}
          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
            formatter={(value: number) => [
              `${symbol} ${value.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
            ]}
            labelStyle={{ color: "#374151" }}
          />

          {/* BARRAS MÁS SOFT */}
          <Bar
            dataKey="income"
            fill="#10b981"
            radius={[6, 6, 0, 0]}
            opacity={0.85}
          />

          <Bar
            dataKey="expenses"
            fill="#ef4444"
            radius={[6, 6, 0, 0]}
            opacity={0.85}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}