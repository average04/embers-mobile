import React, { useState, useRef, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Audio, type AVPlaybackStatus } from 'expo-av'

interface AudioPlayerProps {
  uri: string
  duration: number | null  // seconds
}

function formatSeconds(s: number): string {
  const mins = Math.floor(s / 60)
  const secs = Math.floor(s % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/** Audio player for blue ember playback using expo-av. */
export function AudioPlayer({ uri, duration }: AudioPlayerProps) {
  const soundRef = useRef<Audio.Sound | null>(null)
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  // Configure audio session once on mount
  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true, allowsRecordingIOS: false })
    return () => {
      soundRef.current?.unloadAsync()
    }
  }, [])

  const onPlaybackStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return
    setElapsed(Math.floor((status.positionMillis ?? 0) / 1000))
    if (status.didJustFinish) {
      setPlaying(false)
      setElapsed(0)
    }
  }, [])

  async function handlePlayPause() {
    if (playing) {
      await soundRef.current?.pauseAsync()
      setPlaying(false)
      return
    }

    if (!soundRef.current) {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      )
      sound.setOnPlaybackStatusUpdate(onPlaybackStatus)
      soundRef.current = sound
    } else {
      await soundRef.current.playAsync()
    }
    setPlaying(true)
  }

  const totalSeconds = duration ?? 0

  return (
    <View style={styles.container}>
      <TouchableOpacity testID="audio-play-btn" onPress={handlePlayPause} style={styles.playBtn}>
        <Text style={styles.playIcon}>{playing ? '⏸' : '▶'}</Text>
      </TouchableOpacity>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: totalSeconds > 0 ? `${(elapsed / totalSeconds) * 100}%` : '0%' },
            ]}
          />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatSeconds(elapsed)}</Text>
          <Text style={styles.timeText}>{formatSeconds(totalSeconds)}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#60a5fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { fontSize: 20, color: '#fff' },
  progressContainer: { flex: 1 },
  progressTrack: {
    height: 4,
    backgroundColor: '#2d3748',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#60a5fa', borderRadius: 2 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  timeText: { fontSize: 11, color: '#718096' },
})
