import React from 'react'
import { Drawer } from 'expo-router/drawer'
import { DrawerContent } from '@/components/navigation/DrawerContent'

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        overlayColor: 'rgba(0,0,0,0.5)',
        drawerStyle: {
          width: '65%',
          backgroundColor: '#080808',
        },
      }}
    >
      <Drawer.Screen name="map" />
      <Drawer.Screen name="feed" />
      <Drawer.Screen name="notifications" />
      <Drawer.Screen name="profile" />
    </Drawer>
  )
}
