import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetForm } from "@/components/dashboard/budget-form";
import { DeleteBudget } from "@/components/dashboard/delete-budget";
import { getCurrencySymbol, type Currency } from "@/lib/finance";

function getCurrentMonth() {
  const now = new Date();

  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  };
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

async function getBudgetData(userId: string) {
  const currentMonth = getCurrentMonth();

  const [categories, budgets, transactions] = await Promise.all([
    prisma.category.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.budget.findMany({
      where: {
        userId,
        month: currentMonth.month,
        year: currentMonth.year,
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
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
      include: {
        category: true,
      },
    }),
  ]);

  const spentByCategoryAndCurrency = new Map<string, number>();

  transactions.forEach((transaction) => {
    if (!transaction.categoryId) return;

    const currency = transaction.currency as Currency;
    const key = `${transaction.categoryId}-${currency}`;
    const current = spentByCategoryAndCurrency.get(key) ?? 0;

    spentByCategoryAndCurrency.set(key, current + transaction.amount);
  });

  const budgetRows = budgets.map((budget) => {
    const currency = budget.currency as Currency;
    const key = `${budget.categoryId}-${currency}`;
    const spent = spentByCategoryAndCurrency.get(key) ?? 0;
    const remaining = budget.amount - spent;
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

    return {
      id: budget.id,
      amount: budget.amount,
      currency,
      spent,
      remaining,
      percentage,
      category: budget.category,
    };
  });

  const totals = {
    ARS: {
      budget: 0,
      spent: 0,
      remaining: 0,
    },
    USD: {
      budget: 0,
      spent: 0,
      remaining: 0,
    },
  };

  budgetRows.forEach((budget) => {
    totals[budget.currency].budget += budget.amount;
    totals[budget.currency].spent += budget.spent;
    totals[budget.currency].remaining += budget.remaining;
  });

  const overBudgetCount = budgetRows.filter(
    (budget) => budget.spent > budget.amount
  ).length;

  return {
    month: currentMonth.month,
    year: currentMonth.year,
    categories,
    budgets: budgetRows,
    totals,
    overBudgetCount,
  };
}

function getProgressColor(percentage: number) {
  if (percentage >= 100) return "bg-red-500";
  if (percentage >= 80) return "bg-amber-500";
  return "bg-emerald-500";
}

function getTextColor(percentage: number) {
  if (percentage >= 100) return "text-red-600";
  if (percentage >= 80) return "text-amber-600";
  return "text-emerald-600";
}

export default async function BudgetsPage() {
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

  const data = await getBudgetData(user!.id);

  const monthLabel = new Date(data.year, data.month - 1).toLocaleDateString(
    "es-AR",
    {
      month: "long",
      year: "numeric",
    }
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Presupuestos
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Controlá cuánto querés gastar por categoría en {monthLabel}
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <BudgetForm
            userId={user!.id}
            categories={data.categories}
            month={data.month}
            year={data.year}
          />

          <div className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-500 shadow-sm">
            USD · $ {rate.toLocaleString("es-AR")}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border border-gray-200 bg-white shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Resumen ARS
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="mb-1 text-xs text-gray-400">Presupuestado</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatMoney(data.totals.ARS.budget, "ARS")}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs text-gray-400">Gastado</p>
                <p className="text-sm font-semibold text-red-600">
                  {formatMoney(data.totals.ARS.spent, "ARS")}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs text-gray-400">Restante</p>
                <p
                  className={`text-sm font-semibold ${
                    data.totals.ARS.remaining >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {formatMoney(data.totals.ARS.remaining, "ARS")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Resumen USD
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="mb-1 text-xs text-gray-400">Presupuestado</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatMoney(data.totals.USD.budget, "USD")}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs text-gray-400">Gastado</p>
                <p className="text-sm font-semibold text-red-600">
                  {formatMoney(data.totals.USD.spent, "USD")}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs text-gray-400">Restante</p>
                <p
                  className={`text-sm font-semibold ${
                    data.totals.USD.remaining >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {formatMoney(data.totals.USD.remaining, "USD")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-gray-200 bg-white shadow-none">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="mb-1 text-xs text-gray-400">Presupuestos</p>
              <p className="text-sm font-semibold text-gray-900">
                {data.budgets.length}
              </p>
            </div>

            <div>
              <p className="mb-1 text-xs text-gray-400">Excedidos</p>
              <p className="text-sm font-semibold text-gray-900">
                {data.overBudgetCount}
              </p>
            </div>

            <div>
              <p className="mb-1 text-xs text-gray-400">Monedas activas</p>
              <p className="text-sm font-semibold text-gray-900">ARS / USD</p>
            </div>

            <div>
              <p className="mb-1 text-xs text-gray-400">Mes</p>
              <p className="text-sm font-semibold text-gray-900">
                {monthLabel}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 bg-white shadow-none">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-500">
            Presupuestos del mes
          </CardTitle>
        </CardHeader>

        <CardContent>
          {data.budgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-14 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white">
                <span className="text-lg text-gray-400">—</span>
              </div>

              <h3 className="text-sm font-semibold text-gray-900">
                Todavía no creaste presupuestos
              </h3>

              <p className="mt-2 max-w-sm text-sm text-gray-500">
                Definí un límite mensual para categorías como Comida,
                Transporte, Salidas o Viajes y empezá a controlar mejor tus
                gastos por moneda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {data.budgets.map((budget) => {
                const cappedPercentage = Math.min(budget.percentage, 100);

                return (
                  <div
                    key={budget.id}
                    className="rounded-2xl border border-gray-100 bg-white p-4 transition-all duration-200 hover:border-gray-200 hover:bg-gray-50/70"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-xl">
                          {budget.category.icon || "📁"}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {budget.category.name}
                            </p>

                            <span className="inline-flex w-fit items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium text-gray-500">
                              {budget.currency}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-gray-400">
                            {formatMoney(budget.spent, budget.currency)} de{" "}
                            {formatMoney(budget.amount, budget.currency)}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <p
                          className={`text-sm font-semibold ${getTextColor(
                            budget.percentage
                          )}`}
                        >
                          {Math.round(budget.percentage)}%
                        </p>

                        <DeleteBudget id={budget.id} />
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full ${getProgressColor(
                            budget.percentage
                          )}`}
                          style={{ width: `${cappedPercentage}%` }}
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-gray-400">Restante</span>
                        <span
                          className={
                            budget.remaining >= 0
                              ? "font-medium text-emerald-600"
                              : "font-medium text-red-600"
                          }
                        >
                          {formatMoney(budget.remaining, budget.currency)}
                        </span>
                      </div>
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