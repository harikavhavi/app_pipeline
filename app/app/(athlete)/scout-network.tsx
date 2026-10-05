import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import ScoutCard from '../../components/ui/ScoutCard';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth.store';
import { scoutService } from '../../services/scout.service';
import { Scout } from '../../types';

export default function ScoutNetwork() {
  const router = useRouter();
  const userId = useAuthStore(s => s.userId);
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [status, setStatus] = useState<Record<string, Scout['status']>>({});

  function loadConnections() {
    if (!userId) return;
    scoutService.getMyScouts(userId).then(mine => {
      const map: Record<string, Scout['status']> = {};
      mine.forEach(s => { map[s.id] = s.status; });
      setStatus(map);
    });
  }

  useEffect(() => {
    scoutService.getScouts().then(setScouts);
    loadConnections();
  }, [userId]);

  async function handleConnect(scoutId: string) {
    if (!userId) return;
    const ok = await scoutService.connect(userId, scoutId);
    if (ok) setStatus(s => ({ ...s, [scoutId]: 'pending' }));
  }

  function openChat(scout: Scout) {
    router.push({ pathname: '/(athlete)/chat', params: { type: 'scout', id: scout.id, name: scout.name } });
  }

  const connectedCount = Object.values(status).filter(s => s === 'accepted').length;
  const pendingCount = Object.values(status).filter(s => s === 'pending').length;

  return (
    <Screen hasOrbs>
      <Topbar title="Scout Network" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.statsStrip}>
          {[['Scouts Viewing', scouts.length], ['Connected', connectedCount], ['Open Requests', pendingCount]].map(([l, v]) => (
            <View key={String(l)} style={styles.stat}>
              <Text style={styles.statVal}>{v}</Text>
              <Text style={styles.statLabel}>{l}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.sectionTitle}>Scouts Near You</Text>
        {scouts.length === 0 ? (
          <Text style={styles.emptyText}>No scouts nearby yet.</Text>
        ) : (
          scouts.map(s => (
            <ScoutCard
              key={s.id}
              scout={{ ...s, status: status[s.id] }}
              onConnect={() => handleConnect(s.id)}
              onMessage={() => openChat(s)}
            />
          ))
        )}
        <View style={styles.verifiedBox}>
          <Text style={styles.verifiedTitle}>✓ Your profile is verified</Text>
          <Text style={styles.verifiedBody}>Scouts can view your biomechanics data when you are discoverable.</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  statsStrip: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '800', color: Colors.cyan },
  statLabel: { fontSize: 10, color: Colors.t3, marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 12 },
  emptyText: { color: Colors.t3, fontSize: 13, marginBottom: 8 },
  verifiedBox: { backgroundColor: Colors.green + '15', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.green + '40', marginTop: 8 },
  verifiedTitle: { color: Colors.green, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  verifiedBody: { color: Colors.t2, fontSize: 12, lineHeight: 18 },
});
