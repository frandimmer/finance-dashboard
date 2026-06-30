import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TransactionForm } from "@/components/dashboard/transaction-form";
import { DeleteTransaction } from "@/components/dashboard/delete-transaction";
import { TransactionFilters } from "@/components/dashboard/transaction-filters";
import { EditTransaction } from "@/components/dashboard/edit-transaction";

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

  const [transactions, categories] = await Promise.all([
    getTransactions(
      session!.user!.id!,
      params.search,
      params.type,
      params.category,
      params.order,
      params.month,
      params.year
    ),
    getCategories(session!.user!.id!),
  ]);

  const totalIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalExpenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalFiltered = totalIncome - totalExpenses;

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Transacciones
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Registrá y analizá movimientos
          </p>
        </div>

        <TransactionForm userId={session!.user!.id!} categories={categories} />
      </div>

      <TransactionFilters categories={categories} />

      <Card className="bg-white border border-gray-200 shadow-none">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Ingresos</p>
              <p className="text-sm font-semibold text-emerald-600">
                +${totalIncome.toLocaleString("es-AR")}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Gastos</p>
              <p className="text-sm font-semibold text-red-600">
                -${totalExpenses.toLocaleString("es-AR")}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Movimientos</p>
              <p className="text-sm font-semibold text-gray-900">
                {transactions.length}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Neto filtrado</p>
              <p
                className={`text-sm font-semibold ${
                  totalFiltered >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {totalFiltered >= 0 ? "+" : "-"}$
                {Math.abs(totalFiltered).toLocaleString("es-AR")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200 shadow-none">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-500">
            Últimas transacciones
          </CardTitle>
        </CardHeader>

        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">
              No hay transacciones
            </p>
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
                  <div key={date}>
                    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-1 py-3">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        {label}
                      </span>
                    </div>

                    <div className="flex flex-col divide-y divide-gray-100">
                      {transactionsByDate.map((transaction) => {
                        const balanceAfter =
                          balanceMap.get(transaction.id) ?? 0;

                        return (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between py-4"
                          >
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium text-gray-900">
                                {transaction.description || "Sin descripción"}
                              </span>

                              <span className="text-xs text-gray-400">
                                {transaction.category?.name || "Sin categoría"}
                              </span>

                              <span className="text-xs text-gray-400">
                                Balance:{" "}
                                <span
                                  className={
                                    balanceAfter >= 0
                                      ? "text-emerald-500"
                                      : "text-red-500"
                                  }
                                >
                                  {balanceAfter >= 0 ? "+" : "-"}$
                                  {Math.abs(balanceAfter).toLocaleString(
                                    "es-AR"
                                  )}
                                </span>
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={
                                  transaction.type === "income"
                                    ? "text-emerald-600 border-emerald-200 bg-emerald-50"
                                    : "text-red-600 border-red-200 bg-red-50"
                                }
                              >
                                {transaction.type === "income" ? "+" : "-"}$
                                {transaction.amount.toLocaleString("es-AR")}
                              </Badge>

                              <EditTransaction
                                transaction={transaction}
                                categories={categories}
                              />

                              <DeleteTransaction id={transaction.id} />
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