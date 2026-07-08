import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const body = await request.json();
    const recurringId = body.recurringId as string;

    if (!recurringId) {
      return NextResponse.json(
        { error: "Falta el recurrente a registrar." },
        { status: 400 }
      );
    }

    const recurring = await prisma.recurringTransaction.findFirst({
      where: {
        id: recurringId,
        userId: session.user.id,
      },
    });

    if (!recurring) {
      return NextResponse.json(
        { error: "Recurrente no encontrado." },
        { status: 404 }
      );
    }

    if (!recurring.isActive) {
      return NextResponse.json(
        { error: "No podés registrar un recurrente pausado." },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount: recurring.amount,
        currency: recurring.currency,
        description: recurring.name,
        type: recurring.type,
        date: new Date(),
        userId: session.user.id,
        categoryId: recurring.categoryId,
        recurringTransactionId: recurring.id,
      },
    });

    return NextResponse.json({
      ok: true,
      transaction,
    });
  } catch (error) {
    console.error("REGISTER_RECURRING_ERROR", error);

    return NextResponse.json(
      { error: "No se pudo registrar el recurrente." },
      { status: 500 }
    );
  }
}