import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryForm } from "@/components/dashboard/category-form";
import { DeleteCategory } from "@/components/dashboard/delete-category";

async function getCategories(userId: string) {
  return prisma.category.findMany({
    where: { userId },
    include: {
      _count: {
        select: {
          transactions: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function CategoriesPage() {
  const session = await auth();
  const categories = await getCategories(session!.user!.id!);

  const totalTransactions = categories.reduce(
    (sum, category) => sum + category._count.transactions,
    0
  );

  const usedCategories = categories.filter(
    (category) => category._count.transactions > 0
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
            Categorías
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Organizá tus movimientos para entender mejor tus finanzas
          </p>
        </div>

        <CategoryForm userId={session!.user!.id!} />
      </div>

      <Card className="border border-gray-200 bg-white shadow-none transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div>
              <p className="mb-1 text-xs text-gray-400 dark:text-gray-500">
                Categorías
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {categories.length}
              </p>
            </div>

            <div>
              <p className="mb-1 text-xs text-gray-400 dark:text-gray-500">
                En uso
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {usedCategories}
              </p>
            </div>

            <div>
              <p className="mb-1 text-xs text-gray-400 dark:text-gray-500">
                Movimientos asociados
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {totalTransactions}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 bg-white shadow-none transition-colors duration-200 dark:border-gray-800 dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Tus categorías
          </CardTitle>
        </CardHeader>

        <CardContent>
          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-14 text-center dark:border-gray-800 dark:bg-gray-950/60">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <span className="text-lg text-gray-400 dark:text-gray-500">
                  —
                </span>
              </div>

              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Todavía no creaste categorías
              </h3>

              <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                Creá categorías como Comida, Transporte, Sueldo o Alquiler para
                clasificar mejor tus movimientos.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-4 transition-all duration-200 hover:border-gray-200 hover:bg-gray-50/70 dark:border-gray-800 dark:bg-gray-950/40 dark:hover:border-gray-700 dark:hover:bg-gray-800/60"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-xl dark:border-gray-800 dark:bg-gray-900">
                      {category.icon || "📁"}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {category.name}
                      </p>

                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        {category._count.transactions === 1
                          ? "1 transacción"
                          : `${category._count.transactions} transacciones`}
                      </p>
                    </div>
                  </div>

                  <DeleteCategory
                    id={category.id}
                    name={category.name}
                    transactionCount={category._count.transactions}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}