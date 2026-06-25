import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CategoryForm } from "@/components/dashboard/category-form"
import { DeleteCategory } from "@/components/dashboard/delete-category"

async function getCategories(userId: string) {
  return prisma.category.findMany({
    where: { userId },
    include: { _count: { select: { transactions: true } } },
    orderBy: { createdAt: "desc" },
  })
}

export default async function CategoriesPage() {
  const session = await auth()
  const categories = await getCategories(session!.user!.id!)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Categorías</h1>
          <p className="text-gray-500 text-sm mt-1">
            Organizá tus transacciones por categoría
          </p>
        </div>
        <CategoryForm userId={session!.user!.id!} />
      </div>

      <Card className="bg-white border border-gray-200 shadow-none">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-500">
            Tus categorías
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">
              No hay categorías todavía
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cat.icon ?? "📁"}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {cat.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {cat._count.transactions} transacciones
                      </span>
                    </div>
                  </div>
                  <DeleteCategory id={cat.id} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}