"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  id: string;
}

export function DeleteBudget({ id }: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setError("");

    try {
      setLoading(true);

      const response = await fetch("/api/budgets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("No se pudo eliminar el presupuesto.");
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("No se pudo eliminar el presupuesto. Intentá nuevamente.");
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
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-gray-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
        aria-label="Eliminar presupuesto"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="rounded-2xl border-gray-200 bg-white text-gray-950 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-50">
          <DialogHeader>
            <DialogTitle className="text-gray-950 dark:text-gray-50">
              Eliminar presupuesto
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Esta acción eliminará el presupuesto mensual de esta categoría. No
              se eliminarán las transacciones asociadas.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 dark:border-red-500/20 dark:bg-red-500/10">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                {error}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Cancelar
            </Button>

            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
            >
              {loading ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}