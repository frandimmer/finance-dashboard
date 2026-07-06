import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function getCurrentMonth() {
  const now = new Date();

  return {
    month: now.getMonth(),
    year: now.getFullYear(),
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  };
}

function getSafeDate(year: number, month: number, dayOfMonth: number) {
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(dayOfMonth, lastDayOfMonth);

  return new Date(year, month, safeDay, 12, 0, 0);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body.userId as string;

    if (!userId) {
      return NextResponse.json(
        { error: "Falta el usuario." },
        { status: 400 }
      );
    }

    const currentMonth = getCurrentMonth();

    const recurringTransactions = await prisma.recurringTransaction.findMany({
      where: {
        userId,
        isActive: true,
        frequency: "monthly",
      },
    });

    let createdCount = 0;
    let skippedCount = 0;

    for (const recurring of recurringTransactions) {
      const alreadyExists = await prisma.transaction.findFirst({
        where: {
          userId,
          recurringTransactionId: recurring.id,
          date: {
            gte: currentMonth.start,
            lt: currentMonth.end,
          },
        },
      });

      if (alreadyExists) {
        skippedCount += 1;
        continue;
      }

      await prisma.transaction.create({
        data: {
          amount: recurring.amount,
          currency: recurring.currency,
          description: recurring.name,
          type: recurring.type,
          date: getSafeDate(
            currentMonth.year,
            currentMonth.month,
            recurring.dayOfMonth
          ),
          userId,
          categoryId: recurring.categoryId,
          recurringTransactionId: recurring.id,
        },
      });

      createdCount += 1;
    }

    return NextResponse.json({
      ok: true,
      createdCount,
      skippedCount,
      totalActive: recurringTransactions.length,
    });
  } catch (error) {
    console.error("RECURRING_GENERATE_ERROR", error);

    return NextResponse.json(
      { error: "No se pudieron generar los movimientos recurrentes." },
      { status: 500 }
    );
  }
}