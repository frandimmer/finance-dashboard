export type Currency = "ARS" | "USD"

export function convertCurrency(
  amount: number,
  currency: Currency,
  rate: number
) {
  if (currency === "USD") {
    return amount / rate
  }

  return amount
}

export function getCurrencySymbol(currency: Currency) {
  return currency === "USD" ? "US$" : "$"
}

export function formatMoney(
  amount: number,
  currency: Currency
) {
  return `${getCurrencySymbol(currency)} ${Math.abs(amount).toLocaleString(
    "es-AR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`
}

export function calculatePercentageChange(
  current: number,
  previous: number
) {
  if (previous === 0) {
    return current === 0 ? 0 : 100
  }

  const diff = current - previous
  const base = Math.abs(previous)

  return (diff / base) * 100
}