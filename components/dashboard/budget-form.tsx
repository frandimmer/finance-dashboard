"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

interface Props {
  userId: string;
  categories: Category[];
  month: number;
  year: number;
}

type Currency = "ARS" | "USD";

function getInitialForm() {
  return {
    amount: "",
    currency: "ARS" as Currency,
    categoryId: "",
  };
}

function getCurrencySymbol(currency: Currency) {
  return currency === "USD" ? "US$" : "$";
}

export function BudgetForm({ userId, categories, month, year }: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(getInitialForm());

  const amountNumber = Number(form.amount);
  const isAmountValid =
    form.amount !== "" && !isNaN(amountNumber) && amountNumber > 0;

  const selectedCategory = categories.find(
    (category) => category.id === form.categoryId
  );

  async function handleSubmit() {
    setError("");

    if (!form.categoryId) {
      setError("Seleccioná una categoría.");
      return;
    }

    if (!isAmountValid) {
      setError("Ingresá un presupuesto válido mayor a 0.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNumber,
          currency: form.currency,
          month,
          year,
          userId,
          categoryId: form.categoryId,
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo guardar el presupuesto.");
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
          Nuevo presupuesto
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full border-gray-200 bg-white text-gray-950 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50 sm:max-w-md">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="text-gray-950 dark:text-gray-50">
            Nuevo presupuesto
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-5 px-6">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1 dark:bg-gray-900">
            <button
              type="button"
              onClick={() => setForm({ ...form, currency: "ARS" })}
              className={`h-10 rounded-xl text-sm font-medium transition-all ${
                form.currency === "ARS"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-50"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              ARS
            </button>

            <button
              type="button"
              onClick={() => setForm({ ...form, currency: "USD" })}
              className={`h-10 rounded-xl text-sm font-medium transition-all ${
                form.currency === "USD"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-50"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              USD
            </button>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 transition-colors dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
              Presupuesto mensual
            </span>

            <div className="mt-2 flex min-w-0 items-center gap-3">
              <span className="shrink-0 whitespace-nowrap text-2xl font-semibold text-gray-900 dark:text-gray-50">
                {getCurrencySymbol(form.currency)}
              </span>

              <input
                value={form.amount}
                onChange={(event) =>
                  setForm({ ...form, amount: event.target.value })
                }
                placeholder="0"
                inputMode="decimal"
                className="min-w-0 flex-1 bg-transparent text-3xl font-semibold text-gray-900 outline-none placeholder:text-gray-300 dark:text-gray-50 dark:placeholder:text-gray-700"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Categoría
            </span>

            {categories.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Primero necesitás crear una categoría para asignarle un
                  presupuesto.
                </p>
              </div>
            ) : (
              <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-gray-900/70">
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
                        ? "border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-950"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:text-gray-200"
                    }`}
                  >
                    {category.icon && <span>{category.icon}</span>}
                    {category.name}
                  </button>
                ))}
              </div>
            )}

            {selectedCategory && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Si ya existe un presupuesto en{" "}
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  {form.currency}
                </span>{" "}
                para{" "}
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  {selectedCategory.name}
                </span>{" "}
                este mes, se actualizará.
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 dark:border-red-500/20 dark:bg-red-500/10">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                {error}
              </p>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={loading || categories.length === 0}
            className="h-11 w-full rounded-xl"
          >
            {loading ? "Guardando..." : "Guardar presupuesto"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}