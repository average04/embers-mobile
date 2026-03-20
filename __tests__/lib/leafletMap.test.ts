import { buildMapHtml } from '@/lib/leafletMap'

describe('buildMapHtml', () => {
  let html: string

  beforeAll(() => {
    html = buildMapHtml(14.5995, 120.9842, 11)
  })

  it('returns a string', () => {
    expect(typeof html).toBe('string')
    expect(html.length).toBeGreaterThan(100)
  })

  it('includes Leaflet from CDN', () => {
    expect(html).toContain('leaflet')
    expect(html).toContain('unpkg.com')
  })

  it('includes markercluster', () => {
    expect(html).toContain('markercluster')
  })

  it('sends MAP_READY on load', () => {
    expect(html).toContain('MAP_READY')
  })

  it('handles UPDATE_EMBERS message', () => {
    expect(html).toContain('UPDATE_EMBERS')
  })

  it('sends MARKER_TAP on marker click', () => {
    expect(html).toContain('MARKER_TAP')
  })

  it('sends REGION_CHANGE on map moveend', () => {
    expect(html).toContain('REGION_CHANGE')
  })

  it('handles JUMP_TO message', () => {
    expect(html).toContain('JUMP_TO')
  })

  it('bakes in the provided lat/lng/zoom', () => {
    expect(html).toContain('14.5995')
    expect(html).toContain('120.9842')
    expect(html).toContain('11')
  })
})
