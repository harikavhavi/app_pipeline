import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth.store';
import { authService } from '../../services/auth.service';
import { useConnectionRequests } from '../../hooks/useConnectionRequests';

export default function CoachProfile() {
  const router = useRouter();
  const userName = useAuthStore(s => s.userName);
  const user = useAuthStore(s => s.user);
  const userId = useAuthStore(s => s.userId);
  const logout = useAuthStore(s => s.logout);
  const { count: pendingCount } = useConnectionRequests('coach', userId);

  async function handleLogout() {
    await authService.logout();
    logout();
    router.replace('/(auth)/role-select');
  }

  return (
    <Screen hasOrbs>
      <Topbar title="Coach Profile" right={<TouchableOpacity><Text style={{ color: Colors.blue, fontSize: 13 }}>Edit</Text></TouchableOpacity>} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}><Text style={styles.monogram}>{(userName ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}</Text></View>
          <Text style={styles.name}>{userName ?? 'Coach'}</Text>
          <Text style={styles.meta}>{user?.federation || 'Federation not specified'}</Text>
        </View>

        <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/(coach)/requests' as any)}>
          <Text style={styles.linkLabel}>Connection Requests</Text>
          <View style={styles.linkRight}>
            {pendingCount > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{pendingCount}</Text></View>
            )}
            <Text style={styles.linkArrow}>›</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/(coach)/messages' as any)}>
          <Text style={styles.linkLabel}>Messages</Text>
          <Text style={styles.linkArrow}>›</Text>
        </TouchableOpacity>

        {[
          ['Sport Specialization', user?.sport ? String(user.sport).replace(/_/g, ' ') : 'Not specified'],
          ['Experience', user?.experience || 'Not specified'],
          ['Certification', user?.certification || 'Not specified'],
          ['Federation', user?.federation || 'Not specified'],
        ].map(([l, v]) => (
          <View key={l} style={styles.row}><Text style={styles.label}>{l}</Text><Text style={styles.value}>{v}</Text></View>
        ))}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  avatarWrap: { alignItems: 'center', marginBottom: 28 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.blue + '25', borderWidth: 2, borderColor: Colors.blue, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  monogram: { color: Colors.blue, fontSize: 26, fontWeight: '900' },
  name: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  meta: { color: Colors.t2, fontSize: 13 },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.card, borderRadius: 10, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  linkLabel: { color: '#fff', fontSize: 13, fontWeight: '600' },
  linkRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  linkArrow: { color: Colors.t3, fontSize: 16 },
  badge: { backgroundColor: Colors.red, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  row: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.card, borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  label: { color: Colors.t2, fontSize: 13 },
  value: { color: '#fff', fontSize: 13, fontWeight: '600' },
  logoutBtn: { alignItems: 'center', paddingVertical: 16, marginTop: 12, borderRadius: 14, borderWidth: 1, borderColor: Colors.red + '40', backgroundColor: Colors.red + '10' },
  logoutText: { color: Colors.red, fontSize: 14, fontWeight: '700' },
});
