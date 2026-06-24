"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Plus } from "lucide-react"

interface Props {
  userId: string
}

export function TransactionForm({ userId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    description: "",
    amount: "",
    type: "expense",
    date: new Date().toISOString().split("T")[0],
  })

  async function handleSubmit() {
    if (!form.amount || isNaN(Number(form.amount))) return
    setLoading(true)

    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: Number(form.amount), userId }),
    })

    setLoading(false)
    setOpen(false)
    setForm({ description: "", amount: "", type: "expense", date: new Date().toISOString().split("T")[0] })
    router.refresh()
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva transacción
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Nueva transacción</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 mt-6 px-6">
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

          <Input
            placeholder="Descripción"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <Input
            placeholder="Monto"
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />

          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}