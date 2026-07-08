"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Plus } from "lucide-react";

const ICONS = [
  "🍔",
  "🛒",
  "🚗",
  "🏠",
  "💊",
  "👕",
  "📱",
  "🎬",
  "✈️",
  "📚",
  "🏋️",
  "🐶",
  "☕",
  "🍕",
  "💡",
  "🎮",
  "💰",
  "💳",
  "🏦",
  "📦",
  "🎁",
  "🔧",
  "🌿",
  "🎵",
  "☕",
  "⛽",
  "🛒",
  "🍻",
  "🪩",
  "✂️",
  "🥩",
];

interface Props {
  userId: string;
}

function getInitialForm() {
  return {
    name: "",
    icon: "📁",
  };
}

export function CategoryForm({ userId }: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(getInitialForm());

  async function handleSubmit() {
    setError("");

    if (!form.name.trim()) {
      setError("Ingresá un nombre para la categoría.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          icon: form.icon,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo crear la categoría.");
      }

      setForm(getInitialForm());
      setOpen(false);
      router.refresh();
    } catch {
      setError("Ocurrió un error al guardar. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(value: boolean) {
    setOpen(value);

    if (!value) {
      setError("");
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button className="gap-2  dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
          <Plus className="h-4 w-4" />
          Nueva categoría
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Nueva categoría</SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-5 px-6">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-500">Nombre</span>

            <Input
              placeholder="Ej: Comida, Transporte, Sueldo..."
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              className="h-11 rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-gray-500">Ícono</span>

            <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-3">
              <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
                {ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setForm({ ...form, icon })}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg transition-all ${
                      form.icon === icon
                        ? "border-gray-900 bg-gray-900 text-white shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-600">{error}</p>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="h-11 w-full rounded-xl"
          >
            {loading ? "Guardando..." : "Guardar categoría"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}