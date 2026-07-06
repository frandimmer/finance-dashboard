"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  userId: string;
  monthLabel: string;
}

export function GenerateRecurringButton({ userId, monthLabel }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleGenerate() {
    setMessage("");

    try {
      setLoading(true);

      const response = await fetch("/api/recurring/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error("No se pudieron generar los recurrentes.");
      }

      if (data.createdCount === 0 && data.skippedCount > 0) {
        setMessage("Ya estaban generados para este mes.");
      } else if (data.createdCount === 0) {
        setMessage("No hay recurrentes activos para generar.");
      } else {
        setMessage(
          `${data.createdCount} generado${
            data.createdCount === 1 ? "" : "s"
          } para ${monthLabel}.`
        );
      }

      router.refresh();
    } catch {
      setMessage("No se pudieron generar. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={handleGenerate}
        disabled={loading}
        className="gap-2 rounded-xl"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Generando..." : "Generar mes"}
      </Button>

      {message && (
        <p className="absolute right-0 top-[calc(100%+0.35rem)] w-56 text-right text-xs font-medium text-gray-400">
          {message}
        </p>
      )}
    </div>
  );
}