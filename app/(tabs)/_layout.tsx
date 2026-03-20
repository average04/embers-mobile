import { Tabs } from 'expo-router'

// Placeholder tab layout — replaced wholesale in Task 13
export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="map" options={{ title: 'Map' }} />
    </Tabs>
  )
}
