import { create } from 'zustand'

export interface Region {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}

const DEFAULT_REGION: Region = {
  latitude: 14.5995,
  longitude: 120.9842,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
}

interface MapState {
  region: Region
  selectedEmberId: string | null
  selectedEmberType: 'orange' | 'blue' | null
  setRegion: (region: Region) => void
  setSelectedEmberId: (id: string | null) => void
  setSelectedEmber: (id: string | null, type: 'orange' | 'blue' | null) => void
}

export const useMapStore = create<MapState>((set) => ({
  region: DEFAULT_REGION,
  selectedEmberId: null,
  selectedEmberType: null,
  setRegion: (region) => set({ region }),
  setSelectedEmberId: (selectedEmberId) => set({ selectedEmberId }),
  setSelectedEmber: (id, type) => set({ selectedEmberId: id, selectedEmberType: type }),
}))
