import { act, renderHook } from '@testing-library/react-native'
import { useMapStore } from '@/store/mapStore'

const DEFAULT_REGION = {
  latitude: 14.5995,
  longitude: 120.9842,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
}

describe('mapStore', () => {
  beforeEach(() => {
    useMapStore.setState({ region: DEFAULT_REGION, selectedEmberId: null, selectedEmberType: null })
  })

  it('starts with default region and no selected ember', () => {
    const { result } = renderHook(() => useMapStore())
    expect(result.current.region).toEqual(DEFAULT_REGION)
    expect(result.current.selectedEmberId).toBeNull()
  })

  it('setRegion updates the region', () => {
    const { result } = renderHook(() => useMapStore())
    const newRegion = { latitude: 10, longitude: 10, latitudeDelta: 0.1, longitudeDelta: 0.1 }
    act(() => result.current.setRegion(newRegion))
    expect(result.current.region).toEqual(newRegion)
  })

  it('setSelectedEmberId updates selected ember', () => {
    const { result } = renderHook(() => useMapStore())
    act(() => result.current.setSelectedEmberId('ember-123'))
    expect(result.current.selectedEmberId).toBe('ember-123')
  })

  it('setSelectedEmberId can clear selection', () => {
    const { result } = renderHook(() => useMapStore())
    act(() => result.current.setSelectedEmberId('ember-123'))
    act(() => result.current.setSelectedEmberId(null))
    expect(result.current.selectedEmberId).toBeNull()
  })

  it('starts with no selectedEmberType', () => {
    const { result } = renderHook(() => useMapStore())
    expect(result.current.selectedEmberType).toBeNull()
  })

  it('setSelectedEmber sets id and type together', () => {
    const { result } = renderHook(() => useMapStore())
    act(() => result.current.setSelectedEmber('ember-abc', 'orange'))
    expect(result.current.selectedEmberId).toBe('ember-abc')
    expect(result.current.selectedEmberType).toBe('orange')
  })

  it('setSelectedEmber with null clears both id and type', () => {
    const { result } = renderHook(() => useMapStore())
    act(() => result.current.setSelectedEmber('ember-abc', 'orange'))
    act(() => result.current.setSelectedEmber(null, null))
    expect(result.current.selectedEmberId).toBeNull()
    expect(result.current.selectedEmberType).toBeNull()
  })
})
