import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { FollowUserRow } from '@/components/profile/FollowUserRow'

const base = {
  userId: 'u1',
  username: 'alice_sparks',
  isFollowing: false,
  onToggle: jest.fn(),
}

describe('FollowUserRow', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders the username', () => {
    const { getByText } = render(<FollowUserRow {...base} />)
    expect(getByText('@alice_sparks')).toBeTruthy()
  })

  it('shows Follow button when not following', () => {
    const { getByText } = render(<FollowUserRow {...base} isFollowing={false} />)
    expect(getByText('Follow')).toBeTruthy()
  })

  it('shows Following button when following', () => {
    const { getByText } = render(<FollowUserRow {...base} isFollowing={true} />)
    expect(getByText('Following')).toBeTruthy()
  })

  it('calls onToggle(userId, true) when Follow is pressed', () => {
    const onToggle = jest.fn()
    const { getByText } = render(<FollowUserRow {...base} isFollowing={false} onToggle={onToggle} />)
    fireEvent.press(getByText('Follow'))
    expect(onToggle).toHaveBeenCalledWith('u1', true)
  })

  it('calls onToggle(userId, false) when Following is pressed', () => {
    const onToggle = jest.fn()
    const { getByText } = render(<FollowUserRow {...base} isFollowing={true} onToggle={onToggle} />)
    fireEvent.press(getByText('Following'))
    expect(onToggle).toHaveBeenCalledWith('u1', false)
  })
})
