"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

interface UpdateTransactionInput {
  id: string
  amount: number
  description?: string
  type: string
  categoryId?: string
}

export async function updateTransaction(
  data: UpdateTransactionInput
) {
  await prisma.transaction.update({
    where: {
      id: data.id,
    },
    data: {
      amount: data.amount,
      description: data.description,
      type: data.type,
      categoryId: data.categoryId || null,
    },
  })

  revalidatePath("/dashboard/transactions")
  revalidatePath("/dashboard")
}