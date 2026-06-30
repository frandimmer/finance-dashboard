"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

interface Props {
  id: string
  amount: number
  description: string
  type: string
  categoryId: string | null
  date: string
}

export async function updateTransaction({
  id,
  amount,
  description,
  type,
  categoryId,
  date,
}: Props) {
  await prisma.transaction.update({
    where: { id },
    data: {
      amount,
      description,
      type,
      categoryId,
      date: new Date(`${date}T12:00:00`),
    },
  })

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/transactions")
}