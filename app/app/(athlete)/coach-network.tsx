import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth.store';
import { athleteService } from '../../services/athlete.service';
import { Coach } from '../../types';

export default function CoachNetwork() {
  const router = useRouter();
  const userId = useAuthStore(s => s.userId);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [connected, setConnected] = useState<string[]>([]);

  useEffect(() => {
    athleteService.getCoaches().then(setCoaches);
    if (userId) {
      athleteService.getMyCoaches(userId).then(mine => setConnected(mine.map(c => c.id)));
    }
  }, [userId]);

  async function handleConnect(coachId: string) {
    if (!userId) return;
    const ok = await athleteService.connectCoach(userId, coachId);
    if (ok) setConnected(c => c.includes(coachId) ? c : [...c, coachId]);
  }

  return (
    <Screen hasOrbs>
      <Topbar title="Coach Network" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Coaches</Text>
        {coaches.length === 0 && <Text style={styles.emptyText}>No coaches registered yet.</Text>}
        {coaches.map(c => {
          const isConnected = connected.includes(c.id);
          return (
            <View key={c.id} style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.monogram}>{c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{c.name}</Text>
                <Text style={styles.meta}>{c.federation || 'Independent'}</Text>
                <Text style={styles.meta2}>{c.sport ? c.sport.replace(/_/g, ' ') : 'Sport not specified'}{c.experience ? ` · ${c.experience}` : ''}</Text>
              </View>
              <TouchableOpacity
                style={[styles.btn, isConnected && styles.btnConnected]}
                onPress={() => handleConnect(c.id)}
                disabled={isConnected}
              >
                <Text style={[styles.btnText, isConnected && { color: Colors.t2 }]}>
                  {isConnected ? 'Connected' : 'Connect'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 12 },
  emptyText: { color: Colors.t3, fontSize: 13, marginBottom: 8 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 14,
    padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, gap: 12,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.blue + '30',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.blue + '50',
  },
  monogram: { color: Colors.blue, fontSize: 15, fontWeight: '800' },
  info: { flex: 1 },
  name: { color: '#fff', fontSize: 13, fontWeight: '700' },
  meta: { color: Colors.t2, fontSize: 11, marginTop: 1 },
  meta2: { color: Colors.t3, fontSize: 10, marginTop: 2 },
  btn: {
    backgroundColor: Colors.blue + '20', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.blue + '50',
  },
  btnConnected: { backgroundColor: Colors.card2, borderColor: Colors.border },
  btnText: { color: Colors.blue, fontSize: 12, fontWeight: '700' },
});
