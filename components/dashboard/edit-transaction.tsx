"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { updateTransaction } from "@/app/actions/updateTransaction";

type Currency = "ARS" | "USD";

interface Props {
  transaction: {
    id: string;
    amount: number;
    description: string | null;
    type: string;
    currency: Currency;
    categoryId: string | null;
    date: Date;
  };
  categories: {
    id: string;
    name: string;
    icon?: string | null;
  }[];
}

function formatDateForInput(date: Date) {
  const localDate = new Date(date);
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const day = String(localDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrencySymbol(currency: Currency) {
  return currency === "USD" ? "US$" : "$";
}

export function EditTransaction({ transaction, categories }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    amount: transaction.amount.toString(),
    description: transaction.description || "",
    type: transaction.type,
    currency: transaction.currency,
    categoryId: transaction.categoryId || "",
    date: formatDateForInput(transaction.date),
  });

  const amountNumber = Number(form.amount);
  const isAmountValid =
    form.amount !== "" && !isNaN(amountNumber) && amountNumber > 0;

  function handleSubmit() {
    setError("");

    if (!isAmountValid) {
      setError("Ingresá un monto válido mayor a 0.");
      return;
    }

    if (!form.date) {
      setError("Seleccioná una fecha.");
      return;
    }

    startTransition(async () => {
      try {
        await updateTransaction({
          id: transaction.id,
          amount: amountNumber,
          description: form.description,
          type: form.type,
          currency: form.currency,
          categoryId: form.categoryId || null,
          date: form.date,
        });

        setOpen(false);
      } catch {
        setError("Ocurrió un error al guardar. Intentá nuevamente.");
      }
    });
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
        <button className="text-gray-300 transition-colors hover:text-blue-500 dark:text-gray-600 dark:hover:text-blue-400">
          <Pencil className="h-4 w-4" />
        </button>
      </SheetTrigger>

      <SheetContent className="w-full border-gray-200 bg-white text-gray-950 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50 sm:max-w-md">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="text-gray-950 dark:text-gray-50">
            Editar transacción
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-5 px-6">
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
            disabled={isPending}
            className="h-11 w-full rounded-xl"
          >
            {isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}