import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Wallet } from "lucide-react"
import { ExpensesChart } from "@/components/dashboard/expenses-chart"
import { CurrencyToggle } from "@/components/dashboard/currency-toggle"
import { AnimatedMoney } from "@/components/dashboard/animated-money"
import {
  convertCurrency,
  calculatePercentageChange,
  getCurrencySymbol,
  type Currency,
} from "@/lib/finance"

async function getStats(
  userId: string,
  currency: Currency,
  rate: number
) {
  const now = new Date()

  const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const [thisMonthTx, lastMonthTx] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, date: { gte: firstDayThisMonth } },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: firstDayLastMonth,
          lte: lastDayLastMonth,
        },
      },
    }),
  ])

  const sum = (tx: any[]) => {
    const income = tx
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0)

    const expenses = tx
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0)

    return {
      income,
      expenses,
      balance: income - expenses,
    }
  }

  const thisM = sum(thisMonthTx)
  const lastM = sum(lastMonthTx)

  return {
    income: convertCurrency(thisM.income, currency, rate),
    expenses: convertCurrency(thisM.expenses, currency, rate),
    balance: convertCurrency(thisM.balance, currency, rate),

    incomeChange: calculatePercentageChange(
      thisM.income,
      lastM.income
    ),

    expensesChange: calculatePercentageChange(
      thisM.expenses,
      lastM.expenses
    ),
  }
}

async function getChartData(
  userId: string,
  currency: Currency,
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
        where: {
          userId,
          date: {
            gte: firstDay,
            lte: lastDay,
          },
        },
      })

      const income = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0)

      const expenses = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0)

      return {
        month: date.toLocaleString("es-AR", {
          month: "short",
        }),
        income: convertCurrency(income, currency, rate),
        expenses: convertCurrency(expenses, currency, rate),
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

  const [
    { income, expenses, balance, incomeChange, expensesChange },
    chartData,
  ] = await Promise.all([
    getStats(user!.id, user!.preferredCurrency as Currency, rate),
    getChartData(user!.id, user!.preferredCurrency as Currency, rate),
  ])

  const currencySymbol = getCurrencySymbol(
    user!.preferredCurrency as Currency
  )

  const cards = [
    {
      title: "Balance del mes",
      value: balance,
      icon: Wallet,
      color: balance >= 0 ? "text-emerald-600" : "text-red-600",
      customChange: `${currencySymbol} ${Math.abs(balance).toLocaleString(
        "es-AR"
      )} vs mes anterior`,
    },
    {
      title: "Ingresos",
      value: income,
      change: incomeChange,
      icon: TrendingUp,
      color: "text-emerald-600",
    },
    {
      title: "Gastos",
      value: expenses,
      change: expensesChange,
      icon: TrendingDown,
      color: "text-red-600",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Resumen de este mes
          </p>
        </div>

        <CurrencyToggle current={user!.preferredCurrency as Currency} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card
            key={card.title}
            className="bg-white border border-gray-200 shadow-none"
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
                      ? `- ${currencySymbol} `
                      : `${currencySymbol} `
                  }
                />
              </p>

              {"customChange" in card ? (
                <div className="mt-2 text-xs text-gray-500">
                  {card.customChange}
                </div>
              ) : (
                <div className="mt-2 text-xs">
                  <span
                    className={
                      card.change >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }
                  >
                    {card.change >= 0 ? "▲" : "▼"}{" "}
                    {Math.abs(card.change).toFixed(1)}%
                  </span>

                  <span className="text-gray-400 ml-1">
                    vs mes anterior
                  </span>
                </div>
              )}
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
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <p className="text-gray-400 text-sm">
                Todavía no hay datos suficientes para mostrar el gráfico.
              </p>
            </div>
          ) : (
            <ExpensesChart
              data={chartData}
              currency={user!.preferredCurrency as Currency}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}