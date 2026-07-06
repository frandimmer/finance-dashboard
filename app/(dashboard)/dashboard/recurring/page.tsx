import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecurringForm } from "@/components/dashboard/recurring-form";
import { DeleteRecurring } from "@/components/dashboard/delete-recurring";
import { ToggleRecurring } from "@/components/dashboard/toggle-recurring";
import { GenerateRecurringButton } from "@/components/dashboard/generate-recurring-button";

function getCurrentMonthLabel() {
  const now = new Date();

  return now.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });
}

function formatMoney(amount: number) {
  return `$ ${amount.toLocaleString("es-AR", {
    maximumFractionDigits: 0,
  })}`;
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

  const monthlyIncome = activeRecurring
    .filter((recurring) => recurring.type === "income")
    .reduce((sum, recurring) => sum + recurring.amount, 0);

  const monthlyExpenses = activeRecurring
    .filter((recurring) => recurring.type === "expense")
    .reduce((sum, recurring) => sum + recurring.amount, 0);

  return {
    recurringTransactions,
    categories,
    activeCount: activeRecurring.length,
    inactiveCount: recurringTransactions.length - activeRecurring.length,
    monthlyIncome,
    monthlyExpenses,
    monthlyNet: monthlyIncome - monthlyExpenses,
  };
}

export default async function RecurringPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const data = await getRecurringData(userId);
  const monthLabel = getCurrentMonthLabel();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Recurrentes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Creá plantillas para gastos e ingresos que se repiten todos los meses
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <GenerateRecurringButton userId={userId} monthLabel={monthLabel} />

          <RecurringForm userId={userId} categories={data.categories} />
        </div>
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
              <p className="mb-1 text-xs text-gray-400">Gastos mensuales</p>
              <p className="text-sm font-semibold text-red-600">
                {formatMoney(data.monthlyExpenses)}
              </p>
            </div>

            <div>
              <p className="mb-1 text-xs text-gray-400">Neto recurrente</p>
              <p
                className={`text-sm font-semibold ${
                  data.monthlyNet >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {formatMoney(data.monthlyNet)}
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
                Agregá gastos fijos como alquiler, internet, gimnasio o
                suscripciones para generarlos cada mes con un clic.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {data.recurringTransactions.map((recurring) => (
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
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {recurring.name}
                          </p>

                          {!recurring.isActive && (
                            <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                              Pausado
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-gray-400">
                          {recurring.category?.name || "Sin categoría"} · Día{" "}
                          {recurring.dayOfMonth} de cada mes
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
                      {formatMoney(recurring.amount)}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                    <span className="text-xs text-gray-400">
                      {recurring.transactions.length > 0
                        ? `Último generado: ${new Date(
                            recurring.transactions[0].date
                          ).toLocaleDateString("es-AR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}`
                        : "Aún no generado"}
                    </span>

                    <div className="flex items-center gap-3">
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
                          type: recurring.type,
                          dayOfMonth: recurring.dayOfMonth,
                          categoryId: recurring.categoryId,
                        }}
                      />

                      <DeleteRecurring id={recurring.id} userId={userId} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}