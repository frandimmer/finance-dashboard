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

type Currency = "ARS" | "USD";

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
    currency: "ARS" as Currency,
    date: getTodayDate(),
    categoryId: "",
  };
}

function getCurrencySymbol(currency: Currency) {
  return currency === "USD" ? "US$" : "$";
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

  async function handleSubmit(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
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
        <Button className="gap-2 rounded-xl bg-gray-900 text-white shadow-sm transition-colors hover:bg-gray-800 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
          <Plus className="h-4 w-4" />
          Nueva transacción
        </Button>
      </SheetTrigger>

      <SheetContent className="flex h-dvh max-h-dvh w-full flex-col overflow-hidden border-gray-200 bg-white p-0 text-gray-950 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50 sm:max-w-md">
        <SheetHeader className="shrink-0 border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <SheetTitle className="text-gray-950 dark:text-gray-50">
            Nueva transacción
          </SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1 dark:bg-gray-900">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: "expense" })}
                  className={`h-10 rounded-xl text-sm font-medium transition-all ${
                    form.type === "expense"
                      ? "bg-white text-red-600 shadow-sm dark:bg-gray-800 dark:text-red-400"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  Gasto
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: "income" })}
                  className={`h-10 rounded-xl text-sm font-medium transition-all ${
                    form.type === "income"
                      ? "bg-white text-emerald-600 shadow-sm dark:bg-gray-800 dark:text-emerald-400"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  Ingreso
                </button>
              </div>

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
                  Monto
                </span>

                <div className="mt-2 flex min-w-0 items-center gap-3">
                  <span
                    className={`shrink-0 whitespace-nowrap text-2xl font-semibold ${
                      form.type === "income"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {form.type === "income" ? "+" : "-"}
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

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Descripción
                </span>

                <Input
                  placeholder="Ej: Supermercado, sueldo, alquiler..."
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  className="h-11 rounded-xl border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-50 dark:placeholder:text-gray-600"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Fecha
                </span>

                <Input
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm({ ...form, date: event.target.value })
                  }
                  className="h-11 rounded-xl border-gray-200 bg-white text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-50"
                />
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Categoría opcional
                </span>

                {categories.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No tenés categorías creadas.{" "}
                      <Link
                        href="/dashboard/categories"
                        className="font-medium text-gray-900 hover:underline dark:text-gray-100"
                      >
                        Creá una acá
                      </Link>
                      .
                    </p>
                  </div>
                ) : (
                  <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-gray-900/70">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            categoryId:
                              form.categoryId === category.id
                                ? ""
                                : category.id,
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
              {loading ? "Guardando..." : "Guardar transacción"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}