import React from 'react'
import { Text } from 'react-native'

interface IconProps { color: string; size: number }

export const MapIcon = ({ color }: IconProps) => <Text style={{ fontSize: 20, color }}>🗺️</Text>
export const FeedIcon = ({ color }: IconProps) => <Text style={{ fontSize: 20, color }}>📰</Text>
export const BellIcon = ({ color }: IconProps) => <Text style={{ fontSize: 20, color }}>🔔</Text>
export const UserIcon = ({ color }: IconProps) => <Text style={{ fontSize: 20, color }}>👤</Text>
