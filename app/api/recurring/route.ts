import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const id = body.id as string | undefined;
    const name = String(body.name ?? "").trim();
    const amount = Number(body.amount);
    const currency = body.currency as "ARS" | "USD";
    const type = body.type as string;
    const dayOfMonth = Number(body.dayOfMonth);
    const userId = body.userId as string;
    const categoryId = body.categoryId ? (body.categoryId as string) : null;

    if (!userId) {
      return NextResponse.json(
        { error: "Falta el usuario." },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "Ingresá un nombre." },
        { status: 400 }
      );
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "El monto debe ser mayor a 0." },
        { status: 400 }
      );
    }

    if (currency !== "ARS" && currency !== "USD") {
      return NextResponse.json(
        { error: "Moneda inválida." },
        { status: 400 }
      );
    }

    if (type !== "income" && type !== "expense") {
      return NextResponse.json(
        { error: "Tipo inválido." },
        { status: 400 }
      );
    }

    if (
      !dayOfMonth ||
      isNaN(dayOfMonth) ||
      dayOfMonth < 1 ||
      dayOfMonth > 31
    ) {
      return NextResponse.json(
        { error: "El día del mes debe estar entre 1 y 31." },
        { status: 400 }
      );
    }

    if (id) {
      const result = await prisma.recurringTransaction.updateMany({
        where: {
          id,
          userId,
        },
        data: {
          name,
          amount,
          currency,
          type,
          dayOfMonth,
          categoryId,
        },
      });

      if (result.count === 0) {
        return NextResponse.json(
          { error: "Recurrente no encontrado." },
          { status: 404 }
        );
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const lastDayOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      ).getDate();

      const safeDay = Math.min(dayOfMonth, lastDayOfMonth);

      await prisma.transaction.updateMany({
        where: {
          userId,
          recurringTransactionId: id,
          date: {
            gte: startOfMonth,
            lt: endOfMonth,
          },
        },
        data: {
          amount,
          currency,
          description: name,
          type,
          categoryId,
          date: new Date(
            now.getFullYear(),
            now.getMonth(),
            safeDay,
            12,
            0,
            0
          ),
        },
      });

      return NextResponse.json({ ok: true });
    }

    const recurring = await prisma.recurringTransaction.create({
      data: {
        name,
        amount,
        currency,
        type,
        dayOfMonth,
        frequency: "monthly",
        userId,
        categoryId,
      },
    });

    return NextResponse.json(recurring);
  } catch (error) {
    console.error("RECURRING_POST_ERROR", error);

    return NextResponse.json(
      { error: "No se pudo guardar el recurrente." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const id = body.id as string;
    const userId = body.userId as string;
    const isActive = Boolean(body.isActive);

    if (!id || !userId) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios." },
        { status: 400 }
      );
    }

    const result = await prisma.recurringTransaction.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        isActive,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Recurrente no encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("RECURRING_PATCH_ERROR", error);

    return NextResponse.json(
      { error: "No se pudo actualizar el recurrente." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    const id = body.id as string;
    const userId = body.userId as string;

    if (!id || !userId) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios." },
        { status: 400 }
      );
    }

    const result = await prisma.recurringTransaction.deleteMany({
      where: {
        id,
        userId,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Recurrente no encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("RECURRING_DELETE_ERROR", error);

    return NextResponse.json(
      { error: "No se pudo eliminar el recurrente." },
      { status: 500 }
    );
  }
}