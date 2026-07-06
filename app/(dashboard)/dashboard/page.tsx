import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowUpRight,
  Receipt,
  Tag,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { ExpensesChart } from "@/components/dashboard/expenses-chart";
import { AnimatedMoney } from "@/components/dashboard/animated-money";
import {
  calculatePercentageChange,
  getCurrencySymbol,
  type Currency,
} from "@/lib/finance";

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return { start, end };
}

function getPreviousMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);

  return { start, end };
}

function formatMoney(amount: number, currency: Currency) {
  const symbol = getCurrencySymbol(currency);

  return `${amount < 0 ? "-" : ""}${symbol} ${Math.abs(amount).toLocaleString(
    "es-AR",
    {
      minimumFractionDigits: currency === "USD" ? 2 : 0,
      maximumFractionDigits: currency === "USD" ? 2 : 0,
    }
  )}`;
}

function formatShortMoney(amount: number, currency: Currency) {
  const symbol = getCurrencySymbol(currency);

  return `${amount < 0 ? "-" : ""}${symbol} ${Math.abs(amount).toLocaleString(
    "es-AR",
    {
      minimumFractionDigits: currency === "USD" ? 2 : 0,
      maximumFractionDigits: currency === "USD" ? 2 : 0,
    }
  )}`;
}

function formatTransactionDate(date: Date) {
  return new Date(date).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

function emptyCurrencyStats() {
  return {
    ARS: {
      income: 0,
      expenses: 0,
      balance: 0,
    },
    USD: {
      income: 0,
      expenses: 0,
      balance: 0,
    },
  };
}

function sumTransactionsByCurrency(
  transactions: {
    amount: number;
    type: string;
    currency: Currency;
  }[]
) {
  const totals = emptyCurrencyStats();

  transactions.forEach((transaction) => {
    const currency = transaction.currency;

    if (transaction.type === "income") {
      totals[currency].income += transaction.amount;
      totals[currency].balance += transaction.amount;
    }

    if (transaction.type === "expense") {
      totals[currency].expenses += transaction.amount;
      totals[currency].balance -= transaction.amount;
    }
  });

  return totals;
}

async function getStats(userId: string) {
  const currentMonth = getCurrentMonthRange();
  const previousMonth = getPreviousMonthRange();

  const [thisMonthTx, lastMonthTx, allTransactions] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: currentMonth.start,
          lt: currentMonth.end,
        },
      },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: previousMonth.start,
          lt: previousMonth.end,
        },
      },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
      },
    }),
  ]);

  const thisMonth = sumTransactionsByCurrency(thisMonthTx);
  const lastMonth = sumTransactionsByCurrency(lastMonthTx);
  const total = sumTransactionsByCurrency(allTransactions);

  return {
    total,
    thisMonth,
    lastMonth,
    movements: thisMonthTx.length,
    totalMovements: allTransactions.length,
    arsIncomeChange: calculatePercentageChange(
      thisMonth.ARS.income,
      lastMonth.ARS.income
    ),
    arsExpensesChange: calculatePercentageChange(
      thisMonth.ARS.expenses,
      lastMonth.ARS.expenses
    ),
    usdIncomeChange: calculatePercentageChange(
      thisMonth.USD.income,
      lastMonth.USD.income
    ),
    usdExpensesChange: calculatePercentageChange(
      thisMonth.USD.expenses,
      lastMonth.USD.expenses
    ),
    arsBalanceChange: thisMonth.ARS.balance - lastMonth.ARS.balance,
    usdBalanceChange: thisMonth.USD.balance - lastMonth.USD.balance,
  };
}

async function getMonthlyControlData(userId: string) {
  const currentMonth = getCurrentMonthRange();

  const [budgets, transactions, recurringTransactions] = await Promise.all([
    prisma.budget.findMany({
      where: {
        userId,
        month: currentMonth.start.getMonth() + 1,
        year: currentMonth.start.getFullYear(),
      },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        type: "expense",
        date: {
          gte: currentMonth.start,
          lt: currentMonth.end,
        },
      },
    }),
    prisma.recurringTransaction.findMany({
      where: {
        userId,
        isActive: true,
        type: "expense",
      },
    }),
  ]);

  const totalBudget = {
    ARS: 0,
    USD: 0,
  };

  const totalSpent = {
    ARS: 0,
    USD: 0,
  };

  const recurringExpenses = {
    ARS: 0,
    USD: 0,
  };

  budgets.forEach((budget) => {
    totalBudget[budget.currency] += budget.amount;
  });

  transactions.forEach((transaction) => {
    totalSpent[transaction.currency] += transaction.amount;
  });

  recurringTransactions.forEach((recurring) => {
    recurringExpenses[recurring.currency] += recurring.amount;
  });

  const budgetUsage = {
    ARS:
      totalBudget.ARS > 0
        ? Math.round((totalSpent.ARS / totalBudget.ARS) * 100)
        : 0,
    USD:
      totalBudget.USD > 0
        ? Math.round((totalSpent.USD / totalBudget.USD) * 100)
        : 0,
  };

  return {
    totalBudget,
    totalSpent,
    recurringExpenses,
    recurringCount: recurringTransactions.length,
    budgetUsage,
  };
}

async function getChartData(userId: string) {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));

    return date;
  });

  const data = await Promise.all(
    months.map(async (date) => {
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 1);

      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          currency: "ARS",
          date: {
            gte: firstDay,
            lt: lastDay,
          },
        },
      });

      const income = transactions
        .filter((transaction) => transaction.type === "income")
        .reduce((total, transaction) => total + transaction.amount, 0);

      const expenses = transactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((total, transaction) => total + transaction.amount, 0);

      return {
        month: date.toLocaleString("es-AR", {
          month: "short",
        }),
        income,
        expenses,
        hasData: transactions.length > 0,
      };
    })
  );

  return data.filter((item) => item.hasData);
}

async function getRecentTransactions(userId: string) {
  return prisma.transaction.findMany({
    where: { userId },
    include: {
      category: true,
    },
    orderBy: {
      date: "desc",
    },
    take: 5,
  });
}

async function getTopCategories(userId: string) {
  const currentMonth = getCurrentMonthRange();

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: "expense",
      date: {
        gte: currentMonth.start,
        lt: currentMonth.end,
      },
    },
    include: {
      category: true,
    },
  });

  const groups = new Map<
    string,
    {
      name: string;
      icon: string | null;
      currency: Currency;
      amount: number;
      count: number;
    }
  >();

  transactions.forEach((transaction) => {
    const currency = transaction.currency as Currency;
    const key = `${transaction.category?.id ?? "uncategorized"}-${currency}`;
    const current = groups.get(key);

    if (current) {
      current.amount += transaction.amount;
      current.count += 1;
      return;
    }

    groups.set(key, {
      name: transaction.category?.name ?? "Sin categoría",
      icon: transaction.category?.icon ?? null,
      currency,
      amount: transaction.amount,
      count: 1,
    });
  });

  return Array.from(groups.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
}

export default async function DashboardPage() {
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: {
      email: session!.user!.email!,
    },
    select: {
      id: true,
    },
  });

  const response = await fetch("http://localhost:3000/api/exchange-rate", {
    cache: "no-store",
  });

  const { rate } = await response.json();

  const [stats, chartData, recentTransactions, topCategories, monthlyControl] =
    await Promise.all([
      getStats(user!.id),
      getChartData(user!.id),
      getRecentTransactions(user!.id),
      getTopCategories(user!.id),
      getMonthlyControlData(user!.id),
    ]);

  const monthlyCards = [
    {
      title: "Resultado ARS del mes",
      value: stats.thisMonth.ARS.balance,
      currency: "ARS" as Currency,
      icon: Wallet,
      color:
        stats.thisMonth.ARS.balance >= 0 ? "text-emerald-600" : "text-red-600",
      footer: `${stats.arsBalanceChange >= 0 ? "+" : "-"}${formatMoney(
        Math.abs(stats.arsBalanceChange),
        "ARS"
      )} vs mes anterior`,
      footerColor:
        stats.arsBalanceChange >= 0 ? "text-emerald-600" : "text-red-600",
    },
    {
      title: "Resultado USD del mes",
      value: stats.thisMonth.USD.balance,
      currency: "USD" as Currency,
      icon: Wallet,
      color:
        stats.thisMonth.USD.balance >= 0 ? "text-emerald-600" : "text-red-600",
      footer: `${stats.usdBalanceChange >= 0 ? "+" : "-"}${formatMoney(
        Math.abs(stats.usdBalanceChange),
        "USD"
      )} vs mes anterior`,
      footerColor:
        stats.usdBalanceChange >= 0 ? "text-emerald-600" : "text-red-600",
    },
    {
      title: "Ingresos del mes",
      value: stats.thisMonth.ARS.income,
      secondaryValue: stats.thisMonth.USD.income,
      icon: TrendingUp,
      color: "text-emerald-600",
      footer: `ARS ${stats.arsIncomeChange >= 0 ? "▲" : "▼"} ${Math.abs(
        stats.arsIncomeChange
      ).toFixed(1)}% · USD ${
        stats.usdIncomeChange >= 0 ? "▲" : "▼"
      } ${Math.abs(stats.usdIncomeChange).toFixed(1)}%`,
      footerColor: "text-gray-500",
    },
    {
      title: "Gastos del mes",
      value: stats.thisMonth.ARS.expenses,
      secondaryValue: stats.thisMonth.USD.expenses,
      icon: TrendingDown,
      color: "text-red-600",
      footer: `ARS ${stats.arsExpensesChange >= 0 ? "▲" : "▼"} ${Math.abs(
        stats.arsExpensesChange
      ).toFixed(1)}% · USD ${
        stats.usdExpensesChange >= 0 ? "▲" : "▼"
      } ${Math.abs(stats.usdExpensesChange).toFixed(1)}%`,
      footerColor: "text-gray-500",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Resumen financiero con saldos separados en ARS y USD
          </p>
        </div>

        <div className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-500 shadow-sm">
          USD · $ {rate.toLocaleString("es-AR")}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="overflow-hidden border border-gray-200 bg-white shadow-none">
          <CardContent className="p-0">
            <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-2xl border ${
                      stats.total.ARS.balance >= 0
                        ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                        : "border-red-100 bg-red-50 text-red-600"
                    }`}
                  >
                    <Wallet className="h-4 w-4" />
                  </div>

                  <p className="text-sm font-medium text-gray-500">
                    Balance total ARS
                  </p>
                </div>

                <p
                  className={`text-3xl font-bold sm:text-4xl ${
                    stats.total.ARS.balance >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  <AnimatedMoney
                    value={Math.abs(stats.total.ARS.balance)}
                    prefix={stats.total.ARS.balance < 0 ? "- $ " : "$ "}
                  />
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Saldo histórico real en pesos
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 sm:min-w-80">
                <div>
                  <p className="mb-1 text-xs text-gray-400">Ingresos</p>
                  <p className="text-sm font-semibold text-emerald-600">
                    {formatShortMoney(stats.total.ARS.income, "ARS")}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs text-gray-400">Gastos</p>
                  <p className="text-sm font-semibold text-red-600">
                    {formatShortMoney(stats.total.ARS.expenses, "ARS")}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs text-gray-400">Mov.</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {stats.totalMovements}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border border-gray-200 bg-white shadow-none">
          <CardContent className="p-0">
            <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-2xl border ${
                      stats.total.USD.balance >= 0
                        ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                        : "border-red-100 bg-red-50 text-red-600"
                    }`}
                  >
                    <Wallet className="h-4 w-4" />
                  </div>

                  <p className="text-sm font-medium text-gray-500">
                    Balance total USD
                  </p>
                </div>

                <p
                  className={`text-3xl font-bold sm:text-4xl ${
                    stats.total.USD.balance >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  <AnimatedMoney
                    value={Math.abs(stats.total.USD.balance)}
                    prefix={stats.total.USD.balance < 0 ? "- US$ " : "US$ "}
                  />
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Saldo histórico real en dólares
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 sm:min-w-80">
                <div>
                  <p className="mb-1 text-xs text-gray-400">Ingresos</p>
                  <p className="text-sm font-semibold text-emerald-600">
                    {formatShortMoney(stats.total.USD.income, "USD")}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs text-gray-400">Gastos</p>
                  <p className="text-sm font-semibold text-red-600">
                    {formatShortMoney(stats.total.USD.expenses, "USD")}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs text-gray-400">Mov.</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {stats.totalMovements}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
  {monthlyCards.map((card) => (
    <Card
      key={card.title}
      className="border border-gray-200 bg-white shadow-none transition-all duration-200 hover:border-gray-300 hover:bg-gray-50/60"
    >
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-gray-500">{card.title}</p>
          <card.icon className={`h-4 w-4 shrink-0 ${card.color}`} />
        </div>

        {"currency" in card ? (
          <p className={`text-xl font-bold ${card.color}`}>
            <AnimatedMoney
              value={Math.abs(card.value)}
              prefix={
                card.value < 0
                  ? `- ${getCurrencySymbol(card.currency)} `
                  : `${getCurrencySymbol(card.currency)} `
              }
            />
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            <p className={`text-xl font-bold ${card.color}`}>
              {formatShortMoney(card.value, "ARS")}
            </p>
            <p className={`text-xl font-bold ${card.color}`}>
              {formatShortMoney(card.secondaryValue, "USD")}
            </p>
          </div>
        )}

        <p className={`mt-2 line-clamp-1 text-xs font-medium ${card.footerColor}`}>
          {card.footer}
        </p>
      </CardContent>
    </Card>
  ))}
</div>

      <Card className="border border-gray-200 bg-white shadow-none">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="mb-1 text-xs text-gray-400">Movimientos del mes</p>
              <p className="text-sm font-semibold text-gray-900">
                {stats.movements}
              </p>
            </div>

            <div>
              <p className="mb-1 text-xs text-gray-400">Categorías con gasto</p>
              <p className="text-sm font-semibold text-gray-900">
                {topCategories.length}
              </p>
            </div>

            <div>
              <p className="mb-1 text-xs text-gray-400">Monedas activas</p>
              <p className="text-sm font-semibold text-gray-900">ARS / USD</p>
            </div>

            <div>
              <p className="mb-1 text-xs text-gray-400">
                Últimos movimientos
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {recentTransactions.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 bg-white shadow-none">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-500">
            Control mensual
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 transition-all duration-200 hover:border-gray-200 hover:bg-gray-50/70">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Presupuesto usado ARS
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {monthlyControl.totalBudget.ARS > 0
                      ? `${formatShortMoney(
                          monthlyControl.totalSpent.ARS,
                          "ARS"
                        )} de ${formatShortMoney(
                          monthlyControl.totalBudget.ARS,
                          "ARS"
                        )}`
                      : "Todavía no definiste presupuestos en ARS para este mes"}
                  </p>
                </div>

                <p
                  className={`shrink-0 text-sm font-semibold ${
                    monthlyControl.budgetUsage.ARS >= 100
                      ? "text-red-600"
                      : monthlyControl.budgetUsage.ARS >= 80
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }`}
                >
                  {monthlyControl.totalBudget.ARS > 0
                    ? `${monthlyControl.budgetUsage.ARS}%`
                    : "—"}
                </p>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${
                    monthlyControl.budgetUsage.ARS >= 100
                      ? "bg-red-500"
                      : monthlyControl.budgetUsage.ARS >= 80
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{
                    width: `${Math.min(monthlyControl.budgetUsage.ARS, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 transition-all duration-200 hover:border-gray-200 hover:bg-gray-50/70">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Gastos recurrentes activos
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {monthlyControl.recurringCount > 0
                      ? `${monthlyControl.recurringCount} ${
                          monthlyControl.recurringCount === 1
                            ? "plantilla activa"
                            : "plantillas activas"
                        }`
                      : "No tenés gastos recurrentes activos"}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-red-600">
                    -{formatShortMoney(monthlyControl.recurringExpenses.ARS, "ARS")}
                  </p>
                  <p className="text-sm font-semibold text-red-600">
                    -{formatShortMoney(monthlyControl.recurringExpenses.USD, "USD")}
                  </p>
                </div>
              </div>

              <p className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-500">
                Monto mensual estimado si generás todos los recurrentes activos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="border border-gray-200 bg-white shadow-none xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              Últimos 6 meses en ARS
            </CardTitle>
          </CardHeader>

          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-14 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white">
                  <span className="text-lg text-gray-400">—</span>
                </div>

                <h3 className="text-sm font-semibold text-gray-900">
                  Todavía no hay datos suficientes en ARS
                </h3>

                <p className="mt-2 max-w-sm text-sm text-gray-500">
                  Cuando registres movimientos en pesos de varios meses, vas a
                  poder ver tu evolución de ingresos y gastos.
                </p>
              </div>
            ) : (
              <ExpensesChart data={chartData} currency="ARS" />
            )}
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">
              Top gastos
            </CardTitle>

            <Tag className="h-4 w-4 text-gray-400" />
          </CardHeader>

          <CardContent>
            {topCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-12 text-center">
                <p className="text-sm font-medium text-gray-900">
                  Sin gastos categorizados
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Cuando cargues gastos, aparecerán acá tus categorías
                  principales.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {topCategories.map((category) => (
                  <div
                    key={`${category.name}-${category.currency}`}
                    className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 transition-all duration-200 hover:border-gray-200 hover:bg-gray-50/70"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-lg">
                        {category.icon || "📁"}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {category.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {category.count === 1
                            ? `1 movimiento · ${category.currency}`
                            : `${category.count} movimientos · ${category.currency}`}
                        </p>
                      </div>
                    </div>

                    <p className="shrink-0 text-sm font-semibold text-red-600">
                      -{formatShortMoney(category.amount, category.currency)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-gray-200 bg-white shadow-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-500">
            Últimos movimientos
          </CardTitle>

          <Receipt className="h-4 w-4 text-gray-400" />
        </CardHeader>

        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-12 text-center">
              <p className="text-sm font-medium text-gray-900">
                Todavía no hay movimientos
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Creá tu primera transacción para empezar a ver actividad
                reciente.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentTransactions.map((transaction) => {
                const transactionCurrency = transaction.currency as Currency;

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 transition-all duration-200 hover:border-gray-200 hover:bg-gray-50/70"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
                          transaction.type === "income"
                            ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                            : "border-red-100 bg-red-50 text-red-600"
                        }`}
                      >
                        <ArrowUpRight
                          className={`h-4 w-4 ${
                            transaction.type === "expense" ? "rotate-90" : ""
                          }`}
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {transaction.description || "Sin descripción"}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {transaction.category?.name || "Sin categoría"} ·{" "}
                          {transactionCurrency} ·{" "}
                          {formatTransactionDate(transaction.date)}
                        </p>
                      </div>
                    </div>

                    <p
                      className={`shrink-0 text-sm font-semibold ${
                        transaction.type === "income"
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatShortMoney(
                        transaction.amount,
                        transactionCurrency
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}