import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface Props {
  userId: string
  username: string
  isFollowing: boolean
  onToggle: (userId: string, newValue: boolean) => void
}

export function FollowUserRow({ userId, username, isFollowing, onToggle }: Props) {
  const initial = username.charAt(0).toUpperCase()
  return (
    <View style={styles.row}>
      <View style={[styles.avatar, isFollowing && styles.avatarFollowing]}>
        <Text style={[styles.avatarInitial, isFollowing && styles.avatarInitialFollowing]}>
          {initial}
        </Text>
      </View>
      <Text style={styles.username}>@{username}</Text>
      <TouchableOpacity
        style={[styles.btn, isFollowing && styles.btnFollowing]}
        onPress={() => onToggle(userId, !isFollowing)}
        activeOpacity={0.7}
      >
        <Text style={[styles.btnText, isFollowing && styles.btnTextFollowing]}>
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
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
  avatarInitial: { fontSize: 14, color: '#666' },
  avatarInitialFollowing: { color: '#f97316' },
  username: { flex: 1, fontSize: 13, color: '#ddd' },
  btn: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  btnFollowing: { backgroundColor: '#f97316', borderColor: '#f97316' },
  btnText: { fontSize: 11, fontWeight: '600', color: '#888' },
  btnTextFollowing: { color: '#fff' },
})
