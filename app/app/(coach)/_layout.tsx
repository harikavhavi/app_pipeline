import React from 'react';
import { Tabs } from 'expo-router';
import { Colors } from '../../constants/colors';
import { TabBarIcon } from '../../components/ui/TabBarIcon';
import { useAuthStore } from '../../store/auth.store';
import { useConnectionRequests } from '../../hooks/useConnectionRequests';

export default function CoachLayout() {
  const userId = useAuthStore(s => s.userId);
  const { count: pendingCount } = useConnectionRequests('coach', userId);

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: Colors.bg1, borderTopColor: Colors.border, height: 60, paddingBottom: 8 }, tabBarActiveTintColor: Colors.blue, tabBarInactiveTintColor: Colors.t3, tabBarLabelStyle: { fontSize: 10, fontWeight: '600' } }}>
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color, focused }) => <TabBarIcon name="home" focused={focused} color={color} /> }} />
      <Tabs.Screen name="roster" options={{ title: 'Roster', tabBarIcon: ({ color, focused }) => <TabBarIcon name="people" focused={focused} color={color} /> }} />
      <Tabs.Screen name="upload" options={{ title: 'Upload', tabBarIcon: ({ color, focused }) => <TabBarIcon name="videocam" focused={focused} color={color} /> }} />
      <Tabs.Screen name="analytics" options={{ title: 'Analytics', tabBarIcon: ({ color, focused }) => <TabBarIcon name="stats-chart" focused={focused} color={color} /> }} />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="person" focused={focused} color={color} />,
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
        }}
      />
      <Tabs.Screen name="athlete/[id]" options={{ href: null }} />
      <Tabs.Screen name="session/[id]" options={{ href: null }} />
      <Tabs.Screen name="compare" options={{ href: null }} />
      <Tabs.Screen name="drills" options={{ href: null }} />
      <Tabs.Screen name="scout-inbox" options={{ href: null }} />
      <Tabs.Screen name="events" options={{ href: null }} />
      <Tabs.Screen name="requests" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="chat" options={{ href: null }} />
      {/* ── New feature screens ── */}
      <Tabs.Screen name="video-sessions" options={{ href: null }} />
      <Tabs.Screen name="athlete-log/[id]" options={{ href: null }} />
    </Tabs>
  );
}

