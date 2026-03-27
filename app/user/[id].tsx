import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { EmberCard, type ProfileEmber } from '@/components/profile/EmberCard'
import { BlueEmberCard, type ProfileBlueEmber } from '@/components/profile/BlueEmberCard'
import { FollowListSheet } from '@/components/profile/FollowListSheet'
import { TAB_BAR_HEIGHT } from '@/components/navigation/BottomTabBar'

type UserProfile = { id: string; username: string; created_at: string; embers_hidden: boolean }
type ActiveTab = 'embers' | 'blue'

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const session = useAuthStore((s) => s.session)
  const queryClient = useQueryClient()
  const ownUserId = session?.user.id
  const userId = id as string

  const [activeTab, setActiveTab] = useState<ActiveTab>('embers')
  const [followListType, setFollowListType] = useState<'followers' | 'following' | null>(null)

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
    enabled: !!userId && !!session,
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
    enabled: !!userId && !!session,
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
    enabled: !!userId && !!session,
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
    enabled: !!userId && !!session && userId !== ownUserId,
    staleTime: 30_000,
  })

  const [isFollowing, setIsFollowing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  React.useEffect(() => {
    if (isFollowingQuery.data !== undefined) setIsFollowing(isFollowingQuery.data)
  }, [isFollowingQuery.data])

  const embersHidden = profileQuery.data?.embers_hidden === true

  const embersQuery = useQuery<ProfileEmber[]>({
    queryKey: ['userEmbers', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('embers')
        .select('id, thought, ember_type, created_at, relight_count')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as ProfileEmber[]
    },
    enabled: !!userId && profileQuery.data?.embers_hidden === false,
    staleTime: 30_000,
  })

  const blueEmbersQuery = useQuery<ProfileBlueEmber[]>({
    queryKey: ['userBlueEmbers', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blue_embers')
        .select('id, title, audio_duration, created_at, relight_count')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as ProfileBlueEmber[]
    },
    enabled: !!userId && profileQuery.data?.embers_hidden === false,
    staleTime: 30_000,
  })

  async function handleToggleFollow() {
    if (!ownUserId || userId === ownUserId || submitting) return
    setSubmitting(true)
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

    setSubmitting(false)
    if (error) {
      setIsFollowing(prev)
      return
    }

    queryClient.invalidateQueries({ queryKey: ['followerCount', userId] })
    queryClient.invalidateQueries({ queryKey: ['followingCount', userId] })
    queryClient.invalidateQueries({ queryKey: ['isFollowing', ownUserId, userId] })
    queryClient.invalidateQueries({ queryKey: ['followerCount', ownUserId] })
    queryClient.invalidateQueries({ queryKey: ['followingCount', ownUserId] })
    queryClient.invalidateQueries({ queryKey: ['myFollows', ownUserId] })
    queryClient.invalidateQueries({ queryKey: ['followersList', userId] })
    queryClient.invalidateQueries({ queryKey: ['followingList', userId] })
  }

  const profile = profileQuery.data
  const username = profile?.username ?? '…'
  const initial = username === '…' ? '?' : username.charAt(0).toUpperCase()
  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : ''
  const followerCount = followerCountQuery.data ?? 0
  const followingCount = followingCountQuery.data ?? 0
  const isOwnProfile = userId === ownUserId

  function renderEmberList() {
    if (profileQuery.isError) {
      return <View style={styles.centered}><Text style={styles.mutedText}>couldn't load profile</Text></View>
    }
    if (embersHidden) {
      return <View style={styles.centered}><Text style={styles.mutedText}>this user's embers are private</Text></View>
    }
    if (embersQuery.isLoading) {
      return (
        <>
          <View style={styles.skeletonCard} />
          <View style={styles.skeletonCard} />
          <View style={styles.skeletonCard} />
        </>
      )
    }
    if (!embersQuery.data?.length) {
      return <View style={styles.centered}><Text style={styles.mutedText}>no embers yet</Text></View>
    }
    return embersQuery.data.map(e => <EmberCard key={e.id} ember={e} />)
  }

  function renderBlueList() {
    if (profileQuery.isError) {
      return <View style={styles.centered}><Text style={styles.mutedText}>couldn't load profile</Text></View>
    }
    if (embersHidden) {
      return <View style={styles.centered}><Text style={styles.mutedText}>this user's embers are private</Text></View>
    }
    if (blueEmbersQuery.isLoading) {
      return (
        <>
          <View style={styles.skeletonCard} />
          <View style={styles.skeletonCard} />
          <View style={styles.skeletonCard} />
        </>
      )
    }
    if (!blueEmbersQuery.data?.length) {
      return <View style={styles.centered}><Text style={styles.mutedText}>no blue embers yet</Text></View>
    }
    return blueEmbersQuery.data.map(b => <BlueEmberCard key={b.id} blueEmber={b} />)
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Back row */}
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backChevron}>‹</Text>
          <Text style={styles.backUsername}>@{username}</Text>
        </TouchableOpacity>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <Text style={styles.username}>@{username}</Text>

          {/* Followers/following counts */}
          <View style={styles.followRow}>
            <TouchableOpacity onPress={() => setFollowListType('followers')} activeOpacity={0.7}>
              <Text style={styles.followText}>
                <Text style={styles.followCount}>{followerCount}</Text>
                {' followers'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.followDot}> · </Text>
            <TouchableOpacity onPress={() => setFollowListType('following')} activeOpacity={0.7}>
              <Text style={styles.followText}>
                <Text style={styles.followCount}>{followingCount}</Text>
                {' following'}
              </Text>
            </TouchableOpacity>
          </View>

          {joinedDate ? <Text style={styles.joinDate}>member since {joinedDate.toLowerCase()}</Text> : null}

          {/* Follow button — hidden for own profile */}
          {!isOwnProfile && (
            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followBtnActive]}
              onPress={handleToggleFollow}
              disabled={submitting}
              activeOpacity={0.7}
            >
              <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('embers')} activeOpacity={0.7}>
            <Text style={[styles.tabText, activeTab === 'embers' && styles.tabTextActive]}>EMBERS</Text>
            {activeTab === 'embers' && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('blue')} activeOpacity={0.7}>
            <Text style={[styles.tabText, activeTab === 'blue' && styles.tabTextBlue]}>BLUE EMBERS</Text>
            {activeTab === 'blue' && <View style={[styles.tabUnderline, { backgroundColor: '#3b82f6' }]} />}
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.list}>
          {activeTab === 'embers' ? renderEmberList() : renderBlueList()}
        </View>
      </ScrollView>

      <FollowListSheet
        visible={followListType !== null}
        onClose={() => setFollowListType(null)}
        type={followListType ?? 'followers'}
        count={followListType === 'following' ? followingCount : followerCount}
        targetUserId={userId}
        tabBarHeight={TAB_BAR_HEIGHT}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { paddingBottom: 40 },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 8,
    gap: 4,
  },
  backChevron: { fontSize: 26, color: '#666', lineHeight: 30 },
  backUsername: { fontSize: 13, fontWeight: '600', color: '#fff' },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarInitial: { fontSize: 26, color: '#f97316' },
  username: { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  followRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  followText: { fontSize: 12, color: '#888' },
  followCount: { color: '#ccc', fontWeight: '600' },
  followDot: { fontSize: 12, color: '#888' },
  joinDate: { fontSize: 11, color: '#444', marginTop: 3, letterSpacing: 0.3 },
  followBtn: {
    marginTop: 14,
    backgroundColor: '#f97316',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 40,
  },
  followBtnActive: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a' },
  followBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  followBtnTextActive: { color: '#888' },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#181818',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  tab: { paddingVertical: 10, paddingHorizontal: 14, position: 'relative' },
  tabText: { fontSize: 10, color: '#3a3a4a', letterSpacing: 0.7 },
  tabTextActive: { color: '#f97316' },
  tabTextBlue: { color: '#3b82f6' },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 14,
    right: 14,
    height: 2,
    backgroundColor: '#f97316',
    borderRadius: 1,
  },
  list: { padding: 16, gap: 8, flexDirection: 'column' },
  skeletonCard: { height: 80, backgroundColor: '#111', borderRadius: 10, marginBottom: 8 },
  centered: { alignItems: 'center', paddingVertical: 40 },
  mutedText: { fontSize: 13, color: '#3a3a4a' },
})
