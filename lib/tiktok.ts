/**
 * Extracts the video ID from a TikTok URL and builds the player embed URL.
 * Handles formats like:
 *   https://www.tiktok.com/@username/video/1234567890
 *   https://vt.tiktok.com/...  (short links won't have an ID — returns null)
 */
export function buildTikTokPlayerUrl(url: string): string | null {
  const match = url.match(/\/@[\w.-]+\/(?:video|photo)\/(\d+)/)
  if (!match) return null
  const id = match[1]
  return (
    `https://www.tiktok.com/player/v1/${id}` +
    `?autoplay=1&muted=1&loop=1&controls=0` +
    `&progress_bar=0&play_button=0&volume_control=0` +
    `&fullscreen_button=0&timestamp=0&closed_caption=0`
  )
}
