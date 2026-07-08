import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TransactionForm } from "@/components/dashboard/transaction-form";
import { DeleteTransaction } from "@/components/dashboard/delete-transaction";
import { TransactionFilters } from "@/components/dashboard/transaction-filters";
import { EditTransaction } from "@/components/dashboard/edit-transaction";
import { getCurrencySymbol, type Currency } from "@/lib/finance";

function getDateRange(month?: string, year?: string) {
  const selectedMonth = month ? Number(month) : null;
  const selectedYear = year ? Number(year) : null;

  const isValidMonth =
    selectedMonth !== null &&
    Number.isInteger(selectedMonth) &&
    selectedMonth >= 1 &&
    selectedMonth <= 12;

  const isValidYear =
    selectedYear !== null &&
    Number.isInteger(selectedYear) &&
    selectedYear >= 1900 &&
    selectedYear <= 2200;

  if (isValidMonth && isValidYear) {
    const start = new Date(selectedYear, selectedMonth - 1, 1);
    const end = new Date(selectedYear, selectedMonth, 1);

    return { start, end };
  }

  if (isValidYear) {
    const start = new Date(selectedYear, 0, 1);
    const end = new Date(selectedYear + 1, 0, 1);

    return { start, end };
  }

  return null;
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

function calculateCurrencyTotals(
  transactions: Awaited<ReturnType<typeof getTransactions>>
) {
  const totals = {
    ARS: {
      income: 0,
      expenses: 0,
      net: 0,
    },
    USD: {
      income: 0,
      expenses: 0,
      net: 0,
    },
  };

  transactions.forEach((transaction) => {
    const currency = transaction.currency as Currency;

    if (transaction.type === "income") {
      totals[currency].income += transaction.amount;
      totals[currency].net += transaction.amount;
    }

    if (transaction.type === "expense") {
      totals[currency].expenses += transaction.amount;
      totals[currency].net -= transaction.amount;
    }
  });

  return totals;
}

async function getTransactions(
  userId: string,
  search?: string,
  type?: string,
  category?: string,
  order?: "asc" | "desc",
  month?: string,
  year?: string
) {
  const dateRange = getDateRange(month, year);

  return prisma.transaction.findMany({
    where: {
      userId,
      ...(search && {
        description: {
          contains: search,
          mode: "insensitive",
        },
      }),
      ...(type &&
        type !== "all" && {
          type,
        }),
      ...(category &&
        category !== "all" && {
          categoryId: category,
        }),
      ...(dateRange && {
        date: {
          gte: dateRange.start,
          lt: dateRange.end,
        },
      }),
    },
    include: {
      category: true,
    },
    orderBy: {
      date: order ?? "desc",
    },
    take: 50,
  });
}

async function getCategories(userId: string) {
  return prisma.category.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

interface Props {
  searchParams: Promise<{
    search?: string;
    type?: string;
    category?: string;
    order?: "asc" | "desc";
    month?: string;
    year?: string;
  }>;
}

export default async function TransactionsPage({ searchParams }: Props) {
  const session = await auth();
  const params = await searchParams;

  const user = await prisma.user.findUnique({
    where: {
      email: session!.user!.email!,
    },
    select: {
      id: true,
    },
  });

  const [transactions, categories] = await Promise.all([
    getTransactions(
      user!.id,
      params.search,
      params.type,
      params.category,
      params.order,
      params.month,
      params.year
    ),
    getCategories(user!.id),
  ]);

  const hasActiveFilters = Boolean(
    params.search ||
      params.type ||
      params.category ||
      params.month ||
      params.year
  );

  const totals = calculateCurrencyTotals(transactions);

  const orderedForBalance =
    (params.order ?? "desc") === "desc"
      ? [...transactions].reverse()
      : [...transactions];

  const runningBalance = {
    ARS: 0,
    USD: 0,
  };

  const balanceMap = new Map<string, number>();

  orderedForBalance.forEach((transaction) => {
    const currency = transaction.currency as Currency;

    runningBalance[currency] +=
      transaction.type === "income" ? transaction.amount : -transaction.amount;

    balanceMap.set(transaction.id, runningBalance[currency]);
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
            Transacciones
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Registrá y analizá movimientos en ARS y USD
          </p>
        </div>

        <TransactionForm userId={user!.id} categories={categories} />
      </div>

      <TransactionFilters categories={categories} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border border-gray-200 bg-white shadow-none transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Resumen ARS
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="mb-1 text-xs text-gray-400 dark:text-gray-500">
                  Ingresos
                </p>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  +{formatMoney(totals.ARS.income, "ARS")}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs text-gray-400 dark:text-gray-500">
                  Gastos
                </p>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                  -{formatMoney(totals.ARS.expenses, "ARS")}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs text-gray-400 dark:text-gray-500">
                  Neto
                </p>
                <p
                  className={`text-sm font-semibold ${
                    totals.ARS.net >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {totals.ARS.net >= 0 ? "+" : "-"}
                  {formatMoney(Math.abs(totals.ARS.net), "ARS")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white shadow-none transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Resumen USD
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="mb-1 text-xs text-gray-400 dark:text-gray-500">
                  Ingresos
                </p>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  +{formatMoney(totals.USD.income, "USD")}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs text-gray-400 dark:text-gray-500">
                  Gastos
                </p>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                  -{formatMoney(totals.USD.expenses, "USD")}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs text-gray-400 dark:text-gray-500">
                  Neto
                </p>
                <p
                  className={`text-sm font-semibold ${
                    totals.USD.net >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {totals.USD.net >= 0 ? "+" : "-"}
                  {formatMoney(Math.abs(totals.USD.net), "USD")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-gray-200 bg-white shadow-none transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div>
              <p className="mb-1 text-xs text-gray-400 dark:text-gray-500">
                Movimientos
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {transactions.length}
              </p>
            </div>

            <div>
              <p className="mb-1 text-xs text-gray-400 dark:text-gray-500">
                Balance ARS filtrado
              </p>
              <p
                className={`text-sm font-semibold ${
                  totals.ARS.net >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {totals.ARS.net >= 0 ? "+" : "-"}
                {formatMoney(Math.abs(totals.ARS.net), "ARS")}
              </p>
            </div>

            <div>
              <p className="mb-1 text-xs text-gray-400 dark:text-gray-500">
                Balance USD filtrado
              </p>
              <p
                className={`text-sm font-semibold ${
                  totals.USD.net >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {totals.USD.net >= 0 ? "+" : "-"}
                {formatMoney(Math.abs(totals.USD.net), "USD")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 bg-white shadow-none transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Últimas transacciones
          </CardTitle>
        </CardHeader>

        <CardContent>
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-14 text-center dark:border-gray-800 dark:bg-gray-950/60">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <span className="text-lg text-gray-400 dark:text-gray-500">
                  —
                </span>
              </div>

              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {hasActiveFilters
                  ? "No encontré movimientos con esos filtros"
                  : "Todavía no registraste movimientos"}
              </h3>

              <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                {hasActiveFilters
                  ? "Probá ajustar la búsqueda, cambiar el mes, revisar la categoría o limpiar los filtros aplicados."
                  : "Creá tu primera transacción para empezar a ver tu actividad financiera organizada."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {Object.entries(
                transactions.reduce((groups, transaction) => {
                  const dateKey = new Date(transaction.date).toDateString();

                  if (!groups[dateKey]) {
                    groups[dateKey] = [];
                  }

                  groups[dateKey].push(transaction);

                  return groups;
                }, {} as Record<string, typeof transactions>)
              ).map(([date, transactionsByDate]) => {
                const transactionDate = new Date(date);
                const today = new Date();
                const yesterday = new Date();

                yesterday.setDate(today.getDate() - 1);

                let label = transactionDate.toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "short",
                });

                if (transactionDate.toDateString() === today.toDateString()) {
                  label = "Hoy";
                }

                if (
                  transactionDate.toDateString() === yesterday.toDateString()
                ) {
                  label = "Ayer";
                }

                return (
                  <div key={date} className="space-y-3">
                    <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 px-1 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        {label}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {transactionsByDate.map((transaction) => {
                        const transactionCurrency =
                          transaction.currency as Currency;

                        const balanceAfter =
                          balanceMap.get(transaction.id) ?? 0;

                        return (
                          <div
                            key={transaction.id}
                            className="rounded-2xl border border-gray-100 bg-white px-4 py-4 transition-all duration-200 hover:border-gray-200 hover:bg-gray-50/70 dark:border-gray-800 dark:bg-gray-950/40 dark:hover:border-gray-700 dark:hover:bg-gray-800/60 sm:px-4"
                          >
                            <div className="hidden sm:flex sm:items-center sm:justify-between">
                              <div className="flex flex-col gap-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {transaction.description || "Sin descripción"}
                                </span>

                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-500">
                                    {transaction.category?.name ||
                                      "Sin categoría"}
                                  </span>

                                  <span className="inline-flex w-fit items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
                                    {transactionCurrency}
                                  </span>

                                  {transaction.recurringTransactionId && (
                                    <span className="inline-flex w-fit items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-500 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
                                      Recurrente
                                    </span>
                                  )}
                                </div>

                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  Balance {transactionCurrency}:{" "}
                                  <span
                                    className={
                                      balanceAfter >= 0
                                        ? "text-emerald-500 dark:text-emerald-400"
                                        : "text-red-500 dark:text-red-400"
                                    }
                                  >
                                    {balanceAfter >= 0 ? "+" : "-"}
                                    {formatMoney(
                                      Math.abs(balanceAfter),
                                      transactionCurrency
                                    )}
                                  </span>
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={
                                    transaction.type === "income"
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                                      : "border-red-200 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
                                  }
                                >
                                  {transaction.type === "income" ? "+" : "-"}
                                  {formatMoney(
                                    transaction.amount,
                                    transactionCurrency
                                  )}
                                </Badge>

                                <EditTransaction
                                  transaction={transaction}
                                  categories={categories}
                                />

                                <DeleteTransaction id={transaction.id} />
                              </div>
                            </div>

                            <div className="flex flex-col gap-3 sm:hidden">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {transaction.description ||
                                      "Sin descripción"}
                                  </p>

                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <span className="inline-flex w-fit items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-500">
                                      {transaction.category?.name ||
                                        "Sin categoría"}
                                    </span>

                                    <span className="inline-flex w-fit items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
                                      {transactionCurrency}
                                    </span>

                                    {transaction.recurringTransactionId && (
                                      <span className="inline-flex w-fit items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-500 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
                                        Recurrente
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="shrink-0 text-right">
                                  <p
                                    className={`text-sm font-semibold ${
                                      transaction.type === "income"
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-red-600 dark:text-red-400"
                                    }`}
                                  >
                                    {transaction.type === "income" ? "+" : "-"}
                                    {formatMoney(
                                      transaction.amount,
                                      transactionCurrency
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  Balance {transactionCurrency}:{" "}
                                  <span
                                    className={
                                      balanceAfter >= 0
                                        ? "text-emerald-500 dark:text-emerald-400"
                                        : "text-red-500 dark:text-red-400"
                                    }
                                  >
                                    {balanceAfter >= 0 ? "+" : "-"}
                                    {formatMoney(
                                      Math.abs(balanceAfter),
                                      transactionCurrency
                                    )}
                                  </span>
                                </span>

                                <div className="flex items-center gap-1.5">
                                  <EditTransaction
                                    transaction={transaction}
                                    categories={categories}
                                  />

                                  <DeleteTransaction id={transaction.id} />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
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