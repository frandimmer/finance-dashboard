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
  "⛽",
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

  async function handleSubmit(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
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
        <Button className="gap-2 rounded-xl bg-gray-900 text-white shadow-sm transition-colors hover:bg-gray-800 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
          <Plus className="h-4 w-4" />
          Nueva categoría
        </Button>
      </SheetTrigger>

      <SheetContent className="flex h-dvh max-h-dvh w-full flex-col overflow-hidden border-gray-200 bg-white p-0 text-gray-950 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50 sm:max-w-md">
        <SheetHeader className="shrink-0 border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <SheetTitle className="text-gray-950 dark:text-gray-50">
            Nueva categoría
          </SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Nombre
                </span>

                <Input
                  placeholder="Ej: Comida, Transporte, Sueldo..."
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  className="h-11 rounded-xl border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-50 dark:placeholder:text-gray-600"
                />
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Ícono
                </span>

                <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-gray-900/70">
                  <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
                    {ICONS.map((icon, index) => (
                      <button
                        key={`${icon}-${index}`}
                        type="button"
                        onClick={() => setForm({ ...form, icon })}
                        className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg transition-all ${
                          form.icon === icon
                            ? "border-gray-900 bg-gray-900 text-white shadow-sm dark:border-gray-100 dark:bg-gray-100 dark:text-gray-950"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700 dark:hover:bg-gray-900"
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 dark:border-red-500/20 dark:bg-red-500/10">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-950">
            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-xl bg-gray-900 text-white shadow-sm transition-colors hover:bg-gray-800 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
            >
              {loading ? "Guardando..." : "Guardar categoría"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}