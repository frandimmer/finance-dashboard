"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  id: string;
  name: string;
  transactionCount: number;
}

export function DeleteCategory({ id, name, transactionCount }: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setError("");

    try {
      setLoading(true);

      const response = await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("No se pudo eliminar la categoría.");
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("No se pudo eliminar. Revisá si la categoría está en uso.");
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
        onClick={() => setOpen(true)}
        className="text-gray-300 transition-colors hover:text-red-400"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Eliminar categoría</DialogTitle>

            <DialogDescription>
              Estás por eliminar <span className="font-medium">{name}</span>.{" "}
              {transactionCount > 0
                ? `Esta categoría tiene ${transactionCount} ${
                    transactionCount === 1 ? "transacción" : "transacciones"
                  } asociadas.`
                : "Esta categoría no tiene transacciones asociadas."}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-600">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>

            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
