import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TransactionForm } from "@/components/dashboard/transaction-form";
import { DeleteTransaction } from "@/components/dashboard/delete-transaction";
import { TransactionFilters } from "@/components/dashboard/transaction-filters";
import { EditTransaction } from "@/components/dashboard/edit-transaction";
import {
  convertCurrency,
  getCurrencySymbol,
  type Currency,
} from "@/lib/finance";

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
      preferredCurrency: true,
    },
  });

  const currency = user!.preferredCurrency as Currency;

  const response = await fetch("http://localhost:3000/api/exchange-rate", {
    cache: "no-store",
  });

  const { rate } = await response.json();

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
    params.search || params.type || params.category || params.month || params.year
  );

  const totalIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalExpenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalFiltered = totalIncome - totalExpenses;

  const convertedTotalIncome = convertCurrency(totalIncome, currency, rate);
  const convertedTotalExpenses = convertCurrency(totalExpenses, currency, rate);
  const convertedTotalFiltered = convertCurrency(totalFiltered, currency, rate);

  let runningBalance = 0;

  const orderedForBalance =
    (params.order ?? "desc") === "desc"
      ? [...transactions].reverse()
      : [...transactions];

  const balanceMap = new Map<string, number>();

  orderedForBalance.forEach((transaction) => {
    runningBalance +=
      transaction.type === "income"
        ? transaction.amount
        : -transaction.amount;

    balanceMap.set(transaction.id, runningBalance);
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Transacciones
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Registrá y analizá movimientos
          </p>
        </div>

        <TransactionForm userId={user!.id} categories={categories} />
      </div>

      <TransactionFilters categories={categories} />

      <Card className="border border-gray-200 bg-white shadow-none">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="mb-1 text-xs text-gray-400">Ingresos</p>
              <p className="text-sm font-semibold text-emerald-600">
                +{formatMoney(convertedTotalIncome, currency)}
              </p>
            </div>

            <div>
              <p className="mb-1 text-xs text-gray-400">Gastos</p>
              <p className="text-sm font-semibold text-red-600">
                -{formatMoney(convertedTotalExpenses, currency)}
              </p>
            </div>

            <div>
              <p className="mb-1 text-xs text-gray-400">Movimientos</p>
              <p className="text-sm font-semibold text-gray-900">
                {transactions.length}
              </p>
            </div>

            <div>
              <p className="mb-1 text-xs text-gray-400">Neto filtrado</p>
              <p
                className={`text-sm font-semibold ${
                  convertedTotalFiltered >= 0
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {convertedTotalFiltered >= 0 ? "+" : "-"}
                {formatMoney(Math.abs(convertedTotalFiltered), currency)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 bg-white shadow-none">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-500">
            Últimas transacciones
          </CardTitle>
        </CardHeader>

        <CardContent>
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-14 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white">
                <span className="text-lg text-gray-400">—</span>
              </div>

              <h3 className="text-sm font-semibold text-gray-900">
                {hasActiveFilters
                  ? "No encontré movimientos con esos filtros"
                  : "Todavía no registraste movimientos"}
              </h3>

              <p className="mt-2 max-w-sm text-sm text-gray-500">
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

                if (transactionDate.toDateString() === yesterday.toDateString()) {
                  label = "Ayer";
                }

                return (
                  <div key={date} className="space-y-3">
                    <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 px-1 py-3 backdrop-blur">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        {label}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {transactionsByDate.map((transaction) => {
                        const balanceAfter = balanceMap.get(transaction.id) ?? 0;
                        const convertedBalanceAfter = convertCurrency(
                          balanceAfter,
                          currency,
                          rate
                        );
                        const convertedAmount = convertCurrency(
                          transaction.amount,
                          currency,
                          rate
                        );

                        return (
                          <div
                            key={transaction.id}
                            className="rounded-2xl border border-gray-100 bg-white px-4 py-4 transition-all duration-200 hover:border-gray-200 hover:bg-gray-50/70 sm:px-4"
                          >
                            <div className="hidden sm:flex sm:items-center sm:justify-between">
                              <div className="flex flex-col gap-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {transaction.description || "Sin descripción"}
                                </span>

                                <div className="flex items-center gap-2">
                                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-400">
                                    {transaction.category?.name ||
                                      "Sin categoría"}
                                  </span>
                                </div>

                                <span className="text-xs text-gray-400">
                                  Balance:{" "}
                                  <span
                                    className={
                                      convertedBalanceAfter >= 0
                                        ? "text-emerald-500"
                                        : "text-red-500"
                                    }
                                  >
                                    {convertedBalanceAfter >= 0 ? "+" : "-"}
                                    {formatMoney(
                                      Math.abs(convertedBalanceAfter),
                                      currency
                                    )}
                                  </span>
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={
                                    transaction.type === "income"
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                                      : "border-red-200 bg-red-50 text-red-600"
                                  }
                                >
                                  {transaction.type === "income" ? "+" : "-"}
                                  {formatMoney(convertedAmount, currency)}
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
                                  <p className="truncate text-sm font-medium text-gray-900">
                                    {transaction.description ||
                                      "Sin descripción"}
                                  </p>

                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <span className="inline-flex w-fit items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-400">
                                      {transaction.category?.name ||
                                        "Sin categoría"}
                                    </span>
                                  </div>
                                </div>

                                <div className="shrink-0 text-right">
                                  <p
                                    className={`text-sm font-semibold ${
                                      transaction.type === "income"
                                        ? "text-emerald-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {transaction.type === "income" ? "+" : "-"}
                                    {formatMoney(convertedAmount, currency)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                                <span className="text-xs text-gray-400">
                                  Balance:{" "}
                                  <span
                                    className={
                                      convertedBalanceAfter >= 0
                                        ? "text-emerald-500"
                                        : "text-red-500"
                                    }
                                  >
                                    {convertedBalanceAfter >= 0 ? "+" : "-"}
                                    {formatMoney(
                                      Math.abs(convertedBalanceAfter),
                                      currency
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