import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

const CACHE_KEY = "exchange-rates-usd-ars";
const CACHE_TTL = 60 * 60;

interface DolarApiRate {
  moneda: string;
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

interface ExchangeRate {
  name: string;
  casa: string;
  buy: number;
  sell: number;
  updatedAt: string;
}

function normalizeRate(rate: DolarApiRate): ExchangeRate {
  return {
    name: rate.nombre,
    casa: rate.casa,
    buy: rate.compra,
    sell: rate.venta,
    updatedAt: rate.fechaActualizacion,
  };
}

export async function GET() {
  try {
    const cached = await redis.get(CACHE_KEY);

    if (cached) {
      return NextResponse.json({
        source: "cache",
        rates: JSON.parse(cached),
      });
    }

    const res = await fetch("https://dolarapi.com/v1/dolares", {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch exchange rates");
    }

    const data = (await res.json()) as DolarApiRate[];

    const blue = data.find((rate) => rate.casa === "blue");
    const mep = data.find((rate) => rate.casa === "bolsa");
    const official = data.find((rate) => rate.casa === "oficial");

    if (!blue || !mep || !official) {
      throw new Error("Missing required exchange rates");
    }

    const rates = {
      blue: normalizeRate(blue),
      mep: {
        ...normalizeRate(mep),
        name: "MEP",
      },
      official: {
        ...normalizeRate(official),
        name: "Oficial",
      },
    };

    await redis.set(CACHE_KEY, JSON.stringify(rates), "EX", CACHE_TTL);

    return NextResponse.json({
      source: "api",
      rates,
    });
  } catch (error) {
    console.error("EXCHANGE_RATE_ERROR", error);

    return NextResponse.json(
      { error: "Could not fetch exchange rates" },
      { status: 500 }
    );
  }
}