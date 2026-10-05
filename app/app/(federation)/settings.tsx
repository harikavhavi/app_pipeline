import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth.store';
import { authService } from '../../services/auth.service';

export default function FederationSettings() {
  const router = useRouter();
  const userName = useAuthStore(s => s.userName);
  const logout = useAuthStore(s => s.logout);

  async function handleLogout() {
    await authService.logout();
    logout();
    router.replace('/(auth)/role-select');
  }

  return (
    <Screen hasOrbs>
      <Topbar title="Admin Settings" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.orgCard}>
          <Text style={styles.orgName}>{userName ?? 'Paralympic Committee of India'}</Text>
          <Text style={styles.orgType}>National Paralympic Committee</Text>
        </View>
        {[['Manage Scout Accounts', '5 active'], ['Notification Preferences', 'All enabled'], ['Data Export', 'CSV / PDF'], ['API Access', 'Production key active']].map(([l, v]) => (
          <TouchableOpacity key={l} style={styles.row}>
            <View><Text style={styles.label}>{l}</Text><Text style={styles.value}>{v}</Text></View>
            <Text style={{ color: Colors.t3, fontSize: 18 }}>›</Text>
          </TouchableOpacity>
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
  orgCard: { backgroundColor: Colors.orange + '15', borderRadius: 14, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: Colors.orange + '30' },
  orgName: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  orgType: { color: Colors.orange, fontSize: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  label: { color: '#fff', fontSize: 13, fontWeight: '600', marginBottom: 2 },
  value: { color: Colors.t2, fontSize: 11 },
  logoutBtn: { alignItems: 'center', paddingVertical: 16, marginTop: 12, borderRadius: 14, borderWidth: 1, borderColor: Colors.red + '40', backgroundColor: Colors.red + '10' },
  logoutText: { color: Colors.red, fontSize: 14, fontWeight: '700' },
});
