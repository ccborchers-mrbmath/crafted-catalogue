export function formatZAR(cents: number | null | undefined): string {
  if (cents == null) return "R —";
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function randsToCents(rands: number | string): number {
  const n = typeof rands === "string" ? parseFloat(rands) : rands;
  if (!isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export function centsToRandsString(cents: number): string {
  return (cents / 100).toFixed(2);
}
