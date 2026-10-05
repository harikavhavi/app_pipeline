import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth.store';
import { coachService } from '../../services/coach.service';
import { Athlete } from '../../types';

export default function CoachMessages() {
  const router = useRouter();
  const userId = useAuthStore(s => s.userId);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    coachService.getConnectedAthletes(userId).then(data => {
      setAthletes(data);
      setLoading(false);
    });
  }, [userId]);

  return (
    <Screen>
      <Topbar title="Messages" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.center}><ActivityIndicator color={Colors.blue} /></View>
        )}
        {!loading && athletes.length === 0 && (
          <Text style={styles.emptyText}>No conversations yet — accept a connection request to start chatting.</Text>
        )}
        {athletes.map((a: any) => (
          <TouchableOpacity
            key={a.id}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/(coach)/chat', params: { athleteId: a.id, athleteName: a.name } })}
          >
            <View style={styles.avatar}><Text style={styles.monogram}>{(a.name ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2)}</Text></View>
            <View style={styles.info}>
              <Text style={styles.name}>{a.name}</Text>
              <Text style={styles.last} numberOfLines={1}>{(a.sport ?? '').replace(/_/g, ' ')} · {a.ipc_class ?? '—'}</Text>
            </View>
            <Text style={{ color: Colors.t3, fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  center: { alignItems: 'center', paddingVertical: 40 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.blue + '20', alignItems: 'center', justifyContent: 'center' },
  monogram: { color: Colors.blue, fontWeight: '800' },
  info: { flex: 1 },
  name: { color: '#fff', fontSize: 13, fontWeight: '600' },
  last: { color: Colors.t2, fontSize: 12, marginTop: 2 },
  emptyText: { color: Colors.t3, fontSize: 13, textAlign: 'center', marginTop: 40, paddingHorizontal: 20 },
});
