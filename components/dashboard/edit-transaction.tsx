"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { updateTransaction } from "@/app/actions/updateTransaction"

interface Props {
  transaction: {
    id: string
    amount: number
    description: string | null
    type: string
    categoryId: string | null
    date: Date
  }
  categories: {
    id: string
    name: string
    icon?: string | null
  }[]
}

export function EditTransaction({
  transaction,
  categories,
}: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [form, setForm] = useState({
    amount: transaction.amount.toString(),
    description: transaction.description || "",
    type: transaction.type,
    categoryId: transaction.categoryId || "",
    date: new Date(transaction.date).toISOString().split("T")[0],
  })

  async function handleSubmit() {
    if (!form.amount || isNaN(Number(form.amount))) return

    startTransition(async () => {
      await updateTransaction({
        id: transaction.id,
        amount: Number(form.amount),
        description: form.description,
        type: form.type,
        categoryId: form.categoryId || null,
        date: form.date,
      })

      setOpen(false)
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {/* MODIFICADO: Mismo estilo base que el Delete, cambiando a azul en hover */}
        <button className="text-gray-300 hover:text-blue-500 transition-colors">
          <Pencil className="w-4 h-4" />
        </button>
      </SheetTrigger>

      <SheetContent>
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Editar transacción</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 mt-6 px-6">
          {/* TYPE */}
          <div className="flex gap-2">
            {["expense", "income"].map((type) => (
              <button
                key={type}
                onClick={() => setForm({ ...form, type })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  form.type === type
                    ? type === "income"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                    : "bg-gray-100 text-gray-500 border border-transparent"
                }`}
              >
                {type === "income" ? "Ingreso" : "Gasto"}
              </button>
            ))}
          </div>

          {/* DESCRIPTION */}
          <Input
            placeholder="Descripción"
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value,
              })
            }
          />

          {/* AMOUNT */}
          <Input
            placeholder="Monto"
            type="number"
            value={form.amount}
            onChange={(e) =>
              setForm({
                ...form,
                amount: e.target.value,
              })
            }
          />

          {/* DATE */}
          <Input
            type="date"
            value={form.date}
            onChange={(e) =>
              setForm({
                ...form,
                date: e.target.value,
              })
            }
          />

          {/* CATEGORIES */}
          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-500">
              Categoría (opcional)
            </span>

            {categories.length === 0 ? (
              <p className="text-xs text-gray-400">
                No tenés categorías creadas{" "}
                <Link
                  href="/dashboard/categories"
                  className="text-blue-500 hover:underline"
                >
                  Creá una acá
                </Link>
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() =>
                      setForm({
                        ...form,
                        categoryId:
                          form.categoryId === cat.id ? "" : cat.id,
                      })
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors border ${
                      form.categoryId === cat.id
                        ? "bg-blue-50 border-blue-300 text-blue-700"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {cat.icon && <span>{cat.icon}</span>}
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SAVE */}
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}