import React from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'

interface Props {
  userId: string
  username: string
  isFollowing: boolean
  onToggle: (userId: string, newValue: boolean) => void
  avatarUrl?: string | null
  onUsernamePress?: (userId: string) => void
  hideFollowButton?: boolean
}

export function FollowUserRow({ userId, username, isFollowing, onToggle, avatarUrl, onUsernamePress, hideFollowButton }: Props) {
  const initial = username.charAt(0).toUpperCase()
  return (
    <View style={styles.row}>
      <View style={[styles.avatar, isFollowing && styles.avatarFollowing]}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
        ) : (
          <Text style={[styles.avatarInitial, isFollowing && styles.avatarInitialFollowing]}>
            {initial}
          </Text>
        )}
      </View>
      {onUsernamePress ? (
        <TouchableOpacity onPress={() => onUsernamePress(userId)} activeOpacity={0.7} style={styles.usernameBtn}>
          <Text style={styles.username}>@{username}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.username}>@{username}</Text>
      )}
      {!hideFollowButton && (
        <TouchableOpacity
          style={[styles.btn, isFollowing && styles.btnFollowing]}
          onPress={() => onToggle(userId, !isFollowing)}
          activeOpacity={0.7}
          accessibilityLabel={isFollowing ? `Unfollow ${username}` : `Follow ${username}`}
          accessibilityRole="button"
        >
          <Text style={[styles.btnText, isFollowing && styles.btnTextFollowing]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    borderWidth: 1.5,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarFollowing: { borderColor: '#f97316' },
  avatarImg: { width: 36, height: 36, borderRadius: 18 },
  avatarInitial: { fontSize: 14, color: '#666' },
  avatarInitialFollowing: { color: '#f97316' },
  usernameBtn: { flex: 1 },
  username: { fontSize: 13, color: '#ddd' },
  btn: {
    backgroundColor: '#f97316',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  btnFollowing: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a' },
  btnText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  btnTextFollowing: { color: '#888' },
})
