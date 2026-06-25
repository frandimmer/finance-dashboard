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

const ICONS = [
  "🍔", "🛒", "🚗", "🏠", "💊", "👕", "📱", "🎬",
  "✈️", "📚", "🏋️", "🐶", "☕", "🍕", "💡", "🎮",
  "💰", "💳", "🏦", "📦", "🎁", "🔧", "🌿", "🎵",
]

interface Props {
  userId: string
}

export function CategoryForm({ userId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: "", icon: "" })

  async function handleSubmit() {
    if (!form.name.trim()) return
    setLoading(true)

    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, userId }),
    })

    setLoading(false)
    setOpen(false)
    setForm({ name: "", icon: "" })
    router.refresh()
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva categoría
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Nueva categoría</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 mt-6 px-6">
          <Input
            placeholder="Nombre (ej: Comida)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-500">Ícono</span>
            <div className="grid grid-cols-8 gap-1">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setForm({ ...form, icon })}
                  className={`text-xl p-1.5 rounded-lg transition-colors hover:bg-gray-100 ${
                    form.icon === icon ? "bg-blue-50 ring-1 ring-blue-300" : ""
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !form.name.trim()}
            className="w-full"
          >
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}