/**
 * LargeSecureStore — chunked expo-secure-store adapter for Supabase sessions.
 *
 * expo-secure-store has a 2048-byte limit per key. Supabase JWTs exceed this,
 * so we split large values into 1900-byte chunks and reassemble on read.
 */
import * as SecureStore from 'expo-secure-store'

const CHUNK_SIZE = 1900

export const largeSecureStore = {
  async getItem(key: string): Promise<string | null> {
    const countStr = await SecureStore.getItemAsync(key + '__n')
    if (!countStr) return null
    const count = parseInt(countStr, 10)
    const chunks: string[] = []
    for (let i = 0; i < count; i++) {
      const chunk = await SecureStore.getItemAsync(key + '_' + i)
      if (chunk == null) return null
      chunks.push(chunk)
    }
    return chunks.join('')
  },

  async setItem(key: string, value: string): Promise<void> {
    const chunks: string[] = []
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE))
    }
    await SecureStore.setItemAsync(key + '__n', String(chunks.length))
    for (let i = 0; i < chunks.length; i++) {
      await SecureStore.setItemAsync(key + '_' + i, chunks[i])
    }
  },

  async removeItem(key: string): Promise<void> {
    const countStr = await SecureStore.getItemAsync(key + '__n')
    if (!countStr) return
    const count = parseInt(countStr, 10)
    for (let i = 0; i < count; i++) {
      await SecureStore.deleteItemAsync(key + '_' + i)
    }
    await SecureStore.deleteItemAsync(key + '__n')
  },
}
