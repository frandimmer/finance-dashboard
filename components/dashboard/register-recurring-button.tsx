"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Loader2, Plus } from "lucide-react";

interface RegisterRecurringButtonProps {
  recurringId: string;
  disabled?: boolean;
}

export function RegisterRecurringButton({
  recurringId,
  disabled = false,
}: RegisterRecurringButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  async function handleRegister() {
    try {
      setLoading(true);
      setRegistered(false);

      const response = await fetch("/api/recurring/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recurringId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo registrar el recurrente.");
      }

      setRegistered(true);
      router.refresh();

      window.setTimeout(() => {
        setRegistered(false);
      }, 1800);
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "No se pudo registrar el recurrente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleRegister}
      disabled={loading || disabled}
      className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
        registered
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
          : "border-gray-200 bg-white text-gray-600 shadow-sm hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
      }`}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : registered ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Plus className="h-3.5 w-3.5" />
      )}

      {loading ? "Registrando..." : registered ? "Registrado" : "Registrar"}
    </button>
  );
}