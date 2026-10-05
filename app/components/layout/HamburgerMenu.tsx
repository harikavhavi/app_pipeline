/**
 * HamburgerMenu.tsx
 * Slide-in side drawer with role-aware navigation links.
 * Uses absolute positioning (not Modal) for full web + native compatibility.
 */
import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Animated, Pressable, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, RoleAccent } from '../../constants/colors';
import { useAuthStore } from '../../store/auth.store';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: string;
}

const ATHLETE_ITEMS: NavItem[] = [
  { label: 'Home',           icon: 'home-outline',          route: '/(athlete)/home' },
  { label: 'Analyse Video',  icon: 'videocam-outline',      route: '/(athlete)/upload' },
  { label: 'My Dashboard',   icon: 'stats-chart-outline',   route: '/(athlete)/dashboard' },
  { label: 'Video Sessions', icon: 'videocam',              route: '/(athlete)/video-sessions', badge: 'NEW' },
  { label: 'Health Monitor', icon: 'watch-outline',         route: '/(athlete)/smartwatch',     badge: 'NEW' },
  { label: 'ParaSync AI',    icon: 'sparkles-outline',      route: '/(athlete)/ai-chat',        badge: 'AI'  },
  { label: 'History',        icon: 'time-outline',          route: '/(athlete)/history' },
  { label: 'Connect',        icon: 'people-outline',        route: '/(athlete)/connect' },
  { label: 'Notifications',  icon: 'notifications-outline', route: '/(athlete)/notifications' },
  { label: 'Profile',        icon: 'person-outline',        route: '/(athlete)/profile' },
];

const COACH_ITEMS: NavItem[] = [
  { label: 'Dashboard',      icon: 'home-outline',          route: '/(coach)/home' },
  { label: 'My Athletes',    icon: 'people-outline',        route: '/(coach)/roster' },
  { label: 'Video Sessions', icon: 'videocam',              route: '/(coach)/video-sessions', badge: 'NEW' },
  { label: 'Analytics',      icon: 'stats-chart-outline',   route: '/(coach)/analytics' },
  { label: 'Training Plans', icon: 'barbell-outline',       route: '/(coach)/training' },
  { label: 'Messages',       icon: 'chatbubble-outline',    route: '/(coach)/messages' },
  { label: 'Requests',       icon: 'mail-outline',          route: '/(coach)/requests' },
  { label: 'Profile',        icon: 'person-outline',        route: '/(coach)/profile' },
];

const SCOUT_ITEMS: NavItem[] = [
  { label: 'Home',           icon: 'home-outline',          route: '/(scout)/home' },
  { label: 'Browse Athletes',icon: 'search-outline',        route: '/(scout)/browse' },
  { label: 'Shortlist',      icon: 'star-outline',          route: '/(scout)/shortlist' },
  { label: 'Discover',       icon: 'compass-outline',       route: '/(scout)/discover' },
  { label: 'Compare',        icon: 'git-compare-outline',   route: '/(scout)/compare' },
  { label: 'Messages',       icon: 'chatbubble-outline',    route: '/(scout)/messages' },
  { label: 'Requests',       icon: 'mail-outline',          route: '/(scout)/requests' },
  { label: 'Profile',        icon: 'person-outline',        route: '/(scout)/profile' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const HamburgerMenu: React.FC<Props> = ({ visible, onClose }) => {
  const router    = useRouter();
  const role      = useAuthStore(s => s.role);
  const userName  = useAuthStore(s => s.userName);
  const logout    = useAuthStore(s => s.logout);
  const slideAnim = useRef(new Animated.Value(-320)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  const accent = RoleAccent[role ?? 'athlete'] ?? Colors.cyan;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: visible ? 0 : -320,
        useNativeDriver: true,
        tension: 68,
        friction: 12,
      }),
      Animated.timing(fadeAnim, {
        toValue: visible ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  // Don't remove from DOM — keep mounted so the close animation plays
  // But use pointerEvents to block/allow touches
  const items =
    role === 'coach' ? COACH_ITEMS :
    role === 'scout' ? SCOUT_ITEMS :
    ATHLETE_ITEMS;

  function navigate(route: string) {
    onClose();
    setTimeout(() => router.push(route as any), 80);
  }

  function handleLogout() {
    onClose();
    logout();
    setTimeout(() => router.replace('/' as any), 120);
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* ── Backdrop ── */}
      <Animated.View
        style={[styles.backdrop, { opacity: fadeAnim }]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* ── Drawer panel ── */}
      <Animated.View
        style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}
        pointerEvents="auto"
      >
        {/* Header */}
        <View style={[styles.drawerHeader, { borderBottomColor: accent + '30' }]}>
          <View style={[styles.roleIcon, { backgroundColor: accent + '20', borderColor: accent + '40' }]}>
            <Ionicons
              name={(role === 'coach' ? 'fitness' : role === 'scout' ? 'search' : 'person') as any}
              size={20}
              color={accent}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName} numberOfLines={1}>
              {userName ?? 'ParaSync User'}
            </Text>
            <Text style={[styles.roleLabel, { color: accent }]}>
              {(role ?? 'athlete').charAt(0).toUpperCase() + (role ?? 'athlete').slice(1)}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={Colors.t2} />
          </TouchableOpacity>
        </View>

        {/* Nav items */}
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          <View style={styles.navSection}>
            {items.map(item => (
              <TouchableOpacity
                key={item.route}
                style={styles.navItem}
                onPress={() => navigate(item.route)}
                activeOpacity={0.7}
              >
                <View style={[styles.navIconWrap, { backgroundColor: accent + '12' }]}>
                  <Ionicons name={item.icon as any} size={18} color={accent} />
                </View>
                <Text style={styles.navLabel}>{item.label}</Text>
                {item.badge && (
                  <View style={[
                    styles.navBadge,
                    item.badge === 'AI'
                      ? { backgroundColor: Colors.cyan + '20', borderColor: Colors.cyan + '50' }
                      : { backgroundColor: accent + '20', borderColor: accent + '50' },
                  ]}>
                    <Text style={[
                      styles.navBadgeText,
                      { color: item.badge === 'AI' ? Colors.cyan : accent },
                    ]}>
                      {item.badge}
                    </Text>
                  </View>
                )}
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={Colors.t3}
                  style={{ marginLeft: 'auto' }}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Bottom actions */}
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigate(
              role === 'coach' ? '/(coach)/profile' :
              role === 'scout' ? '/(scout)/profile' :
              '/(athlete)/profile'
            )}
          >
            <View style={[styles.navIconWrap, { backgroundColor: Colors.t4 }]}>
              <Ionicons name="settings-outline" size={18} color={Colors.t2} />
            </View>
            <Text style={[styles.navLabel, { color: Colors.t2 }]}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={handleLogout}>
            <View style={[styles.navIconWrap, { backgroundColor: Colors.red + '15' }]}>
              <Ionicons name="log-out-outline" size={18} color={Colors.red} />
            </View>
            <Text style={[styles.navLabel, { color: Colors.red }]}>Sign Out</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Footer */}
        <View style={styles.drawerFooter}>
          <View style={[styles.footerDot, { backgroundColor: Colors.green }]} />
          <Text style={styles.footerText}>ParaSync 2.0  ·  All systems live</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const DRAWER_W = 300;

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  drawer: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: DRAWER_W,
    backgroundColor: Colors.bg2,
    borderRightWidth: 1,
    borderRightColor: Colors.border2,
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 54 : 32,
    paddingBottom: 18,
    borderBottomWidth: 1,
  },
  roleIcon: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  userName:  { color: '#fff', fontSize: 14, fontWeight: '700' },
  roleLabel: { fontSize: 11, fontWeight: '600', marginTop: 2, textTransform: 'capitalize' },
  closeBtn:  { padding: 6 },

  navSection: { paddingTop: 12, paddingHorizontal: 12 },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, paddingHorizontal: 10,
    borderRadius: 12, marginBottom: 2,
  },
  navIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  navLabel:     { color: Colors.t1, fontSize: 13, fontWeight: '600', flex: 1 },
  navBadge:     { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1 },
  navBadgeText: { fontSize: 9, fontWeight: '800' },

  divider: {
    height: 1, backgroundColor: Colors.border,
    marginVertical: 8, marginHorizontal: 20,
  },

  drawerFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  footerText: { color: Colors.t3, fontSize: 10 },
  footerDot:  { width: 5, height: 5, borderRadius: 3 },
});

export default HamburgerMenu;
