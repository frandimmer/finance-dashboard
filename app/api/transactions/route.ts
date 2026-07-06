import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { description, amount, type, date, categoryId, currency } =
    await req.json();

  const parsedAmount = Number(amount);

  if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json(
      { error: "El monto debe ser mayor a 0." },
      { status: 400 }
    );
  }

  if (type !== "income" && type !== "expense") {
    return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
  }

  if (currency !== "ARS" && currency !== "USD") {
    return NextResponse.json({ error: "Moneda inválida." }, { status: 400 });
  }

  if (!date) {
    return NextResponse.json({ error: "Fecha inválida." }, { status: 400 });
  }

  const transaction = await prisma.transaction.create({
    data: {
      description,
      amount: parsedAmount,
      type,
      currency,
      date: new Date(`${date}T12:00:00`),
      userId: session.user!.id!,
      categoryId: categoryId ?? null,
    },
  });

  return NextResponse.json(transaction);
}

export async function DELETE(req: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();

  await prisma.transaction.delete({
    where: {
      id,
      userId: session.user!.id!,
    },
  });

  return NextResponse.json({ ok: true });
}