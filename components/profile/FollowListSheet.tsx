import React, { useState, useEffect } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { FollowUserRow } from './FollowUserRow'

interface Props {
  visible: boolean
  onClose: () => void
  type: 'followers' | 'following'
  count: number
  targetUserId?: string   // whose followers/following to show; defaults to own session user
  tabBarHeight?: number   // forwarded to UserProfileSheet (wired in Task 4); defaults to 0
}

type UserEntry = { id: string; username: string }

function SkeletonRow() {
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
  return <Animated.View style={[styles.skeletonRow, { opacity: anim }]} />
}

export function FollowListSheet({ visible, onClose, type, count, targetUserId, tabBarHeight: _tabBarHeight = 0 }: Props) {
  const insets = useSafeAreaInsets()
  const session = useAuthStore((s) => s.session)
  const queryClient = useQueryClient()
  const ownUserId = session?.user.id
  const viewedUserId = targetUserId ?? ownUserId

  const listQuery = useQuery<UserEntry[]>({
    queryKey: [type === 'followers' ? 'followersList' : 'followingList', viewedUserId],
    queryFn: async () => {
      if (type === 'followers') {
        const { data: follows, error: e1 } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('following_id', viewedUserId!)
        if (e1) throw e1
        const ids = (follows ?? []).map((f: any) => f.follower_id)
        if (ids.length === 0) return []
        const { data: profiles, error: e2 } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', ids)
        if (e2) throw e2
        return (profiles ?? []) as UserEntry[]
      } else {
        const { data: follows, error: e1 } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', viewedUserId!)
        if (e1) throw e1
        const ids = (follows ?? []).map((f: any) => f.following_id)
        if (ids.length === 0) return []
        const { data: profiles, error: e2 } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', ids)
        if (e2) throw e2
        return (profiles ?? []) as UserEntry[]
      }
    },
    enabled: visible && !!viewedUserId,
    staleTime: 30_000,
  })

  const myFollowsQuery = useQuery<Set<string>>({
    queryKey: ['myFollows', ownUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', ownUserId!)
      if (error) throw error
      return new Set((data ?? []).map((r: any) => r.following_id))
    },
    enabled: visible && !!ownUserId,
    staleTime: 30_000,
  })

  const [myFollowingSet, setMyFollowingSet] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (myFollowsQuery.data) {
      setMyFollowingSet(new Set(myFollowsQuery.data))
    }
  }, [myFollowsQuery.data])

  async function handleToggle(targetId: string, newValue: boolean) {
    if (!ownUserId) return
    const prev = new Set(myFollowingSet)
    setMyFollowingSet(s => {
      const next = new Set(s)
      if (newValue) next.add(targetId)
      else next.delete(targetId)
      return next
    })

    let error: any
    if (newValue) {
      const res = await supabase
        .from('follows')
        .insert({ follower_id: ownUserId, following_id: targetId })
      error = res.error
    } else {
      const res = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', ownUserId)
        .eq('following_id', targetId)
      error = res.error
    }

    if (error) {
      setMyFollowingSet(prev)
      return
    }

    queryClient.invalidateQueries({ queryKey: ['followerCount', ownUserId] })
    queryClient.invalidateQueries({ queryKey: ['followingCount', ownUserId] })
    queryClient.invalidateQueries({ queryKey: ['followersList', ownUserId] })
    queryClient.invalidateQueries({ queryKey: ['followingList', ownUserId] })
    queryClient.invalidateQueries({ queryKey: ['myFollows', ownUserId] })
    // Also invalidate for the viewed user's lists when viewing someone else's profile
    if (viewedUserId && viewedUserId !== ownUserId) {
      queryClient.invalidateQueries({ queryKey: ['followersList', viewedUserId] })
      queryClient.invalidateQueries({ queryKey: ['followingList', viewedUserId] })
      queryClient.invalidateQueries({ queryKey: ['followerCount', viewedUserId] })
      queryClient.invalidateQueries({ queryKey: ['followingCount', viewedUserId] })
    }
  }

  const title = type === 'followers' ? `Followers · ${count}` : `Following · ${count}`
  const emptyMsg = type === 'followers' ? 'no followers yet' : 'not following anyone yet'

  function renderList() {
    if (listQuery.isLoading || myFollowsQuery.isLoading) {
      return <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
    }
    if (listQuery.isError || myFollowsQuery.isError) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>couldn't load</Text>
          <TouchableOpacity onPress={() => { listQuery.refetch(); myFollowsQuery.refetch() }} activeOpacity={0.7}>
            <Text style={styles.retryText}>retry</Text>
          </TouchableOpacity>
        </View>
      )
    }
    if (!listQuery.data?.length) {
      return <View style={styles.centered}><Text style={styles.emptyText}>{emptyMsg}</Text></View>
    }
    return listQuery.data.map((user, index) => (
      <React.Fragment key={user.id}>
        <FollowUserRow
          userId={user.id}
          username={user.username}
          isFollowing={myFollowingSet.has(user.id)}
          onToggle={handleToggle}
          // onUsernamePress wired in Task 4 after UserProfileSheet is created
        />
        {index < listQuery.data!.length - 1 && <View style={styles.separator} />}
      </React.Fragment>
    ))
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>{title}</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {renderList()}
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#111111',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    borderColor: '#1e1e1e',
    paddingTop: 14,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#2a2a2a',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 10,
    paddingHorizontal: 20,
    letterSpacing: 0.3,
  },
  skeletonRow: {
    height: 52,
    backgroundColor: '#161616',
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  centered: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 13, color: '#3a3a4a' },
  retryText: { fontSize: 12, color: '#f97316' },
  separator: { height: 1, backgroundColor: '#1a1a1a', marginHorizontal: 20 },
})
