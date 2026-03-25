import React from 'react'
import { Tabs } from 'expo-router'
import { BottomTabBar } from '@/components/navigation/BottomTabBar'

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="map" />
      <Tabs.Screen name="feed" />
      <Tabs.Screen name="boards" />
      <Tabs.Screen name="notifications" />
      <Tabs.Screen name="profile" />
    </Tabs>
  )
}
