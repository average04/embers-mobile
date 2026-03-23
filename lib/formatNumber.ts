/**
 * Formats a number for compact display.
 * 0–999   → "1", "10", "999"
 * 1000+   → "1k", "1.2k", "99.9k"
 * 1000000+ → "1m", "1.2m"
 */
export function formatNumber(n: number): string {
  if (n < 1000) return String(n)
  if (n < 1_000_000) {
    const k = n / 1000
    return (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1).replace(/\.0$/, '')) + 'k'
  }
  const m = n / 1_000_000
  return (m % 1 === 0 ? m.toFixed(0) : m.toFixed(1).replace(/\.0$/, '')) + 'm'
}
