import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

type BluelyticsResponse = {
  oficial: {
    value_avg: number;
    value_buy: number;
    value_sell: number;
  };
  blue: {
    value_avg: number;
    value_buy: number;
    value_sell: number;
  };
  oficial_euro: {
    value_avg: number;
    value_buy: number;
    value_sell: number;
  };
  blue_euro: {
    value_avg: number;
    value_buy: number;
    value_sell: number;
  };
  last_update: string;
};

type ExchangeRates = {
  blue: {
    name: string;
    casa: string;
    buy: number;
    sell: number;
    updatedAt: string;
  };
  mep: {
    name: string;
    casa: string;
    buy: number;
    sell: number;
    updatedAt: string;
  };
  official: {
    name: string;
    casa: string;
    buy: number;
    sell: number;
    updatedAt: string;
  };
};

const CACHE_KEY = "exchange-rates";
const CACHE_TTL_SECONDS = 60 * 15;

function fallbackRates(): ExchangeRates {
  const updatedAt = new Date().toISOString();

  return {
    blue: {
      name: "Dólar Blue",
      casa: "blue",
      buy: 0,
      sell: 0,
      updatedAt,
    },
    mep: {
      name: "Dólar MEP",
      casa: "mep",
      buy: 0,
      sell: 0,
      updatedAt,
    },
    official: {
      name: "Dólar Oficial",
      casa: "oficial",
      buy: 0,
      sell: 0,
      updatedAt,
    },
  };
}

export async function GET() {
  try {
    if (redis) {
      const cached = await redis.get(CACHE_KEY);

      if (cached) {
        return NextResponse.json({
          rates: JSON.parse(cached) as ExchangeRates,
          source: "cache",
        });
      }
    }

    const response = await fetch("https://api.bluelytics.com.ar/v2/latest", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("No se pudo obtener la cotización del dólar");
    }

    const data = (await response.json()) as BluelyticsResponse;

    const rates: ExchangeRates = {
      blue: {
        name: "Dólar Blue",
        casa: "blue",
        buy: data.blue.value_buy,
        sell: data.blue.value_sell,
        updatedAt: data.last_update,
      },
      mep: {
        name: "Dólar MEP",
        casa: "mep",
        buy: data.blue.value_buy,
        sell: data.blue.value_sell,
        updatedAt: data.last_update,
      },
      official: {
        name: "Dólar Oficial",
        casa: "oficial",
        buy: data.oficial.value_buy,
        sell: data.oficial.value_sell,
        updatedAt: data.last_update,
      },
    };

    if (redis) {
      await redis.set(CACHE_KEY, JSON.stringify(rates), "EX", CACHE_TTL_SECONDS);
    }

    return NextResponse.json({
      rates,
      source: redis ? "api-cache" : "api",
    });
  } catch (error) {
    console.error("EXCHANGE_RATE_ERROR", error);

    return NextResponse.json({
      rates: fallbackRates(),
      source: "fallback",
    });
  }
}