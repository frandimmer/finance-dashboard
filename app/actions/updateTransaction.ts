"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

interface Props {
  id: string;
  amount: number;
  description: string;
  type: string;
  currency: "ARS" | "USD";
  categoryId: string | null;
  date: string;
}

export async function updateTransaction({
  id,
  amount,
  description,
  type,
  currency,
  categoryId,
  date,
}: Props) {
  if (currency !== "ARS" && currency !== "USD") {
    throw new Error("Moneda inválida.");
  }

  await prisma.transaction.update({
    where: { id },
    data: {
      amount,
      description,
      type,
      currency,
      categoryId,
      date: new Date(`${date}T12:00:00`),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
}