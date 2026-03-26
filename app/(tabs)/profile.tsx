import React, { useState } from 'react'
import { useFocusEffect } from 'expo-router'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
} from 'react-native'
import Svg, { Path, Defs, RadialGradient, Stop, Rect } from 'react-native-svg'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { EmberCard, type ProfileEmber } from '@/components/profile/EmberCard'
import { BlueEmberCard, type ProfileBlueEmber } from '@/components/profile/BlueEmberCard'
import { SettingsSheet } from '@/components/profile/SettingsSheet'

type ActiveTab = 'embers' | 'blue'

function SkeletonCard() {
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
    <Animated.View style={[styles.skeletonCard, { opacity: anim }]} />
  )
}

export default function ProfileTab() {
  const profile = useAuthStore((s) => s.profile)
  const session = useAuthStore((s) => s.session)
  const [activeTab, setActiveTab] = useState<ActiveTab>('embers')
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Reset to Embers tab every time screen comes into focus (spec requirement)
  useFocusEffect(React.useCallback(() => { setActiveTab('embers') }, []))

  const embersQuery = useQuery<ProfileEmber[]>({
    queryKey: ['profileEmbers', session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('embers')
        .select('id, thought, ember_type, created_at, relight_count')
        .eq('user_id', session!.user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as ProfileEmber[]
    },
    enabled: !!session,
  })

  const blueEmbersQuery = useQuery<ProfileBlueEmber[]>({
    queryKey: ['profileBlueEmbers', session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blue_embers')
        .select('id, title, audio_duration, created_at, relight_count')
        .eq('user_id', session!.user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as ProfileBlueEmber[]
    },
    enabled: !!session,
  })

  const emberCount = embersQuery.data?.length ?? 0
  const blueCount = blueEmbersQuery.data?.length ?? 0
  const initial = profile?.username?.charAt(0).toUpperCase() ?? '?'

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : ''

  function renderEmberList() {
    if (embersQuery.isLoading) {
      return <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
    }
    if (embersQuery.isError) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>couldn't load embers</Text>
          <TouchableOpacity onPress={() => embersQuery.refetch()} activeOpacity={0.7}>
            <Text style={styles.retryText}>retry</Text>
          </TouchableOpacity>
        </View>
      )
    }
    if (!embersQuery.data?.length) {
      return <View style={styles.centered}><Text style={styles.emptyText}>no embers yet</Text></View>
    }
    return embersQuery.data.map(e => <EmberCard key={e.id} ember={e} />)
  }

  function renderBlueList() {
    if (blueEmbersQuery.isLoading) {
      return <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
    }
    if (blueEmbersQuery.isError) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>couldn't load embers</Text>
          <TouchableOpacity onPress={() => blueEmbersQuery.refetch()} activeOpacity={0.7}>
            <Text style={styles.retryText}>retry</Text>
          </TouchableOpacity>
        </View>
      )
    }
    if (!blueEmbersQuery.data?.length) {
      return <View style={styles.centered}><Text style={styles.emptyText}>no blue embers yet</Text></View>
    }
    return blueEmbersQuery.data.map(b => <BlueEmberCard key={b.id} blueEmber={b} />)
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero header */}
        <View style={styles.hero}>
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <Svg width="100%" height="100%" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice">
              <Defs>
                <RadialGradient id="heroGlow" cx="50%" cy="0%" r="70%">
                  <Stop offset="0%" stopColor="#ff8c32" stopOpacity="0.13" />
                  <Stop offset="100%" stopColor="#ff8c32" stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Rect x="0" y="0" width="400" height="260" fill="url(#heroGlow)" />
            </Svg>
          </View>
          {/* Gear button */}
          <TouchableOpacity style={styles.gearBtn} onPress={() => setSettingsOpen(true)} activeOpacity={0.7}>
            <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
              <Path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </Svg>
          </TouchableOpacity>

          {/* Avatar */}
          <View style={styles.avatarWrap}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInitial}>{initial}</Text>
            )}
          </View>

          <Text style={styles.username}>@{profile?.username ?? '...'}</Text>
          {joinedDate ? <Text style={styles.joinDate}>member since {joinedDate.toLowerCase()}</Text> : null}

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{emberCount}</Text>
              <Text style={styles.statLabel}>EMBERS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: '#3b82f6' }]}>{blueCount}</Text>
              <Text style={styles.statLabel}>BLUE EMBERS</Text>
            </View>
          </View>
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

        {/* List */}
        <View style={styles.list}>
          {activeTab === 'embers' ? renderEmberList() : renderBlueList()}
        </View>
      </ScrollView>

      <SettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { paddingBottom: 40 },
  hero: {
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  gearBtn: {
    position: 'absolute',
    top: 14,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#252525',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
    marginBottom: 10,
  },
  avatarImg: { width: 76, height: 76, borderRadius: 38 },
  avatarInitial: { fontSize: 28, color: '#f97316', fontWeight: '300' },
  username: { fontSize: 19, fontWeight: '700', color: '#ffffff', letterSpacing: 0.3 },
  joinDate: { fontSize: 11, color: '#444', marginTop: 3, letterSpacing: 0.3 },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginTop: 16,
  },
  stat: { alignItems: 'center', gap: 2 },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#f97316' },
  statLabel: { fontSize: 9, color: '#555', letterSpacing: 0.6 },
  statDivider: { width: 1, height: 28, backgroundColor: '#1e1e1e' },
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
  skeletonCard: {
    height: 80,
    backgroundColor: '#111',
    borderRadius: 10,
    marginBottom: 8,
  },
  centered: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 13, color: '#3a3a4a' },
  retryText: { fontSize: 12, color: '#f97316' },
})
