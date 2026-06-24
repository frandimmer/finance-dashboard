import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Wallet } from "lucide-react"
import { ExpensesChart } from "@/components/dashboard/expenses-chart"

async function getStats(userId: string) {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)

  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: firstDay } },
  })

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)

  return { income, expenses, balance: income - expenses }
}

async function getChartData(userId: string) {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    return d
  })

  const data = await Promise.all(
    months.map(async (date) => {
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)

      const transactions = await prisma.transaction.findMany({
        where: { userId, date: { gte: firstDay, lte: lastDay } },
      })

      const income = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0)

      const expenses = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0)

      return {
        month: date.toLocaleString("es-AR", { month: "short" }),
        income,
        expenses,
      }
    })
  )

  return data
}

export default async function DashboardPage() {
  const session = await auth()
  const [{ income, expenses, balance }, chartData] = await Promise.all([
    getStats(session!.user!.id!),
    getChartData(session!.user!.id!),
  ])

  const cards = [
    {
      title: "Balance del mes",
      value: balance,
      icon: Wallet,
      color: balance >= 0 ? "text-emerald-600" : "text-red-600",
    },
    {
      title: "Ingresos",
      value: income,
      icon: TrendingUp,
      color: "text-emerald-600",
    },
    {
      title: "Gastos",
      value: expenses,
      icon: TrendingDown,
      color: "text-red-600",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen de este mes</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.title} className="bg-white border border-gray-200 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {card.title}
              </CardTitle>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${card.color}`}>
                ${Math.abs(card.value).toLocaleString("es-AR")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white border border-gray-200 shadow-none">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-500">
            Últimos 6 meses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ExpensesChart data={chartData} />
        </CardContent>
      </Card>
    </div>
  )
}