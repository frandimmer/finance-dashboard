import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, icon } = await req.json()

  const category = await prisma.category.create({
    data: {
      name,
      icon,
      userId: session.user!.id!,
    },
  })

  return NextResponse.json(category)
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()

  await prisma.category.delete({
    where: { id, userId: session.user!.id! },
  })

  return NextResponse.json({ ok: true })
}