import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Wallet } from "lucide-react"
import { ExpensesChart } from "@/components/dashboard/expenses-chart"
import { CurrencyToggle } from "@/components/dashboard/currency-toggle"
import { AnimatedMoney } from "@/components/dashboard/animated-money"

async function getStats(
  userId: string,
  currency: "ARS" | "USD",
  rate: number
) {
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

  const convert = (value: number) =>
    currency === "USD" ? value / rate : value

  return {
    income: convert(income),
    expenses: convert(expenses),
    balance: convert(income - expenses),
  }
}

async function getChartData(
  userId: string,
  currency: "ARS" | "USD",
  rate: number
) {
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

      const convert = (value: number) =>
        currency === "USD" ? value / rate : value

      return {
        month: date.toLocaleString("es-AR", { month: "short" }),
        income: convert(income),
        expenses: convert(expenses),
        hasData: transactions.length > 0,
      }
    })
  )

  return data.filter((d) => d.hasData)
}

export default async function DashboardPage() {
  const session = await auth()

  const user = await prisma.user.findUnique({
    where: {
      email: session!.user!.email!,
    },
    select: {
      id: true,
      preferredCurrency: true,
    },
  })

  const res = await fetch(
    "http://localhost:3000/api/exchange-rate",
    { cache: "no-store" }
  )

  const { rate } = await res.json()

  const [{ income, expenses, balance }, chartData] =
    await Promise.all([
      getStats(user!.id, user!.preferredCurrency, rate),
      getChartData(user!.id, user!.preferredCurrency, rate),
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

      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Resumen de este mes
          </p>
        </div>

        <CurrencyToggle current={user!.preferredCurrency} />
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card
            key={card.title}
            className="bg-white border border-gray-200 shadow-none transition-all duration-300"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {card.title}
              </CardTitle>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </CardHeader>

            <CardContent>
              <p className={`text-2xl font-bold ${card.color}`}>
                <AnimatedMoney
                  value={Math.abs(card.value)}
                  prefix={
                    card.value < 0
                      ? user!.preferredCurrency === "USD"
                        ? "- US$ "
                        : "- $ "
                      : user!.preferredCurrency === "USD"
                        ? "US$ "
                        : "$ "
                  }
                />
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CHART */}
      <Card className="bg-white border border-gray-200 shadow-none">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-500">
            Últimos 6 meses
          </CardTitle>
        </CardHeader>

        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <p className="text-gray-400 text-sm">
                Todavía no hay datos suficientes para mostrar el gráfico.
              </p>
              <p className="text-gray-300 text-xs">
                Registrá tus primeras transacciones para verlo aparecer.
              </p>
            </div>
          ) : (
            <ExpensesChart data={chartData} />
          )}
        </CardContent>
      </Card>

    </div>
  )
}