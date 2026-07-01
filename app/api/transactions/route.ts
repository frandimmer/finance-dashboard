import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { description, amount, type, date, categoryId } = await req.json()

  const transaction = await prisma.transaction.create({
    data: {
      description,
      amount,
      type,
      date: new Date(`${date}T12:00:00`),
      userId: session.user!.id!,
      categoryId: categoryId ?? null,
    },
  })

  return NextResponse.json(transaction)
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()

  await prisma.transaction.delete({
    where: { id, userId: session.user!.id! },
  })

  return NextResponse.json({ ok: true })
}