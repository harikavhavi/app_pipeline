import React from 'react';
import { Tabs } from 'expo-router';
import { Colors } from '../../constants/colors';
import { TabBarIcon } from '../../components/ui/TabBarIcon';

export default function FederationLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: Colors.bg1, borderTopColor: Colors.border, height: 60, paddingBottom: 8 }, tabBarActiveTintColor: Colors.orange, tabBarInactiveTintColor: Colors.t3, tabBarLabelStyle: { fontSize: 10, fontWeight: '600' } }}>
      <Tabs.Screen name="dashboard" options={{ title: 'Overview', tabBarIcon: ({ color, focused }) => <TabBarIcon name="stats-chart" focused={focused} color={color} /> }} />
      <Tabs.Screen name="registry" options={{ title: 'Registry', tabBarIcon: ({ color, focused }) => <TabBarIcon name="list" focused={focused} color={color} /> }} />
      <Tabs.Screen name="events" options={{ title: 'Events', tabBarIcon: ({ color, focused }) => <TabBarIcon name="calendar" focused={focused} color={color} /> }} />
      <Tabs.Screen name="analytics" options={{ title: 'Analytics', tabBarIcon: ({ color, focused }) => <TabBarIcon name="bar-chart" focused={focused} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Admin', tabBarIcon: ({ color, focused }) => <TabBarIcon name="settings" focused={focused} color={color} /> }} />
    </Tabs>
  );
}
