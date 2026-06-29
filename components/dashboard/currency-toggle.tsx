"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateCurrency } from "@/app/actions/updateCurrency"
import { ArrowLeftRight } from "lucide-react"

type Props = {
  current: "ARS" | "USD"
}

export function CurrencyToggle({ current }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const next = current === "ARS" ? "USD" : "ARS"

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await updateCurrency(next)
          router.refresh()
        })
      }
      disabled={isPending}
      className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white hover:bg-gray-50 text-sm font-medium transition-all active:scale-95"
    >
      <ArrowLeftRight className="w-4 h-4" />
      {current}
    </button>
  )
}