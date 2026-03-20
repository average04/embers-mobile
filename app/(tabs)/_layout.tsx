import React from 'react'
import { Tabs } from 'expo-router'
import { MapIcon, FeedIcon, BellIcon, UserIcon } from '@/components/ui/TabIcons'
import { useNotifStore } from '@/store/notifStore'

export default function TabLayout() {
  const unreadCount = useNotifStore((s) => s.unreadCount)

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f1117',
          borderTopColor: '#1a1a2e',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#e94560',
        tabBarInactiveTintColor: '#4a5568',
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => <MapIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => <FeedIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color, size }) => <BellIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <UserIcon color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}
