import React from 'react';
import { Tabs } from 'expo-router';
import { Colors } from '../../constants/colors';
import { TabBarIcon } from '../../components/ui/TabBarIcon';

export default function AthleteLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bg1,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: Colors.cyan,
        tabBarInactiveTintColor: Colors.t3,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color, focused }) => <TabBarIcon name="home" focused={focused} color={color} /> }} />
      <Tabs.Screen name="upload" options={{ title: 'Analyse', tabBarIcon: ({ color, focused }) => <TabBarIcon name="videocam" focused={focused} color={color} /> }} />
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', tabBarIcon: ({ color, focused }) => <TabBarIcon name="stats-chart" focused={focused} color={color} /> }} />
      <Tabs.Screen name="connect" options={{ title: 'Connect', tabBarIcon: ({ color, focused }) => <TabBarIcon name="link" focused={focused} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, focused }) => <TabBarIcon name="person" focused={focused} color={color} /> }} />
      {/* ── Hidden routes (accessible via router.push) ── */}
      <Tabs.Screen name="chat" options={{ href: null }} />
      <Tabs.Screen name="processing" options={{ href: null }} />
      <Tabs.Screen name="history" options={{ href: null }} />
      <Tabs.Screen name="videos" options={{ href: null }} />
      <Tabs.Screen name="scout-activity" options={{ href: null }} />
      <Tabs.Screen name="progress" options={{ href: null }} />
      <Tabs.Screen name="safety" options={{ href: null }} />
      <Tabs.Screen name="my-coach" options={{ href: null }} />
      <Tabs.Screen name="coach-network" options={{ href: null }} />
      <Tabs.Screen name="scout-network" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      {/* ── New feature screens ── */}
      <Tabs.Screen name="video-sessions" options={{ href: null }} />
      <Tabs.Screen name="smartwatch" options={{ href: null }} />
      <Tabs.Screen name="ai-chat" options={{ href: null }} />
    </Tabs>
  );
}

