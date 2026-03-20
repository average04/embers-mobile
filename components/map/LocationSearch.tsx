import React, { useState, useRef, useCallback } from 'react'
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'

interface Region {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

interface LocationSearchProps {
  onSelect: (region: Region) => void
}

/** Nominatim geocoding search bar. Floats over the map in the top-left corner. */
export function LocationSearch({ onSelect }: LocationSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [loading, setLoading] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>()

  const search = useCallback(async (text: string) => {
    if (text.trim().length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=5`,
        { headers: { 'User-Agent': 'Embers Mobile App (embersthoughts.com)' } }
      )
      if (res.ok) {
        setResults(await res.json())
      }
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  function handleChange(text: string) {
    setQuery(text)
    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => search(text), 500)
  }

  function handleSelect(item: NominatimResult) {
    setQuery(item.display_name)
    setResults([])
    onSelect({
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    })
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Search location..."
          placeholderTextColor="#4a5568"
          value={query}
          onChangeText={handleChange}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {loading && <ActivityIndicator size="small" color="#e94560" style={styles.spinner} />}
      </View>
      {results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.place_id)}
          style={styles.results}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.resultItem} onPress={() => handleSelect(item)}>
              <Text style={styles.resultText} numberOfLines={2}>{item.display_name}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 52,
    left: 12,
    right: 12,
    zIndex: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f1117',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2d3748',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 44,
    color: '#f7fafc',
    fontSize: 15,
  },
  spinner: { marginLeft: 8 },
  results: {
    backgroundColor: '#0f1117',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2d3748',
    marginTop: 4,
    maxHeight: 200,
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  resultText: { color: '#e2e8f0', fontSize: 14 },
})
