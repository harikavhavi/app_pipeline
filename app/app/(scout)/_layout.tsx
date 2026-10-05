import React from 'react';
import { Tabs } from 'expo-router';
import { Colors } from '../../constants/colors';
import { TabBarIcon } from '../../components/ui/TabBarIcon';
import { useAuthStore } from '../../store/auth.store';
import { useConnectionRequests } from '../../hooks/useConnectionRequests';

export default function ScoutLayout() {
  const userId = useAuthStore(s => s.userId);
  const { count: pendingCount } = useConnectionRequests('scout', userId);

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: Colors.bg1, borderTopColor: Colors.border, height: 60, paddingBottom: 8 }, tabBarActiveTintColor: Colors.purple, tabBarInactiveTintColor: Colors.t3, tabBarLabelStyle: { fontSize: 10, fontWeight: '600' } }}>
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color, focused }) => <TabBarIcon name="home" focused={focused} color={color} /> }} />
      <Tabs.Screen name="browse" options={{ title: 'Browse', tabBarIcon: ({ color, focused }) => <TabBarIcon name="search" focused={focused} color={color} /> }} />
      <Tabs.Screen name="shortlist" options={{ title: 'Shortlist', tabBarIcon: ({ color, focused }) => <TabBarIcon name="star" focused={focused} color={color} /> }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages', tabBarIcon: ({ color, focused }) => <TabBarIcon name="chatbubble" focused={focused} color={color} /> }} />
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
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="requests" options={{ href: null }} />
      <Tabs.Screen name="chat" options={{ href: null }} />
      {/* ── New feature screens ── */}
      <Tabs.Screen name="athlete-log/[id]" options={{ href: null }} />
    </Tabs>
  );
}

