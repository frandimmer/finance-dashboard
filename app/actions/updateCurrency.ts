"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function updateCurrency(currency: "ARS" | "USD") {
  const session = await auth()

  console.log("SESSION:", session?.user?.email)
  console.log("NEW CURRENCY:", currency)

  if (!session?.user?.email) {
    throw new Error("Unauthorized")
  }

  const updated = await prisma.user.update({
    where: {
      email: session.user.email,
    },
    data: {
      preferredCurrency: currency,
    },
  })

  console.log("UPDATED:", updated.preferredCurrency)
}