/** Returns a human-readable "time ago" string from an ISO timestamp. */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `${mo}mo ago`
  return `${Math.floor(mo / 12)}y ago`
}

/** Returns the number of days remaining before an ember fades.
 *  @param createdAt  ISO timestamp string
 *  @param relitAt    ISO timestamp string or null
 *  @param expiryDays Days until expiry from the last active date (30 for orange, 7 for blue)
 */
export function daysRemaining(
  createdAt: string,
  relitAt: string | null,
  expiryDays: number
): number {
  const lastActive = relitAt
    ? Math.max(new Date(createdAt).getTime(), new Date(relitAt).getTime())
    : new Date(createdAt).getTime()
  const msRemaining = lastActive + expiryDays * 24 * 60 * 60 * 1000 - Date.now()
  return Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)))
}
