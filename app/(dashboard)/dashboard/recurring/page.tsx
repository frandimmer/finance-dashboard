import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecurringForm } from "@/components/dashboard/recurring-form";
import { DeleteRecurring } from "@/components/dashboard/delete-recurring";
import { ToggleRecurring } from "@/components/dashboard/toggle-recurring";
import { RegisterRecurringButton } from "@/components/dashboard/register-recurring-button";
import { getCurrencySymbol, type Currency } from "@/lib/finance";

function getCurrentMonthLabel() {
  const now = new Date();

  return now.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });
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

async function getRecurringData(userId: string) {
  const [recurringTransactions, categories] = await Promise.all([
    prisma.recurringTransaction.findMany({
      where: { userId },
      include: {
        category: true,
        transactions: {
          orderBy: {
            date: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.category.findMany({
      where: { userId },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const activeRecurring = recurringTransactions.filter(
    (recurring) => recurring.isActive
  );

  const monthlyTotals = {
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

  activeRecurring.forEach((recurring) => {
    const currency = recurring.currency as Currency;

    if (recurring.type === "income") {
      monthlyTotals[currency].income += recurring.amount;
      monthlyTotals[currency].net += recurring.amount;
    }

    if (recurring.type === "expense") {
      monthlyTotals[currency].expenses += recurring.amount;
      monthlyTotals[currency].net -= recurring.amount;
    }
  });

  return {
    recurringTransactions,
    categories,
    activeCount: activeRecurring.length,
    inactiveCount: recurringTransactions.length - activeRecurring.length,
    monthlyTotals,
  };
}

export default async function RecurringPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;
  const data = await getRecurringData(userId);
  const monthLabel = getCurrentMonthLabel();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Recurrentes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Creá plantillas para gastos e ingresos frecuentes y registralos
            individualmente cuando ocurran
          </p>
        </div>

        <RecurringForm userId={userId} categories={data.categories} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border border-gray-200 bg-white shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Recurrentes ARS
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="mb-1 text-xs text-gray-400">Ingresos</p>
                <p className="text-sm font-semibold text-emerald-600">
                  +{formatMoney(data.monthlyTotals.ARS.income, "ARS")}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs text-gray-400">Gastos</p>
                <p className="text-sm font-semibold text-red-600">
                  -{formatMoney(data.monthlyTotals.ARS.expenses, "ARS")}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs text-gray-400">Neto</p>
                <p
                  className={`text-sm font-semibold ${
                    data.monthlyTotals.ARS.net >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {data.monthlyTotals.ARS.net >= 0 ? "+" : "-"}
                  {formatMoney(Math.abs(data.monthlyTotals.ARS.net), "ARS")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Recurrentes USD
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="mb-1 text-xs text-gray-400">Ingresos</p>
                <p className="text-sm font-semibold text-emerald-600">
                  +{formatMoney(data.monthlyTotals.USD.income, "USD")}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs text-gray-400">Gastos</p>
                <p className="text-sm font-semibold text-red-600">
                  -{formatMoney(data.monthlyTotals.USD.expenses, "USD")}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs text-gray-400">Neto</p>
                <p
                  className={`text-sm font-semibold ${
                    data.monthlyTotals.USD.net >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {data.monthlyTotals.USD.net >= 0 ? "+" : "-"}
                  {formatMoney(Math.abs(data.monthlyTotals.USD.net), "USD")}
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
              <p className="mb-1 text-xs text-gray-400">Activos</p>
              <p className="text-sm font-semibold text-gray-900">
                {data.activeCount}
              </p>
            </div>

            <div>
              <p className="mb-1 text-xs text-gray-400">Inactivos</p>
              <p className="text-sm font-semibold text-gray-900">
                {data.inactiveCount}
              </p>
            </div>

            <div>
              <p className="mb-1 text-xs text-gray-400">Monedas activas</p>
              <p className="text-sm font-semibold text-gray-900">ARS / USD</p>
            </div>

            <div>
              <p className="mb-1 text-xs text-gray-400">Mes actual</p>
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
            Plantillas recurrentes
          </CardTitle>
        </CardHeader>

        <CardContent>
          {data.recurringTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-14 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white">
                <span className="text-lg text-gray-400">—</span>
              </div>

              <h3 className="text-sm font-semibold text-gray-900">
                Todavía no creaste recurrentes
              </h3>

              <p className="mt-2 max-w-sm text-sm text-gray-500">
                Agregá gastos frecuentes como alquiler, internet, gimnasio,
                peluquería o suscripciones y registralos cuando ocurran.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {data.recurringTransactions.map((recurring) => {
                const recurringCurrency = recurring.currency as Currency;

                return (
                  <div
                    key={recurring.id}
                    className={`rounded-2xl border bg-white p-4 transition-all duration-200 hover:bg-gray-50/70 ${
                      recurring.isActive
                        ? "border-gray-100 hover:border-gray-200"
                        : "border-gray-100 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-xl">
                          {recurring.category?.icon || "🔁"}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {recurring.name}
                            </p>

                            <span className="inline-flex w-fit items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium text-gray-500">
                              {recurringCurrency}
                            </span>

                            {!recurring.isActive && (
                              <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                                Pausado
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs text-gray-400">
                            {recurring.category?.name || "Sin categoría"} · Día
                            sugerido {recurring.dayOfMonth}
                          </p>
                        </div>
                      </div>

                      <p
                        className={`shrink-0 text-sm font-semibold ${
                          recurring.type === "income"
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {recurring.type === "income" ? "+" : "-"}
                        {formatMoney(recurring.amount, recurringCurrency)}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-xs text-gray-400">
                        {recurring.transactions.length > 0
                          ? `Último registrado: ${new Date(
                              recurring.transactions[0].date
                            ).toLocaleDateString("es-AR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}`
                          : "Aún no registrado"}
                      </span>

                      <div className="flex flex-wrap items-center gap-2">
                        <RegisterRecurringButton
                          recurringId={recurring.id}
                          disabled={!recurring.isActive}
                        />

                        <ToggleRecurring
                          id={recurring.id}
                          userId={userId}
                          isActive={recurring.isActive}
                        />

                        <RecurringForm
                          userId={userId}
                          categories={data.categories}
                          recurring={{
                            id: recurring.id,
                            name: recurring.name,
                            amount: recurring.amount,
                            currency: recurringCurrency,
                            type: recurring.type,
                            dayOfMonth: recurring.dayOfMonth,
                            categoryId: recurring.categoryId,
                          }}
                        />

                        <DeleteRecurring id={recurring.id} userId={userId} />
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