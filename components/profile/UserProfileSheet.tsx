import React, { useState, useEffect } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'

interface Props {
  visible: boolean
  onClose: () => void
  userId: string
  username: string
  tabBarHeight: number
}

type UserProfile = { id: string; username: string; created_at: string; embers_hidden: boolean }

function SkeletonSheet() {
  const anim = React.useRef(new Animated.Value(0.4)).current
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.9, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [anim])
  return (
    <Animated.View style={{ opacity: anim }}>
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonText}>
          <View style={styles.skeletonLine} />
          <View style={[styles.skeletonLine, { width: '60%' }]} />
        </View>
      </View>
    </Animated.View>
  )
}

export function UserProfileSheet({ visible, onClose, userId, username, tabBarHeight }: Props) {
  const session = useAuthStore((s) => s.session)
  const queryClient = useQueryClient()
  const ownUserId = session?.user.id
  const enabled = visible && !!userId && !!ownUserId

  const profileQuery = useQuery<UserProfile>({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, created_at, embers_hidden')
        .eq('id', userId)
        .single()
      if (error) throw error
      return data as UserProfile
    },
    enabled,
    staleTime: 30_000,
  })

  const followerCountQuery = useQuery<number>({
    queryKey: ['followerCount', userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', userId)
      if (error) throw error
      return count ?? 0
    },
    enabled,
    staleTime: 30_000,
  })

  const followingCountQuery = useQuery<number>({
    queryKey: ['followingCount', userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', userId)
      if (error) throw error
      return count ?? 0
    },
    enabled,
    staleTime: 30_000,
  })

  const isFollowingQuery = useQuery<boolean>({
    queryKey: ['isFollowing', ownUserId, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', ownUserId!)
        .eq('following_id', userId)
        .maybeSingle()
      if (error) throw error
      return data !== null
    },
    enabled,
    staleTime: 30_000,
  })

  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    if (isFollowingQuery.data !== undefined) {
      setIsFollowing(isFollowingQuery.data)
    }
  }, [isFollowingQuery.data])

  async function handleToggleFollow() {
    if (!ownUserId) return
    const prev = isFollowing
    setIsFollowing(!isFollowing)

    let error: any
    if (!isFollowing) {
      const res = await supabase.from('follows').insert({ follower_id: ownUserId, following_id: userId })
      error = res.error
    } else {
      const res = await supabase.from('follows').delete().eq('follower_id', ownUserId).eq('following_id', userId)
      error = res.error
    }

    if (error) {
      setIsFollowing(prev)
      return
    }

    queryClient.invalidateQueries({ queryKey: ['followerCount', userId] })
    queryClient.invalidateQueries({ queryKey: ['followingCount', userId] })
    queryClient.invalidateQueries({ queryKey: ['isFollowing', ownUserId, userId] })
    queryClient.invalidateQueries({ queryKey: ['followerCount', ownUserId] })
    queryClient.invalidateQueries({ queryKey: ['followingCount', ownUserId] })
    queryClient.invalidateQueries({ queryKey: ['followersList', userId] })
    queryClient.invalidateQueries({ queryKey: ['followingList', userId] })
    queryClient.invalidateQueries({ queryKey: ['myFollows', ownUserId] })
  }

  const isLoading = profileQuery.isLoading || followerCountQuery.isLoading ||
    followingCountQuery.isLoading || isFollowingQuery.isLoading
  const isError = profileQuery.isError

  const displayUsername = profileQuery.data?.username ?? username
  const initial = displayUsername.charAt(0).toUpperCase()
  const followerCount = followerCountQuery.data ?? 0
  const followingCount = followingCountQuery.data ?? 0

  function renderContent() {
    if (isLoading) return <SkeletonSheet />
    if (isError) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>couldn't load</Text>
        </View>
      )
    }
    return (
      <>
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.username}>@{displayUsername}</Text>
            <Text style={styles.counts}>
              <Text style={styles.countNum}>{followerCount}</Text>
              <Text> followers · </Text>
              <Text style={styles.countNum}>{followingCount}</Text>
              <Text> following</Text>
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.followBtn, isFollowing && styles.followBtnActive]}
            onPress={handleToggleFollow}
            activeOpacity={0.7}
          >
            <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.viewProfileBtn}
          onPress={() => { router.push('/user/' + userId); onClose() }}
          activeOpacity={0.7}
        >
          <Text style={styles.viewProfileText}>View full profile →</Text>
        </TouchableOpacity>
      </>
    )
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        style={[styles.backdrop, { bottom: tabBarHeight }]}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={[styles.sheet, { bottom: tabBarHeight }]}>
        <View style={styles.handle} />
        {renderContent()}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#111111',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    borderColor: '#1e1e1e',
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#2a2a2a',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 18,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarInitial: { fontSize: 22, color: '#f97316' },
  userInfo: { flex: 1 },
  username: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 3 },
  counts: { fontSize: 11, color: '#888' },
  countNum: { color: '#ccc', fontWeight: '600' },
  followBtn: {
    backgroundColor: '#f97316',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  followBtnActive: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a' },
  followBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  followBtnTextActive: { color: '#888' },
  divider: { height: 1, backgroundColor: '#1a1a1a', marginBottom: 16 },
  viewProfileBtn: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewProfileText: { fontSize: 13, color: '#aaa', fontWeight: '500' },
  skeletonRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  skeletonAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1e1e1e',
  },
  skeletonText: { flex: 1, gap: 8 },
  skeletonLine: { height: 12, backgroundColor: '#1e1e1e', borderRadius: 6, width: '80%' },
  centered: { alignItems: 'center', paddingVertical: 20 },
  errorText: { fontSize: 13, color: '#3a3a4a' },
})
