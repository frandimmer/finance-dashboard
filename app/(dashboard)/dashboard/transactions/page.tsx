import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TransactionForm } from "@/components/dashboard/transaction-form";
import { DeleteTransaction } from "@/components/dashboard/delete-transaction";

async function getTransactions(userId: string) {
  return prisma.transaction.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { date: "desc" },
    take: 50,
  });
}

async function getCategories(userId: string) {
  return prisma.category.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })
}

export default async function TransactionsPage() {
  const session = await auth()
  const [transactions, categories] = await Promise.all([
    getTransactions(session!.user!.id!),
    getCategories(session!.user!.id!),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Transacciones
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Registrá tus ingresos y gastos
          </p>
        </div>
        <TransactionForm userId={session!.user!.id!} categories={categories} />
      </div>

      <Card className="bg-white border border-gray-200 shadow-none">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-500">
            Últimas transacciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">
              No hay transacciones todavía
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {transactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex flex-col gap-0.5">
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
