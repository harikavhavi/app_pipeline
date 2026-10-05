import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth.store';
import { scoutService } from '../../services/scout.service';
import { useConnectionRequests } from '../../hooks/useConnectionRequests';

export default function ScoutRequests() {
  const router = useRouter();
  const userId = useAuthStore(s => s.userId);
  const { requests, loading, refresh } = useConnectionRequests('scout', userId);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function respond(athleteId: string, status: 'accepted' | 'declined') {
    if (!userId) return;
    setBusyId(athleteId);
    await scoutService.respond(athleteId, userId, status);
    await refresh();
    setBusyId(null);
  }

  return (
    <Screen hasOrbs>
      <Topbar title="Connection Requests" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.purple} />
          </View>
        )}
        {!loading && requests.length === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="mail-open-outline" size={40} color={Colors.t3} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No pending requests</Text>
            <Text style={styles.emptySub}>Athletes who want to connect with you will show up here.</Text>
          </View>
        )}
        {requests.map(r => (
          <View key={r.id} style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.monogram}>{r.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{r.name}</Text>
              <Text style={styles.meta}>{(r.sport ?? '').replace(/_/g, ' ')} · {r.ipc_class ?? '—'}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.declineBtn}
                onPress={() => respond(r.id, 'declined')}
                disabled={busyId === r.id}
              >
                <Text style={styles.declineText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => respond(r.id, 'accepted')}
                disabled={busyId === r.id}
              >
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  center: { alignItems: 'center', paddingVertical: 40 },
  emptyCard: { alignItems: 'center', paddingVertical: 48, backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { color: Colors.t1, fontSize: 15, fontWeight: '700', marginBottom: 6 },
  emptySub: { color: Colors.t3, fontSize: 12, textAlign: 'center', paddingHorizontal: 24 },
  card: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.purple + '30', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.purple + '50' },
  monogram: { color: Colors.purple, fontSize: 15, fontWeight: '800' },
  info: { flex: 1 },
  name: { color: '#fff', fontSize: 13, fontWeight: '700' },
  meta: { color: Colors.t2, fontSize: 11, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  declineBtn: { backgroundColor: Colors.card2, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border },
  declineText: { color: Colors.t2, fontSize: 12, fontWeight: '700' },
  acceptBtn: { backgroundColor: Colors.green + '20', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: Colors.green + '50' },
  acceptText: { color: Colors.green, fontSize: 12, fontWeight: '700' },
});
