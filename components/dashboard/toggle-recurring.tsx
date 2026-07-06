"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PauseCircle, PlayCircle } from "lucide-react";

interface Props {
  id: string;
  userId: string;
  isActive: boolean;
}

export function ToggleRecurring({ id, userId, isActive }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    try {
      setLoading(true);

      await fetch("/api/recurring", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          userId,
          isActive: !isActive,
        }),
      });

      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`transition-colors ${
        isActive
          ? "text-gray-300 hover:text-amber-500"
          : "text-gray-300 hover:text-emerald-500"
      }`}
      title={isActive ? "Pausar recurrente" : "Activar recurrente"}
    >
      {isActive ? (
        <PauseCircle className="h-4 w-4" />
      ) : (
        <PlayCircle className="h-4 w-4" />
      )}
    </button>
  );
}