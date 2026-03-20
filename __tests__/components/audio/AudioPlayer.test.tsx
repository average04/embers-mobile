import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { AudioPlayer } from '@/components/audio/AudioPlayer'

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          setOnPlaybackStatusUpdate: jest.fn(),
          playAsync: jest.fn().mockResolvedValue(undefined),
          pauseAsync: jest.fn().mockResolvedValue(undefined),
          unloadAsync: jest.fn().mockResolvedValue(undefined),
        },
        status: { isLoaded: true, durationMillis: 15000 },
      }),
    },
  },
}))

describe('AudioPlayer', () => {
  it('renders play button initially', () => {
    const { getByTestId } = render(
      <AudioPlayer uri="https://example.com/audio.m4a" duration={15} />
    )
    expect(getByTestId('audio-play-btn')).toBeTruthy()
  })

  it('shows duration text', () => {
    const { getByText } = render(
      <AudioPlayer uri="https://example.com/audio.m4a" duration={15} />
    )
    expect(getByText('0:15')).toBeTruthy()
  })

  it('calls Audio.Sound.createAsync when play is pressed', async () => {
    const { Audio } = require('expo-av')
    const { getByTestId } = render(
      <AudioPlayer uri="https://example.com/audio.m4a" duration={15} />
    )
    fireEvent.press(getByTestId('audio-play-btn'))
    await waitFor(() => {
      expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
        { uri: 'https://example.com/audio.m4a' },
        { shouldPlay: true }
      )
    })
  })
})
