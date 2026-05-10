export function fmtMoney(n: number): string {
  if (!isFinite(n) || n === 0) return '$0'
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1000)}K`
  return `$${Math.round(n)}`
}

export function fmtPct(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`
}

export function fmtYears(n: number | null): string {
  if (n === null) return '—'
  return `${n.toFixed(1)} yr`
}
