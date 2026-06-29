import { redis } from "@/lib/redis"
import { NextResponse } from "next/server"

const CACHE_KEY = "exchange-rate-usd-ars"
const CACHE_TTL = 60 * 60 // 1 hora

export async function GET() {
  try {
    const cached = await redis.get(CACHE_KEY)

    if (cached) {
      return NextResponse.json({
        source: "cache",
        rate: JSON.parse(cached),
      })
    }

    const res = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD",
      {
        cache: "no-store",
      }
    )

    if (!res.ok) {
      throw new Error("Failed to fetch exchange rate")
    }

    const data = await res.json()
    const arsRate = data.rates.ARS

    await redis.set(
      CACHE_KEY,
      JSON.stringify(arsRate),
      "EX",
      CACHE_TTL
    )

    return NextResponse.json({
      source: "api",
      rate: arsRate,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: "Could not fetch exchange rate" },
      { status: 500 }
    )
  }
}