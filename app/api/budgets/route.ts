import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const amount = Number(body.amount);
    const month = Number(body.month);
    const year = Number(body.year);
    const userId = body.userId as string;
    const categoryId = body.categoryId as string;

    if (!userId || !categoryId) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios." },
        { status: 400 }
      );
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "El monto debe ser mayor a 0." },
        { status: 400 }
      );
    }

    if (!month || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { error: "Mes inválido." },
        { status: 400 }
      );
    }

    if (!year || isNaN(year) || year < 1900 || year > 2200) {
      return NextResponse.json(
        { error: "Año inválido." },
        { status: 400 }
      );
    }

    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId,
          categoryId,
          month,
          year,
        },
      },
      update: {
        amount,
      },
      create: {
        amount,
        month,
        year,
        userId,
        categoryId,
      },
    });

    return NextResponse.json(budget);
  } catch {
    return NextResponse.json(
      { error: "No se pudo guardar el presupuesto." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    const id = body.id as string;

    if (!id) {
      return NextResponse.json(
        { error: "Falta el ID del presupuesto." },
        { status: 400 }
      );
    }

    await prisma.budget.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "No se pudo eliminar el presupuesto." },
      { status: 500 }
    );
  }
}