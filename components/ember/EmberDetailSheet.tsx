import React, { useRef, useEffect, useState } from 'react'
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Share,
  Alert,
  PanResponder,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native'
import Svg, { Path, Rect, Polygon, Circle, Line, Defs, RadialGradient, Stop } from 'react-native-svg'
import { WebView } from 'react-native-webview'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { daysRemaining, timeAgo } from '@/lib/emberUtils'
import { formatNumber } from '@/lib/formatNumber'
import { buildTikTokPlayerUrl } from '@/lib/tiktok'
import type { MapEmber } from '@/hooks/useMapEmbers'
import { UserProfileSheet } from '@/components/profile/UserProfileSheet'


const EMBER_TYPE_LABELS: Record<string, string> = {
  thought: 'Thought',
  confession: 'Confession',
  secret: 'Secret',
  question: 'Question',
  memory: 'Memory',
  dream: 'Dream',
  rant: 'Rant',
  gratitude: 'Gratitude',
}

const TYPE_ICON_COLOR = 'rgba(255,170,60,0.85)'

function EmberTypeIcon({ type, size = 14 }: { type: string; size?: number }) {
  const s = size
  switch (type) {
    case 'thought':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={TYPE_ICON_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
        </Svg>
      )
    case 'confession':
    case 'secret':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={TYPE_ICON_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
        </Svg>
      )
    case 'question':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={TYPE_ICON_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
        </Svg>
      )
    case 'memory':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={TYPE_ICON_COLOR} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M4 12c1.5-3 4-5 8-5s6.5 2 8 5M6 16c1-2 3-3.5 6-3.5s5 1.5 6 3.5M9 20c.5-1 1.5-2 3-2s2.5 1 3 2" />
        </Svg>
      )
    case 'dream':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={TYPE_ICON_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" />
        </Svg>
      )
    case 'rant':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={TYPE_ICON_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
          <Path d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
        </Svg>
      )
    case 'gratitude':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={TYPE_ICON_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </Svg>
      )
    default:
      return null
  }
}

const REACTIONS: { type: string; icon: (active: boolean) => React.ReactNode }[] = [
  {
    type: 'love',
    icon: (active) => (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : '#ffaa3c'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </Svg>
    ),
  },
  {
    type: 'hug',
    icon: (active) => (
      <Svg width={18} height={18} viewBox="0 0 71 71" fill={active ? '#fff' : '#ffaa3c'}>
        <Path d="M43.3303 15.8594C43.3303 13.2951 42.463 10.7999 40.8585 8.74786C39.254 6.69579 36.9987 5.19739 34.4306 4.47726C31.8625 3.75713 29.1201 3.85408 26.6144 4.75358C24.1087 5.65307 21.9747 7.30665 20.5323 9.46643C19.0899 11.6262 18.4168 14.1758 18.6139 16.7331C18.8111 19.2904 19.8678 21.7176 21.6257 23.6508C23.3837 25.584 25.7481 26.9191 28.3645 27.4559C30.9809 27.9928 33.7085 27.7024 36.1382 26.6285L33.9873 22.1593C32.5659 22.7876 30.9703 22.9574 29.4397 22.6434C27.909 22.3293 26.5259 21.5483 25.4975 20.4174C24.4691 19.2864 23.8509 17.8665 23.7356 16.3705C23.6202 14.8745 24.014 13.383 24.8578 12.1195C25.7016 10.856 26.95 9.88865 28.4158 9.36244C29.8817 8.83624 31.486 8.77952 32.9884 9.2008C34.4907 9.62207 35.8101 10.4986 36.7487 11.6991C37.6873 12.8996 38.1947 14.3593 38.1947 15.8594H43.3303Z" />
        <Path d="M51.5026 30.7348C52.9043 29.3331 53.8943 27.5735 54.3647 25.6478C54.8351 23.7221 54.7679 21.7043 54.1704 19.8142C53.5729 17.9241 52.468 16.2343 50.9761 14.929C49.4843 13.6237 47.6627 12.7529 45.71 12.4117C43.7573 12.0704 41.7484 12.2717 39.9023 12.9937C38.0561 13.7157 36.4436 14.9306 35.2404 16.506C34.0373 18.0814 33.2896 19.9568 33.0791 21.9279C32.8685 23.899 33.2031 25.89 34.0463 27.6841L38.6337 25.5279C38.1852 24.5737 38.0072 23.5147 38.1192 22.4663C38.2312 21.418 38.6289 20.4204 39.2688 19.5825C39.9087 18.7446 40.7664 18.0984 41.7484 17.7144C42.7303 17.3304 43.7988 17.2233 44.8374 17.4048C45.876 17.5863 46.8449 18.0495 47.6384 18.7437C48.4318 19.438 49.0195 20.3368 49.3373 21.3421C49.6552 22.3474 49.6909 23.4207 49.4407 24.4449C49.1905 25.4691 48.6639 26.405 47.9184 27.1505L51.5026 30.7348Z" />
        <Path d="M15.1935 42.1603C16.8279 42.2433 18.1281 43.5949 18.1281 45.25C18.1281 45.885 17.9356 46.4749 17.6074 46.966C17.605 46.9767 17.602 46.9879 17.5994 46.9993C17.4802 47.5238 17.335 48.4383 17.2127 49.7838C16.9702 52.4509 16.8399 56.5614 17.0928 62.1256C17.1701 63.8323 15.8498 65.2787 14.1431 65.3563C12.4362 65.4339 10.99 64.1124 10.9124 62.4056C10.6497 56.6263 10.7772 52.2286 11.0504 49.2239C11.1858 47.7337 11.3629 46.5211 11.566 45.6276C11.6628 45.2015 11.7928 44.7225 11.9799 44.2892C12.0666 44.0883 12.2348 43.7319 12.5237 43.3738C12.7238 43.1258 13.5547 42.1562 15.0344 42.1562L15.1935 42.1603Z" />
        <Path d="M21.0396 23.1598C23.9481 22.4578 28.1255 22.8763 34.3612 24.1367L54.1987 27.7682C57.1906 28.2322 59.5655 29.3074 61.2442 30.9617C62.9644 32.6569 63.7232 34.7364 63.8223 36.7161C63.9187 38.6432 63.3978 40.4919 62.5514 41.9428C61.7778 43.269 60.3581 44.8608 58.2763 45.2078C56.591 45.4887 54.9973 44.3502 54.7163 42.6649C54.4526 41.083 55.4392 39.581 56.9551 39.1704C57.0086 39.1143 57.0978 39.0101 57.2058 38.8249C57.4874 38.3423 57.6754 37.6763 57.6429 37.0253C57.6129 36.4272 57.4048 35.8646 56.9017 35.3686C56.3748 34.8494 55.3021 34.1899 53.1835 33.8721L53.1342 33.8651L53.0859 33.856L33.191 30.2124L33.1638 30.2074L33.1356 30.2023C26.7821 28.9182 23.8911 28.8375 22.4918 29.1751C21.9582 29.3039 21.7882 29.4628 21.6831 29.5779C21.4974 29.7814 21.2768 30.1409 20.9087 30.9999C20.2356 32.5703 18.4165 33.2982 16.8461 32.6254C15.2757 31.9523 14.5478 30.1332 15.2207 28.5628C15.6259 27.6174 16.1793 26.4298 17.112 25.4076C18.1254 24.2971 19.4198 23.5508 21.0396 23.1598Z" />
        <Path d="M34.049 63.2968V48.3437C34.049 46.6351 35.4342 45.25 37.1428 45.25C38.8514 45.25 40.2365 46.6351 40.2365 48.3437V63.2968C40.2365 65.0055 38.8514 66.3906 37.1428 66.3906C35.4342 66.3906 34.049 65.0055 34.049 63.2968ZM54.2249 40.9558C55.1726 39.5341 57.0944 39.15 58.516 40.0978C60.3002 41.2874 61.3229 43.3016 61.9038 46.4242C62.4828 49.5363 62.7297 54.3211 62.4698 61.8567C62.4109 63.5641 60.9787 64.9004 59.2713 64.8417C57.5637 64.7828 56.2265 63.3508 56.2853 61.6432C56.5411 54.2259 56.2723 49.9871 55.8201 47.5562C55.386 45.2228 54.8834 45.0941 55.0607 45.2298C53.6581 44.2768 53.2824 42.3697 54.2249 40.9558Z" />
        <Path d="M37.9643 32.1207C39.8736 31.9751 41.5328 32.5119 42.953 33.0752L43.5477 33.3173L43.6014 33.3389L43.6545 33.3635L58.5689 40.1789C60.1228 40.889 60.8071 42.7245 60.0973 44.2785C59.3871 45.8325 57.5508 46.5169 55.9968 45.8067L41.1413 39.0173C39.6106 38.3887 38.9941 38.2476 38.435 38.2903C37.8958 38.3315 36.9465 38.5958 35.0431 39.9779L34.9011 40.0817L34.7478 40.1681C33.3238 40.9729 32.4186 41.6807 31.3097 42.4305C30.3856 43.0553 28.8906 44.0347 26.9925 44.0035C25.0218 43.971 23.4231 42.8958 22.0674 41.6733C20.6971 40.4376 19.0912 38.5961 17.076 36.1079C17.0373 36.0787 16.9678 36.0544 16.7924 36.0675C16.461 36.0924 15.936 36.268 15.3845 36.6809C14.8377 37.0903 14.4681 37.5829 14.3036 37.9835C14.2262 38.172 14.2062 38.3032 14.2085 38.3957C17.7816 42.9449 20.2679 45.968 22.2299 47.893C24.2835 49.9076 25.2744 50.2163 25.7978 50.2482C26.3996 50.2849 27.3315 50.0343 29.5172 48.6544C30.5603 47.9959 31.7243 47.1944 33.1781 46.2098C34.6092 45.2405 36.2615 44.1351 38.1825 42.9428C39.6343 42.0417 41.5426 42.4879 42.4436 43.9396C43.3445 45.3913 42.8976 47.2985 41.446 48.1995C39.6291 49.3273 38.0563 50.3785 36.6483 51.3321C35.2631 52.2702 33.9733 53.1586 32.82 53.8867C30.6126 55.2802 28.1801 56.5924 25.4222 56.4245C22.5857 56.2517 20.2204 54.5881 17.8978 52.3096C15.541 49.9974 12.7194 46.5257 9.02059 41.8081L8.81011 41.54L8.66332 41.2327C6.75203 37.2292 9.34862 33.4704 11.6762 31.7277C12.96 30.7666 14.5848 30.0278 16.3312 29.8972C18.042 29.7693 19.8839 30.2418 21.3517 31.6347L21.6406 31.9254L21.715 32.0061L21.784 32.0917C23.8438 34.6399 25.2153 36.18 26.2114 37.0782C26.6533 37.4766 26.9385 37.6694 27.0943 37.7602C27.2253 37.6925 27.4628 37.5615 27.8436 37.304C28.606 36.7885 29.9092 35.8116 31.5461 34.8717C33.773 33.2738 35.8009 32.2859 37.9643 32.1207Z" />
        <Path d="M37.3014 58.6844C38.6307 58.5024 39.8749 59.196 40.4616 60.3209C40.7457 60.451 41.2125 60.6189 41.8977 60.7842C43.5812 61.1903 45.938 61.4425 48.4065 61.472C50.8773 61.5015 53.2503 61.3053 54.9736 60.9151C55.7815 60.7321 56.3086 60.533 56.6051 60.3803C57.2298 59.1128 58.6665 58.3987 60.0987 58.7418C61.76 59.14 62.7838 60.8096 62.3857 62.471C61.9695 64.2078 60.6505 65.2109 59.7069 65.741C58.6956 66.3092 57.5027 66.6863 56.3402 66.9495C53.9881 67.4821 51.0962 67.6925 48.3329 67.6595C45.5674 67.6264 42.7196 67.3465 40.4475 66.7984C39.3302 66.5289 38.1812 66.1551 37.2218 65.6101C36.3949 65.1403 34.919 64.0918 34.6558 62.1699C34.4241 60.4772 35.6087 58.9163 37.3014 58.6844Z" />
        <Path d="M14.5182 59.1718C15.5457 59.1718 16.4531 59.6749 17.0158 60.4458C17.2971 60.5362 17.7145 60.6475 18.2908 60.758C19.9946 61.0846 22.4196 61.302 25.0332 61.3642C27.634 61.4262 30.2872 61.331 32.4281 61.0782C33.5024 60.9514 34.3819 60.792 35.0324 60.617C35.78 60.4158 35.8891 60.2806 35.7404 60.4045C37.053 59.3107 39.0042 59.4879 40.0981 60.8003C41.1918 62.1128 41.0147 64.064 39.7023 65.1579C38.7802 65.9263 37.5838 66.339 36.6397 66.593C35.5985 66.8731 34.3991 67.0764 33.1532 67.2234C30.6536 67.5185 27.6993 67.6167 24.8861 67.5497C22.0858 67.4831 19.2898 67.2493 17.1266 66.8347C16.0726 66.6327 14.9883 66.3553 14.0953 65.9444C13.6554 65.742 13.0843 65.4279 12.5816 64.9364C12.0594 64.4256 11.4245 63.5243 11.4245 62.2656C11.4245 60.557 12.8096 59.1718 14.5182 59.1718Z" />
      </Svg>
    ),
  },
  {
    type: 'fire',
    icon: (active) => (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : '#ffaa3c'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </Svg>
    ),
  },
  {
    type: 'sad',
    icon: (active) => (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : '#ffaa3c'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Circle cx={12} cy={12} r={10} />
        <Path d="M16 16s-1.5-2-4-2-4 2-4 2" />
        <Line x1={9} x2={9.01} y1={9} y2={9} />
        <Line x1={15} x2={15.01} y1={9} y2={9} />
      </Svg>
    ),
  },
]

interface Props {
  ember: MapEmber
  onDismiss: () => void
  tabBarHeight: number
}

type EmberComment = {
  id: string
  user_id: string
  username: string
  content: string
  created_at: string
  profiles: { avatar_url: string | null } | null
}

export function EmberDetailSheet({ ember, onDismiss, tabBarHeight }: Props) {
  const { session, profile } = useAuthStore()
  const queryClient = useQueryClient()
  const days = daysRemaining(ember.created_at, ember.relit_at, 30)
  const [muted, setMuted] = useState(false)
  const [userProfileVisible, setUserProfileVisible] = useState(false)
  const webViewRef = useRef<WebView>(null)
  const hasTiktok = !!(ember.show_tiktok && ember.tiktok_link)
  const tiktokUrl = hasTiktok ? buildTikTokPlayerUrl(ember.tiktok_link!) : null

  const [playing, setPlaying] = useState(hasTiktok)

  // Inject play/pause into TikTok player
  useEffect(() => {
    const js = playing
      ? `(function(){ var v=document.querySelector('video'); if(v){v.play();} })(); true;`
      : `(function(){ var v=document.querySelector('video'); if(v){v.pause();} })(); true;`
    webViewRef.current?.injectJavaScript(js)
  }, [playing])

  // Inject mute/unmute into TikTok player
  useEffect(() => {
    const js = muted
      ? `(function(){ var v=document.querySelector('video'); if(v){v.muted=true;} })(); true;`
      : `(function(){ var v=document.querySelector('video'); if(v){v.muted=false;v.volume=1;} })(); true;`
    webViewRef.current?.injectJavaScript(js)
  }, [muted])

  // Glow pulse animation
  const glowAnim = useRef(new Animated.Value(1)).current
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1.2, duration: 1200, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  // Reactions
  const { data: reactionCounts } = useQuery({
    queryKey: ['reactions', ember.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('ember_reactions')
        .select('reaction_type')
        .eq('ember_id', ember.id)
      const counts: Record<string, number> = { love: 0, hug: 0, fire: 0, sad: 0 }
      data?.forEach((r: { reaction_type: string }) => { counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1 })
      return counts
    },
    staleTime: 30_000,
  })

  const { data: userReaction } = useQuery({
    queryKey: ['userReaction', ember.id, session?.user.id],
    queryFn: async () => {
      if (!session?.user.id) return null
      const { data } = await supabase
        .from('ember_reactions')
        .select('reaction_type')
        .eq('ember_id', ember.id)
        .eq('user_id', session.user.id)
        .maybeSingle()
      return data?.reaction_type ?? null
    },
    enabled: !!session?.user.id,
    staleTime: 30_000,
  })

  const reactMutation = useMutation({
    mutationFn: async (type: string) => {
      if (!session?.user.id) return
      if (userReaction === type) {
        await supabase.from('ember_reactions').delete()
          .eq('ember_id', ember.id).eq('user_id', session.user.id)
      } else {
        await supabase.from('ember_reactions').upsert({
          ember_id: ember.id, user_id: session.user.id, reaction_type: type
        })
      }
    },
    onMutate: async (type: string) => {
      const countsKey = ['reactions', ember.id]
      const userKey = ['userReaction', ember.id, session?.user.id]

      await queryClient.cancelQueries({ queryKey: countsKey })
      await queryClient.cancelQueries({ queryKey: userKey })

      const prevCounts = queryClient.getQueryData<Record<string, number>>(countsKey)
      const prevUserReaction = queryClient.getQueryData<string | null>(userKey)

      const isToggleOff = prevUserReaction === type
      queryClient.setQueryData<Record<string, number>>(countsKey, (old = { love: 0, hug: 0, fire: 0, sad: 0 }) => {
        const updated = { ...old }
        if (isToggleOff) {
          updated[type] = Math.max(0, (updated[type] ?? 0) - 1)
        } else {
          if (prevUserReaction) updated[prevUserReaction] = Math.max(0, (updated[prevUserReaction] ?? 0) - 1)
          updated[type] = (updated[type] ?? 0) + 1
        }
        return updated
      })
      queryClient.setQueryData<string | null>(userKey, isToggleOff ? null : type)

      return { prevCounts, prevUserReaction }
    },
    onError: (_err, _type, context) => {
      if (context?.prevCounts) queryClient.setQueryData(['reactions', ember.id], context.prevCounts)
      if (context !== undefined) queryClient.setQueryData(['userReaction', ember.id, session?.user.id], context.prevUserReaction)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['reactions', ember.id] })
      queryClient.invalidateQueries({ queryKey: ['userReaction', ember.id, session?.user.id] })
    },
  })

  // Relight
  const { data: canRelight } = useQuery({
    queryKey: ['canRelight', ember.id, session?.user.id],
    queryFn: async () => {
      if (!session?.user.id) return false
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('ember_relights')
        .select('id')
        .eq('ember_id', ember.id)
        .eq('user_id', session.user.id)
        .gte('created_at', `${today}T00:00:00Z`)
        .maybeSingle()
      return !data
    },
    enabled: !!session?.user.id,
    staleTime: 60_000,
  })

  const relightMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user.id) return
      await supabase.from('ember_relights').insert({ ember_id: ember.id, user_id: session.user.id })
      await supabase.from('embers').update({ relight_count: (ember.relight_count || 0) + 1, relit_at: new Date().toISOString() })
        .eq('id', ember.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canRelight', ember.id, session?.user.id] })
      queryClient.invalidateQueries({ queryKey: ['ember', ember.id] })
    },
  })

  // Comments
  const { data: comments = [] } = useQuery({
    queryKey: ['comments', ember.id],
    queryFn: async () => {
      const { data: commentData, error } = await supabase
        .from('ember_comments')
        .select('id, user_id, username, content, created_at')
        .eq('ember_id', ember.id)
        .order('created_at', { ascending: true })
      if (error) throw error
      if (!commentData?.length) return []

      let avatarMap: Record<string, string | null> = {}
      try {
        const userIds = [...new Set(commentData.map(c => c.user_id))]
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, avatar_url')
          .in('id', userIds)
        avatarMap = Object.fromEntries((profileData ?? []).map(p => [p.id, p.avatar_url]))
      } catch {}

      return commentData.map(c => ({
        ...c,
        profiles: { avatar_url: avatarMap[c.user_id] ?? null },
      })) as EmberComment[]
    },
    staleTime: 30_000,
  })

  const [commentText, setCommentText] = useState('')
  const commentScrollRef = useRef<ScrollView>(null)

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!session?.user.id) return
      await supabase.from('ember_comments').insert({
        ember_id: ember.id,
        user_id: session.user.id,
        username: profile?.username ?? 'unknown',
        content,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', ember.id] })
    },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await supabase.from('ember_comments').delete().eq('id', commentId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', ember.id] })
    },
  })

  useEffect(() => {
    const channel = supabase
      .channel(`comments:${ember.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ember_comments', filter: `ember_id=eq.${ember.id}` }, (payload) => {
        queryClient.setQueryData<EmberComment[]>(['comments', ember.id], old => {
          if (!old) return [payload.new as EmberComment]
          if (old.find(c => c.id === (payload.new as EmberComment).id)) return old
          return [...old, payload.new as EmberComment]
        })
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'ember_comments', filter: `ember_id=eq.${ember.id}` }, (payload) => {
        queryClient.setQueryData<EmberComment[]>(['comments', ember.id], old =>
          old?.filter(c => c.id !== (payload.old as EmberComment).id) ?? []
        )
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [ember.id])

  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState<string | null>(null)
  const [reportStatus, setReportStatus] = useState<'idle' | 'success' | 'duplicate'>('idle')

  const reportMutation = useMutation({
    mutationFn: async (reason: string) => {
      if (!session?.user.id) throw new Error('Not signed in')
      const { error } = await supabase.from('ember_reports').insert({
        ember_id: ember.id,
        reporter_id: session.user.id,
        reason,
      })
      if (error) throw error
    },
    onSuccess: () => {
      setReportStatus('success')
      setTimeout(() => {
        setShowReportModal(false)
        setReportReason(null)
        setReportStatus('idle')
      }, 2000)
    },
    onError: (err: any) => {
      if (err?.code === '23505') setReportStatus('duplicate')
    },
  })
  const [commentsOpen, setCommentsOpen] = useState(false)
  const accordionAnim = useRef(new Animated.Value(0)).current

  function toggleComments() {
    const toValue = commentsOpen ? 0 : 1
    setCommentsOpen(o => !o)
    Animated.timing(accordionAnim, {
      toValue,
      duration: 280,
      useNativeDriver: false,
    }).start()
  }

  const accordionMaxHeight = accordionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 500],
  })
  const accordionOpacity = accordionAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
  })
  const [hoveredReaction, setHoveredReaction] = useState<string | null>(null)
  const showPickerRef = useRef(false)
  const hoveredRef = useRef<string | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<View>(null)
  const wrapperPageX = useRef(0)
  const userReactionRef = useRef(userReaction)
  useEffect(() => { userReactionRef.current = userReaction }, [userReaction])

  // Each picker item slot: 36px icon + 6px gap = 42px, plus 10px left padding
  const PICKER_PADDING = 10
  const PICKER_ITEM_SLOT = 42

  const reactionPanResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => showPickerRef.current,

    onPanResponderGrant: () => {
      longPressTimer.current = setTimeout(() => {
        wrapperRef.current?.measure((_x, _y, _w, _h, pageX) => {
          wrapperPageX.current = pageX
        })
        showPickerRef.current = true
        setShowReactionPicker(true)
      }, 400)
    },

    onPanResponderMove: (e) => {
      if (!showPickerRef.current) return
      const relX = e.nativeEvent.pageX - wrapperPageX.current - PICKER_PADDING
      const index = Math.max(0, Math.min(REACTIONS.length - 1, Math.floor(relX / PICKER_ITEM_SLOT)))
      const type = REACTIONS[index]?.type ?? null
      if (type !== hoveredRef.current) {
        hoveredRef.current = type
        setHoveredReaction(type)
      }
    },

    onPanResponderRelease: () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current)
      if (showPickerRef.current) {
        const selected = hoveredRef.current
        showPickerRef.current = false
        hoveredRef.current = null
        setShowReactionPicker(false)
        setHoveredReaction(null)
        if (selected && session) reactMutation.mutate(selected)
      } else {
        // Quick tap
        if (!session) { Alert.alert('Sign in to react'); return }
        if (userReactionRef.current) reactMutation.mutate(userReactionRef.current)
        else reactMutation.mutate('love')
      }
    },

    onPanResponderTerminate: () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current)
      showPickerRef.current = false
      hoveredRef.current = null
      setShowReactionPicker(false)
      setHoveredReaction(null)
    },
  })).current

  async function handleShare() {
    try {
      await Share.share({ message: `Check out this ember on Embers — ember id: ${ember.id}` })
    } catch {}
  }

  function handleReport() {
    if (!session) { Alert.alert('Sign in to report'); return }
    setReportReason(null)
    setReportStatus('idle')
    setShowReportModal(true)
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onDismiss} />

      <View style={styles.centeredWrapper} pointerEvents="box-none">
        <View style={styles.card}>

          {/* TikTok background */}
          {tiktokUrl && (
            <View style={styles.videoBackground}>
              <WebView
                ref={webViewRef}
                source={{ uri: tiktokUrl }}
                style={styles.video}
                originWhitelist={['*']}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                scrollEnabled={false}
                pointerEvents="none"
                onLoadEnd={() => {
                  const js = `(function(){
                    var attempts=0;
                    function tryUnmute(){
                      var v=document.querySelector('video');
                      if(v){v.muted=false;v.volume=1;}
                      else if(attempts++<20){setTimeout(tryUnmute,500);}
                    }
                    tryUnmute();
                  })(); true;`
                  webViewRef.current?.injectJavaScript(js)
                }}
              />
              <View style={styles.videoDim} />
            </View>
          )}

          {/* Subtle orange gradient background when no TikTok */}
          {!tiktokUrl && (
            <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
              <Svg width="100%" height="100%" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
                <Defs>
                  <RadialGradient id="bgGlow" cx="50%" cy="15%" r="60%">
                    <Stop offset="0%" stopColor="#ff8c32" stopOpacity="0.12" />
                    <Stop offset="100%" stopColor="#ff8c32" stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                <Rect x="0" y="0" width="400" height="600" fill="url(#bgGlow)" />
              </Svg>
            </View>
          )}

          {/* Close */}
          <TouchableOpacity style={styles.closeBtn} onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} scrollEnabled={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>

            {/* Header — glow orb + relight count + type badge grouped */}
            <View style={styles.header}>
              <View style={styles.headerGroup}>
                <Text style={styles.relitCount}>{formatNumber(ember.relight_count)}</Text>

                <Animated.View style={[styles.orbWrapper, { transform: [{ scale: glowAnim }] }]}>
                  <Svg width={22} height={22} viewBox="0 0 22 22">
                    <Defs>
                      <RadialGradient id="emberSmall" cx="50%" cy="50%" r="50%">
                        <Stop offset="0%" stopColor="#fb923c" />
                        <Stop offset="100%" stopColor="#7c2d12" />
                      </RadialGradient>
                    </Defs>
                    <Circle cx="11" cy="11" r="11" fill="url(#emberSmall)" />
                    <Circle cx="11" cy="11" r="4" fill="#fed7aa" opacity="0.9" />
                  </Svg>
                </Animated.View>

                {ember.ember_type && (
                  <View style={styles.typeBadge}>
                    <EmberTypeIcon type={ember.ember_type} size={14} />
                    <Text style={styles.typeLabel}>{EMBER_TYPE_LABELS[ember.ember_type] ?? ember.ember_type}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Thought */}
            <ScrollView style={styles.thoughtScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
              <Text style={styles.thought}>"{ember.thought}"</Text>
            </ScrollView>

            {/* Attribution + controls */}
            <View style={styles.attribution}>
              {ember.user_id && ember.user_id !== session?.user.id ? (
                <TouchableOpacity onPress={() => setUserProfileVisible(true)} activeOpacity={0.7}>
                  <Text style={styles.username}>— {ember.username ?? 'unknown'}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.username}>— {ember.username ?? 'unknown'}</Text>
              )}

              <View style={styles.controls}>
                {/* Disc play/pause */}
                {tiktokUrl && (
                  <TouchableOpacity
                    style={[styles.muteBtn, !playing && styles.muteBtnActive]}
                    onPress={() => setPlaying(p => !p)}
                    activeOpacity={0.8}
                  >
                    {playing ? (
                      <Svg width={14} height={14} viewBox="0 0 16 16" fill="none">
                        <Rect x="3" y="3" width="3" height="10" rx="1" fill="white" />
                        <Rect x="10" y="3" width="3" height="10" rx="1" fill="white" />
                      </Svg>
                    ) : (
                      <Svg width={14} height={14} viewBox="0 0 16 16" fill="none">
                        <Polygon points="4,3 13,8 4,13" fill="white" />
                      </Svg>
                    )}
                  </TouchableOpacity>
                )}

                {/* Mute/unmute */}
                {tiktokUrl && (
                  <TouchableOpacity
                    style={[styles.muteBtn, muted && styles.muteBtnActive]}
                    onPress={() => setMuted(m => !m)}
                    activeOpacity={0.8}
                  >
                    {muted ? (
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M4 10V14H8L13 18V6L8 10H4Z" />
                      </Svg>
                    ) : (
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M4 10V14H8L13 18V6L8 10H4Z" />
                        <Path d="M16 9C17.5 10.5 17.5 13.5 16 15" />
                        <Path d="M18.5 7C21 9.5 21 14.5 18.5 17" />
                      </Svg>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Reactions + fade/relight row */}
            <View style={styles.reactionsRow}>
              <View ref={wrapperRef} collapsable={false}>
                {/* Floating reaction picker */}
                {showReactionPicker && (
                  <View style={styles.reactionPicker}>
                    {REACTIONS.map(({ type, icon }) => {
                      const isHovered = hoveredReaction === type
                      const isActive = userReaction === type
                      return (
                        <Animated.View
                          key={type}
                          style={[
                            styles.reactionPickerBtn,
                            isActive && styles.reactionPickerBtnActive,
                            isHovered && styles.reactionPickerBtnHovered,
                            isHovered && { transform: [{ scale: 1.35 }] },
                          ]}
                        >
                          {icon(isActive || isHovered)}
                        </Animated.View>
                      )
                    })}
                  </View>
                )}

                {/* Single reaction button — driven by PanResponder */}
                {(() => {
                  const totalCount = Object.values(reactionCounts ?? {}).reduce((a, b) => a + b, 0)
                  const activeReaction = REACTIONS.find(r => r.type === userReaction)
                  const heartReaction = REACTIONS.find(r => r.type === 'love')!
                  return (
                    <View style={styles.reactionBtnRow}>
                      <View
                        style={[styles.reactionBtn, !!userReaction && styles.reactionBtnActive]}
                        {...reactionPanResponder.panHandlers}
                      >
                        {activeReaction ? activeReaction.icon(true) : heartReaction.icon(false)}
                      </View>
                      {totalCount > 0 && <Text style={styles.reactionCount}>{formatNumber(totalCount)}</Text>}
                    </View>
                  )
                })()}
              </View>

              <View style={styles.fadeRow}>
                <View style={styles.fadeIndicator}>
                  <View style={[
                    styles.fadeDot,
                    days <= 3 ? styles.fadeDotRed : days <= 7 ? styles.fadeDotOrange : styles.fadeDotGreen
                  ]} />
                  <Text style={[
                    styles.fadeText,
                    days <= 3 ? styles.fadeTextRed : days <= 7 ? styles.fadeTextOrange : styles.fadeTextGreen
                  ]}>
                    {days === 0 ? 'Fading today' : days === 1 ? 'Fades tomorrow' : days <= 3 ? `Fades in ${days} days` : `${days} days to fade`}
                  </Text>
                </View>

                {session ? (
                  canRelight ? (
                    <TouchableOpacity onPress={() => relightMutation.mutate()} disabled={relightMutation.isPending}>
                      <Text style={styles.relightBtn}>{relightMutation.isPending ? 'Relighting...' : 'Re-light'}</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.relightDone}>Relit today ✓</Text>
                  )
                ) : (
                  <Text style={styles.relightDisabled}>Sign in to re-light</Text>
                )}
              </View>
            </View>

            {/* Comments */}
            <View style={styles.commentsSection}>
              <TouchableOpacity style={styles.commentsSectionHeader} onPress={toggleComments} activeOpacity={0.7}>
                <Text style={styles.commentsSectionTitle}>Comments{comments.length > 0 ? ` · ${comments.length}` : ''}</Text>
                <Text style={styles.commentsChevron}>{commentsOpen ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              <Animated.View style={{ maxHeight: accordionMaxHeight, opacity: accordionOpacity }}>
                  {/* List */}
                  {comments.length > 0 && (
                    <ScrollView
                      ref={commentScrollRef}
                      style={styles.commentsList}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled
                      onContentSizeChange={() => commentScrollRef.current?.scrollToEnd({ animated: false })}
                    >
                      {comments.map(c => (
                        <View key={c.id} style={styles.commentItem}>
                          <View style={styles.commentAvatar}>
                            {c.profiles?.avatar_url
                              ? <Image source={{ uri: c.profiles.avatar_url }} style={styles.commentAvatarImg} />
                              : <Text style={styles.commentAvatarText}>{c.username[0]?.toUpperCase()}</Text>
                            }
                          </View>
                          <View style={styles.commentBody}>
                            <View style={styles.commentHeader}>
                              <Text style={styles.commentUsername}>{c.username}</Text>
                              <Text style={styles.commentTime}>{timeAgo(c.created_at)}</Text>
                              {c.user_id === session?.user.id && (
                                <TouchableOpacity
                                onPress={() => Alert.alert('Delete comment', 'Are you sure?', [
                                  { text: 'Cancel', style: 'cancel' },
                                  { text: 'Delete', style: 'destructive', onPress: () => deleteCommentMutation.mutate(c.id) },
                                ])}
                                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                              >
                                  <Text style={styles.commentDelete}>✕</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                            <Text style={styles.commentContent}>{c.content}</Text>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  )}

                  {/* Input */}
                  {session ? (
                    comments.length >= 50 ? (
                      <Text style={styles.commentsPlaceholder}>Comment limit reached</Text>
                    ) : (
                      <View style={styles.commentInputRow}>
                        <TextInput
                          style={styles.commentInput}
                          value={commentText}
                          onChangeText={t => setCommentText(t.slice(0, 200))}
                          placeholder="Lit a comment (max 200 chars)..."
                          placeholderTextColor="rgba(255,255,255,0.25)"
                          returnKeyType="send"
                          onSubmitEditing={() => {
                            if (!commentText.trim()) return
                            commentMutation.mutate(commentText.trim())
                            setCommentText('')
                          }}
                          editable={!commentMutation.isPending}
                        />
                        <TouchableOpacity
                          style={[styles.commentSubmit, (!commentText.trim() || commentMutation.isPending) && styles.commentSubmitDisabled]}
                          onPress={() => {
                            if (!commentText.trim()) return
                            commentMutation.mutate(commentText.trim())
                            setCommentText('')
                          }}
                          disabled={!commentText.trim() || commentMutation.isPending}
                        >
                          <Text style={styles.commentSubmitText}>lit</Text>
                        </TouchableOpacity>
                      </View>
                    )
                  ) : (
                    <Text style={styles.commentsPlaceholder}>Sign in to comment</Text>
                  )}
              </Animated.View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerMeta}>
                lighted {timeAgo(ember.created_at)}
                {(ember.view_count ?? 0) > 0 ? ` · ${formatNumber(ember.view_count!)} views` : ''}
              </Text>

              <View style={styles.footerActions}>
                {/* Share */}
                <TouchableOpacity style={styles.footerBtn} onPress={handleShare} activeOpacity={0.7}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0-12.814a2.25 2.25 0 1 0 0-2.186m0 2.186a2.25 2.25 0 1 0 0 2.186m0-2.186c-.18.324-.283.696-.283 1.093s.103.77.283 1.093m0 7.442a2.25 2.25 0 1 0 0 2.186m0-2.186a2.25 2.25 0 1 0 0-2.186m0 2.186c-.18.324-.283.696-.283 1.093s.103.77.283 1.093" />
                  </Svg>
                </TouchableOpacity>

                {/* Report */}
                <TouchableOpacity style={styles.footerBtn} onPress={handleReport} activeOpacity={0.7}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
                  </Svg>
                </TouchableOpacity>
              </View>
            </View>

          </ScrollView>
        </View>
      </View>
      </KeyboardAvoidingView>
      {/* Report Modal */}
      <Modal visible={showReportModal} transparent animationType="fade" onRequestClose={() => setShowReportModal(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowReportModal(false)} />
        <View style={styles.centeredWrapper} pointerEvents="box-none">
          <View style={styles.reportCard}>

            <TouchableOpacity style={styles.reportClose} onPress={() => setShowReportModal(false)}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>

            {reportStatus === 'success' ? (
              <View style={styles.reportFeedback}>
                <Text style={styles.reportFeedbackIcon}>✅</Text>
                <Text style={styles.reportFeedbackTitle}>Thanks for reporting.</Text>
                <Text style={styles.reportFeedbackSub}>We'll review it shortly.</Text>
              </View>
            ) : reportStatus === 'duplicate' ? (
              <View style={styles.reportFeedback}>
                <Text style={styles.reportFeedbackIcon}>🚩</Text>
                <Text style={styles.reportFeedbackTitle}>Already reported</Text>
                <Text style={styles.reportFeedbackSub}>You've already reported this ember.</Text>
              </View>
            ) : (
              <>
                <Text style={styles.reportTitle}>Report Ember</Text>
                <Text style={styles.reportSubtitle}>Why are you reporting this ember?</Text>

                {[
                  { key: 'hateful', emoji: '🔴', label: 'Hateful content', desc: 'Offensive, discriminatory, or harmful language' },
                  { key: 'spam',    emoji: '📢', label: 'Spam',            desc: 'Repetitive, irrelevant, or promotional content' },
                  { key: 'malicious', emoji: '⚠️', label: 'Malicious',    desc: 'Dangerous links, threats, or harmful intent' },
                ].map(({ key, emoji, label, desc }) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.reportOption, reportReason === key && styles.reportOptionActive]}
                    onPress={() => setReportReason(key)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.reportOptionEmoji}>{emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reportOptionLabel}>{label}</Text>
                      <Text style={styles.reportOptionDesc}>{desc}</Text>
                    </View>
                    <View style={[styles.reportRadio, reportReason === key && styles.reportRadioActive]} />
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={[styles.reportSubmit, (!reportReason || reportMutation.isPending) && styles.reportSubmitDisabled]}
                  onPress={() => reportReason && reportMutation.mutate(reportReason)}
                  disabled={!reportReason || reportMutation.isPending}
                  activeOpacity={0.8}
                >
                  <Text style={styles.reportSubmitText}>{reportMutation.isPending ? 'Submitting...' : 'Submit Report'}</Text>
                </TouchableOpacity>
              </>
            )}

          </View>
        </View>
      </Modal>

      {ember.user_id && ember.user_id !== session?.user.id && (
        <UserProfileSheet
          visible={userProfileVisible}
          onClose={() => setUserProfileVisible(false)}
          userId={ember.user_id}
          username={ember.username ?? ''}
          tabBarHeight={tabBarHeight}
        />
      )}
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  centeredWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxHeight: '88%',
    backgroundColor: '#111114',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  videoBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  video: {
    flex: 1,
    backgroundColor: '#000',
    transform: [{ scale: 2.5 }],
  },
  videoDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.82)',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  scroll: { padding: 20, paddingBottom: 24 },

  // Header
  header: {
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  relitCount: { fontSize: 12, color: 'rgba(251,146,60,0.8)' },
  orbWrapper: { alignItems: 'center', justifyContent: 'center', width: 22, height: 22 },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  typeLabel: { fontSize: 11, color: 'rgba(255,170,60,0.85)' },

  // Thought
  thoughtScroll: {
    maxHeight: 160,
    marginBottom: 10,
  },
  thought: {
    fontFamily: 'CormorantGaramond_400Regular_Italic',
    fontSize: 24,
    color: '#ffffff',
    lineHeight: 32,
    textAlign: 'left',
  },

  // Attribution
  attribution: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  username: { fontSize: 15, color: 'rgba(251,146,60,0.7)', fontFamily: 'CormorantGaramond_500Medium_Italic' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  // Mute
  muteBtn: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  muteBtnActive: { backgroundColor: 'rgba(249,115,22,0.7)' },

  // Reactions
  reactionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  reactionPicker: {
    position: 'absolute',
    bottom: 42,
    left: 0,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#1e1e26',
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,140,50,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 100,
  },
  reactionPickerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2e2e35',
  },
  reactionPickerBtnActive: {
    backgroundColor: 'rgba(249,115,22,0.7)',
  },
  reactionPickerBtnHovered: {
    backgroundColor: 'rgba(249,115,22,0.5)',
  },
  reactionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#2e2e35',
    borderWidth: 1,
    borderColor: 'rgba(255,140,50,0.2)',
  },
  reactionBtnActive: {
    backgroundColor: 'rgba(249,115,22,0.7)',
    borderColor: '#fb923c',
  },
  reactionCount: { fontSize: 11, color: '#ffaa3c', fontWeight: '600' },

  // Fade
  fadeRow: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
  },
  fadeIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fadeDot: { width: 7, height: 7, borderRadius: 3.5 },
  fadeDotRed: { backgroundColor: '#f87171' },
  fadeDotOrange: { backgroundColor: '#fb923c' },
  fadeDotGreen: { backgroundColor: '#4ade80' },
  fadeText: { fontSize: 10 },
  fadeTextRed: { color: 'rgba(248,113,113,0.8)' },
  fadeTextOrange: { color: 'rgba(251,146,60,0.8)' },
  fadeTextGreen: { color: 'rgba(255,255,255,0.4)' },
  relightBtn: {
    fontSize: 10,
    color: '#ffaa3c',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
    backgroundColor: '#2e2e35',
    borderWidth: 1,
    borderColor: 'rgba(255,140,50,0.2)',
    overflow: 'hidden',
  },
  relightDone: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
    backgroundColor: '#2e2e35',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  relightDisabled: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
    backgroundColor: '#2e2e35',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },

  // Comments
  commentsSection: {
    marginBottom: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  commentsSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  commentsSectionTitle: { fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5 },
  commentsChevron: { fontSize: 9, color: 'rgba(255,255,255,0.3)' },
  commentsPlaceholder: { fontSize: 12, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' },
  commentsList: { maxHeight: 160, marginBottom: 10 },
  commentItem: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  commentAvatar: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,140,50,0.2)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
    overflow: 'hidden',
  },
  commentAvatarImg: { width: 26, height: 26, borderRadius: 13 },
  commentAvatarText: { fontSize: 11, color: '#ffaa3c', fontWeight: '700' },
  commentBody: { flex: 1 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  commentUsername: { fontSize: 12, color: '#ffaa3c', fontWeight: '600' },
  commentTime: { fontSize: 11, color: 'rgba(255,255,255,0.3)', flex: 1 },
  commentDelete: { fontSize: 10, color: 'rgba(255,255,255,0.2)' },
  commentContent: { fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 18 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentInput: {
    flex: 1,
    height: 34,
    backgroundColor: '#2e2e35',
    borderRadius: 17,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,140,50,0.15)',
  },
  commentSubmit: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 17,
    backgroundColor: 'rgba(249,115,22,0.7)',
  },
  commentSubmitDisabled: { backgroundColor: '#2e2e35' },
  commentSubmitText: { fontSize: 12, color: '#fff', fontWeight: '600' },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  footerMeta: { fontSize: 11, color: 'rgba(255,255,255,0.3)' },
  footerActions: { flexDirection: 'row', gap: 8 },
  footerBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Report modal
  reportCard: {
    width: '100%',
    backgroundColor: '#111114',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    gap: 12,
  },
  reportClose: { position: 'absolute', top: 16, right: 16, zIndex: 10 },
  reportTitle: { fontSize: 16, color: '#fff', fontWeight: '600', marginTop: 4 },
  reportSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 4 },
  reportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'transparent',
  },
  reportOptionActive: {
    borderColor: 'rgba(249,115,22,0.5)',
    backgroundColor: 'rgba(249,115,22,0.08)',
  },
  reportOptionEmoji: { fontSize: 18 },
  reportOptionLabel: { fontSize: 13, color: '#fff', fontWeight: '600', marginBottom: 2 },
  reportOptionDesc: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  reportRadio: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
  },
  reportRadioActive: {
    borderColor: '#f97316',
    backgroundColor: '#f97316',
  },
  reportSubmit: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  reportSubmitDisabled: { backgroundColor: '#2e2e35' },
  reportSubmitText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  reportFeedback: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  reportFeedbackIcon: { fontSize: 32 },
  reportFeedbackTitle: { fontSize: 15, color: '#fff', fontWeight: '600' },
  reportFeedbackSub: { fontSize: 13, color: 'rgba(255,255,255,0.45)' },
})
