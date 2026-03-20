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
