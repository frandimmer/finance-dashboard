import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TransactionForm } from "@/components/dashboard/transaction-form";
import { DeleteTransaction } from "@/components/dashboard/delete-transaction";
import { TransactionFilters } from "@/components/dashboard/transaction-filters";
import { EditTransaction } from "@/components/dashboard/edit-transaction";

async function getTransactions(
  userId: string,
  search?: string,
  type?: string,
  category?: string,
  order?: "asc" | "desc",
) {
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
    ),
    getCategories(session!.user!.id!),
  ]);

  const totalFiltered = transactions.reduce((sum, t) => {
    return t.type === "income" ? sum + t.amount : sum - t.amount;
  }, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
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

      {/* FILTERS */}
      <TransactionFilters categories={categories} />

      {/* TOTAL FILTERED */}
      <Card className="bg-white border border-gray-200 shadow-none">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Balance filtrado</span>

            <span
              className={`text-lg font-semibold ${
                totalFiltered >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {totalFiltered >= 0 ? "+" : "-"}$
              {Math.abs(totalFiltered).toLocaleString("es-AR")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* TRANSACTIONS */}
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
            <div className="flex flex-col divide-y divide-gray-100">
              {transactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-4"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-gray-900">
                      {t.description || "Sin descripción"}
                    </span>

                    <span className="text-xs text-gray-400">
                      {new Date(t.date).toLocaleDateString("es-AR")}
                      {t.category && ` · ${t.category.name}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        t.type === "income"
                          ? "text-emerald-600 border-emerald-200 bg-emerald-50"
                          : "text-red-600 border-red-200 bg-red-50"
                      }
                    >
                      {t.type === "income" ? "+" : "-"}$
                      {t.amount.toLocaleString("es-AR")}
                    </Badge>

                    <EditTransaction transaction={t} categories={categories} />

                    <DeleteTransaction id={t.id} />
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
