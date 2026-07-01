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
import { CurrencyToggle } from "@/components/dashboard/currency-toggle";
import { AnimatedMoney } from "@/components/dashboard/animated-money";
import {
  calculatePercentageChange,
  convertCurrency,
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatShortMoney(amount: number, currency: Currency) {
  const symbol = getCurrencySymbol(currency);

  return `${amount < 0 ? "-" : ""}${symbol} ${Math.abs(amount).toLocaleString(
    "es-AR",
    {
      maximumFractionDigits: 0,
    }
  )}`;
}

function formatTransactionDate(date: Date) {
  return new Date(date).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

async function getStats(userId: string, currency: Currency, rate: number) {
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

  const sum = (
    transactions: {
      amount: number;
      type: string;
    }[]
  ) => {
    const income = transactions
      .filter((transaction) => transaction.type === "income")
      .reduce((total, transaction) => total + transaction.amount, 0);

    const expenses = transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((total, transaction) => total + transaction.amount, 0);

    return {
      income,
      expenses,
      balance: income - expenses,
      movements: transactions.length,
    };
  };

  const thisMonth = sum(thisMonthTx);
  const lastMonth = sum(lastMonthTx);
  const total = sum(allTransactions);

  return {
  totalBalance: convertCurrency(total.balance, currency, rate),
  totalIncome: convertCurrency(total.income, currency, rate),
  totalExpenses: convertCurrency(total.expenses, currency, rate),
  totalMovements: total.movements,

  income: convertCurrency(thisMonth.income, currency, rate),
  expenses: convertCurrency(thisMonth.expenses, currency, rate),
  balance: convertCurrency(thisMonth.balance, currency, rate),
  movements: thisMonth.movements,

  incomeChange: calculatePercentageChange(
    thisMonth.income,
    lastMonth.income
  ),
  expensesChange: calculatePercentageChange(
    thisMonth.expenses,
    lastMonth.expenses
  ),
  balanceChange: convertCurrency(
    thisMonth.balance - lastMonth.balance,
    currency,
    rate
  ),
};
}

async function getChartData(userId: string, currency: Currency, rate: number) {
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
        income: convertCurrency(income, currency, rate),
        expenses: convertCurrency(expenses, currency, rate),
        hasData: transactions.length > 0,
      };
    })
  );

  return data.filter((item) => item.hasData);
}

async function getRecentTransactions(
  userId: string,
  currency: Currency,
  rate: number
) {
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    include: {
      category: true,
    },
    orderBy: {
      date: "desc",
    },
    take: 5,
  });

  return transactions.map((transaction) => ({
    ...transaction,
    convertedAmount: convertCurrency(transaction.amount, currency, rate),
  }));
}

async function getTopCategories(
  userId: string,
  currency: Currency,
  rate: number
) {
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
      amount: number;
      count: number;
    }
  >();

  transactions.forEach((transaction) => {
    const key = transaction.category?.id ?? "uncategorized";
    const current = groups.get(key);

    if (current) {
      current.amount += transaction.amount;
      current.count += 1;
      return;
    }

    groups.set(key, {
      name: transaction.category?.name ?? "Sin categoría",
      icon: transaction.category?.icon ?? null,
      amount: transaction.amount,
      count: 1,
    });
  });

  return Array.from(groups.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((category) => ({
      ...category,
      amount: convertCurrency(category.amount, currency, rate),
    }));
}

export default async function DashboardPage() {
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: {
      email: session!.user!.email!,
    },
    select: {
      id: true,
      preferredCurrency: true,
    },
  });

  const currency = user!.preferredCurrency as Currency;

  const response = await fetch("http://localhost:3000/api/exchange-rate", {
    cache: "no-store",
  });

  const { rate } = await response.json();

  const [stats, chartData, recentTransactions, topCategories] =
    await Promise.all([
      getStats(user!.id, currency, rate),
      getChartData(user!.id, currency, rate),
      getRecentTransactions(user!.id, currency, rate),
      getTopCategories(user!.id, currency, rate),
    ]);

  const currencySymbol = getCurrencySymbol(currency);

  const cards = [
    {
      title: "Resultado del mes",
      value: stats.balance,
      icon: Wallet,
      color: stats.balance >= 0 ? "text-emerald-600" : "text-red-600",
      footer: `${stats.balanceChange >= 0 ? "+" : "-"}${formatMoney(
        Math.abs(stats.balanceChange),
        currency
      )} vs mes anterior`,
      footerColor:
        stats.balanceChange >= 0 ? "text-emerald-600" : "text-red-600",
    },
    {
      title: "Ingresos",
      value: stats.income,
      icon: TrendingUp,
      color: "text-emerald-600",
      footer: `${stats.incomeChange >= 0 ? "▲" : "▼"} ${Math.abs(
        stats.incomeChange
      ).toFixed(1)}% vs mes anterior`,
      footerColor:
        stats.incomeChange >= 0 ? "text-emerald-600" : "text-red-600",
    },
    {
      title: "Gastos",
      value: stats.expenses,
      icon: TrendingDown,
      color: "text-red-600",
      footer: `${stats.expensesChange >= 0 ? "▲" : "▼"} ${Math.abs(
        stats.expensesChange
      ).toFixed(1)}% vs mes anterior`,
      footerColor:
        stats.expensesChange >= 0 ? "text-red-600" : "text-emerald-600",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Resumen financiero de este mes
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
  <CurrencyToggle current={currency} />

  <div className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-500 shadow-sm">
    USD · $ {rate.toLocaleString("es-AR")}
  </div>
</div>
      </div>
<Card className="overflow-hidden border border-gray-200 bg-white shadow-none">
  <CardContent className="p-0">
    <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-2xl border ${
              stats.totalBalance >= 0
                ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                : "border-red-100 bg-red-50 text-red-600"
            }`}
          >
            <Wallet className="h-4 w-4" />
          </div>

          <p className="text-sm font-medium text-gray-500">Balance total</p>
        </div>

        <p
          className={`text-3xl font-bold sm:text-4xl ${
            stats.totalBalance >= 0 ? "text-emerald-600" : "text-red-600"
          }`}
        >
          <AnimatedMoney
            value={Math.abs(stats.totalBalance)}
            prefix={
              stats.totalBalance < 0
                ? `- ${currencySymbol} `
                : `${currencySymbol} `
            }
          />
        </p>

        <p className="mt-2 text-sm text-gray-500">
          Resultado histórico de todos tus movimientos registrados
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 sm:min-w-80">
        <div>
          <p className="mb-1 text-xs text-gray-400">Ingresos</p>
          <p className="text-sm font-semibold text-emerald-600">
            {formatShortMoney(stats.totalIncome, currency)}
          </p>
        </div>

        <div>
          <p className="mb-1 text-xs text-gray-400">Gastos</p>
          <p className="text-sm font-semibold text-red-600">
            {formatShortMoney(stats.totalExpenses, currency)}
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Card
            key={card.title}
            className="border border-gray-200 bg-white shadow-none transition-all duration-200 hover:border-gray-300 hover:bg-gray-50/60"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {card.title}
              </CardTitle>

              <card.icon className={`h-4 w-4 ${card.color}`} />
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

              <p className={`mt-2 text-xs font-medium ${card.footerColor}`}>
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
              <p className="mb-1 text-xs text-gray-400">Moneda actual</p>
              <p className="text-sm font-semibold text-gray-900">{currency}</p>
            </div>

            <div>
  <p className="mb-1 text-xs text-gray-400">Últimos movimientos</p>
  <p className="text-sm font-semibold text-gray-900">
    {recentTransactions.length}
  </p>
</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="border border-gray-200 bg-white shadow-none xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              Últimos 6 meses
            </CardTitle>
          </CardHeader>

          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-14 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white">
                  <span className="text-lg text-gray-400">—</span>
                </div>

                <h3 className="text-sm font-semibold text-gray-900">
                  Todavía no hay datos suficientes
                </h3>

                <p className="mt-2 max-w-sm text-sm text-gray-500">
                  Cuando registres movimientos de varios meses, vas a poder ver
                  tu evolución de ingresos y gastos.
                </p>
              </div>
            ) : (
              <ExpensesChart data={chartData} currency={currency} />
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
                    key={category.name}
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
                            ? "1 movimiento"
                            : `${category.count} movimientos`}
                        </p>
                      </div>
                    </div>

                    <p className="shrink-0 text-sm font-semibold text-red-600">
                      -{formatShortMoney(category.amount, currency)}
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
              {recentTransactions.map((transaction) => (
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
                    {formatShortMoney(transaction.convertedAmount, currency)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}