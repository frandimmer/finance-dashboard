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

interface Props {
  transaction: {
    id: string;
    amount: number;
    description: string | null;
    type: string;
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

export function EditTransaction({ transaction, categories }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    amount: transaction.amount.toString(),
    description: transaction.description || "",
    type: transaction.type,
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
        <button className="text-gray-300 transition-colors hover:text-blue-500">
          <Pencil className="h-4 w-4" />
        </button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Editar transacción</SheetTitle>
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