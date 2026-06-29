export function formatMoney(
  value: number,
  currency: "ARS" | "USD"
) {
  const symbol = currency === "USD" ? "US$" : "$"

  return `${symbol} ${value.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}