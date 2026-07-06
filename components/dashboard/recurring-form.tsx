"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
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

interface Recurring {
  id: string;
  name: string;
  amount: number;
  type: string;
  dayOfMonth: number;
  categoryId: string | null;
}

interface Props {
  userId: string;
  categories: Category[];
  recurring?: Recurring;
}

function getInitialForm(recurring?: Recurring) {
  return {
    name: recurring?.name ?? "",
    amount: recurring?.amount.toString() ?? "",
    type: recurring?.type ?? "expense",
    dayOfMonth: recurring?.dayOfMonth.toString() ?? "1",
    categoryId: recurring?.categoryId ?? "",
  };
}

export function RecurringForm({ userId, categories, recurring }: Props) {
  const router = useRouter();

  const isEditing = Boolean(recurring);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(getInitialForm(recurring));

  const amountNumber = Number(form.amount);
  const dayNumber = Number(form.dayOfMonth);

  const isAmountValid =
    form.amount !== "" && !isNaN(amountNumber) && amountNumber > 0;

  const isDayValid =
    form.dayOfMonth !== "" &&
    !isNaN(dayNumber) &&
    dayNumber >= 1 &&
    dayNumber <= 31;

  async function handleSubmit() {
    setError("");

    if (!form.name.trim()) {
      setError("Ingresá un nombre.");
      return;
    }

    if (!isAmountValid) {
      setError("Ingresá un monto válido mayor a 0.");
      return;
    }

    if (!isDayValid) {
      setError("Ingresá un día del mes entre 1 y 31.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: recurring?.id,
          name: form.name.trim(),
          amount: amountNumber,
          type: form.type,
          dayOfMonth: dayNumber,
          userId,
          categoryId: form.categoryId || null,
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo guardar el recurrente.");
      }

      setOpen(false);

      if (!isEditing) {
        setForm(getInitialForm());
      }

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
      setForm(getInitialForm(recurring));
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {isEditing ? (
          <button className="text-gray-300 transition-colors hover:text-blue-500">
            <Pencil className="h-4 w-4" />
          </button>
        ) : (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo recurrente
          </Button>
        )}
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>
            {isEditing ? "Editar recurrente" : "Nuevo recurrente"}
          </SheetTitle>
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
            <span className="text-xs font-medium text-gray-400">
              Monto recurrente
            </span>

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
            <span className="text-sm font-medium text-gray-500">Nombre</span>

            <input
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              placeholder="Ej: Gimnasio, alquiler, internet..."
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 outline-none transition-all hover:border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-500">
              Día del mes
            </span>

            <input
              value={form.dayOfMonth}
              onChange={(event) =>
                setForm({ ...form, dayOfMonth: event.target.value })
              }
              placeholder="Ej: 10"
              inputMode="numeric"
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 outline-none transition-all hover:border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            />

            <p className="text-xs text-gray-400">
              Si el mes no tiene ese día, se genera el último día disponible.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-gray-500">
              Categoría opcional
            </span>

            {categories.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Podés crear el recurrente sin categoría y asignarla después.
                </p>
              </div>
            ) : (
              <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50/60 p-3">
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
            {loading
              ? "Guardando..."
              : isEditing
              ? "Guardar cambios"
              : "Guardar recurrente"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}