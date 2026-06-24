import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { description, amount, type, date } = await req.json()

  const transaction = await prisma.transaction.create({
    data: {
      description,
      amount,
      type,
      date: new Date(date),
      userId: session.user!.id!,
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