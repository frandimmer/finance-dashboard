"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

interface Props {
  userId: string;
  categories: Category[];
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getInitialForm() {
  return {
    description: "",
    amount: "",
    type: "expense",
    date: getTodayDate(),
    categoryId: "",
  };
}

export function TransactionForm({ userId, categories }: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(getInitialForm());

  const amountNumber = Number(form.amount);
  const isAmountValid =
    form.amount !== "" && !isNaN(amountNumber) && amountNumber > 0;

  async function handleSubmit() {
    setError("");

    if (!isAmountValid) {
      setError("Ingresá un monto válido mayor a 0.");
      return;
    }

    if (!form.date) {
      setError("Seleccioná una fecha.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: amountNumber,
          userId,
          categoryId: form.categoryId || null,
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo guardar la transacción.");
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
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva transacción
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Nueva transacción</SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-5 px-6">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setForm({ ...form, type: "expense" })}
              className={`h-10 rounded-xl text-sm font-medium transition-all ${
                form.type === "expense"
                  ? "bg-white text-red-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Gasto
            </button>

            <button
              type="button"
              onClick={() => setForm({ ...form, type: "income" })}
              className={`h-10 rounded-xl text-sm font-medium transition-all ${
                form.type === "income"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Ingreso
            </button>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <span className="text-xs font-medium text-gray-400">Monto</span>

            <div className="mt-2 flex items-center gap-2">
              <span
                className={`text-2xl font-semibold ${
                  form.type === "income" ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {form.type === "income" ? "+" : "-"}$
              </span>

              <input
                value={form.amount}
                onChange={(event) =>
                  setForm({ ...form, amount: event.target.value })
                }
                placeholder="0"
                inputMode="decimal"
                className="w-full bg-transparent text-3xl font-semibold text-gray-900 outline-none placeholder:text-gray-300"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-500">
              Descripción
            </span>

            <Input
              placeholder="Ej: Supermercado, sueldo, alquiler..."
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              className="h-11 rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-500">Fecha</span>

            <Input
              type="date"
              value={form.date}
              onChange={(event) =>
                setForm({ ...form, date: event.target.value })
              }
              className="h-11 rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-gray-500">
              Categoría (opcional)
            </span>

            {categories.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  No tenés categorías creadas.{" "}
                  <Link
                    href="/dashboard/categories"
                    className="font-medium text-gray-900 hover:underline"
                  >
                    Creá una acá
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50/60 p-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        categoryId:
                          form.categoryId === category.id ? "" : category.id,
                      })
                    }
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                      form.categoryId === category.id
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    {category.icon && <span>{category.icon}</span>}
                    {category.name}
                  </button>
                ))}
              </div>
            )}
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
            {loading ? "Guardando..." : "Guardar transacción"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}