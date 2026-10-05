import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import { Colors } from '../../constants/colors';
import { API_BASE } from '../../services/api';

export default function GuestShowcase() {
  const router = useRouter();
  const [views, setViews] = useState(0);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/athletes`)
      .then(r => r.json())
      .then(data => { setAthletes(data.athletes ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const publicAthletes = athletes.filter(a => a.discoverable !== false);

  function handleView(id: string) {
    const newViews = views + 1;
    setViews(newViews);
    if (newViews >= 5) { router.push('/(guest)/signup-wall'); return; }
    router.push(`/(guest)/athlete/${id}` as any);
  }

  return (
    <Screen>
      <Topbar title="Athlete Showcase" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Publicly opted-in athletes · {views}/5 profiles viewed</Text>
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.cyan} size="large" />
          </View>
        )}
        {!loading && publicAthletes.length === 0 && (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No athletes yet — check back once athletes complete an analysis</Text>
          </View>
        )}
        {!loading && publicAthletes.map(a => (
          <TouchableOpacity key={a.id} style={styles.card} onPress={() => handleView(a.id)} activeOpacity={0.8}>
            <View style={styles.avatar}><Text style={styles.monogram}>{(a.name ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2)}</Text></View>
            <View style={styles.info}>
              <Text style={styles.name}>{a.name}</Text>
              <Text style={styles.meta}>{(a.sport ?? '').replace(/_/g, ' ')} · {a.ipc_class ?? '—'}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  subtitle: { color: Colors.t2, fontSize: 12, marginBottom: 16 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.t3 + '30', alignItems: 'center', justifyContent: 'center' },
  monogram: { color: Colors.t2, fontWeight: '800' },
  info: { flex: 1 },
  name: { color: '#fff', fontSize: 13, fontWeight: '600' },
  meta: { color: Colors.t2, fontSize: 11 },
  score: { color: Colors.t3, fontSize: 10, marginTop: 2 },
  arrow: { color: Colors.t2, fontSize: 20 },
  center: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { color: Colors.t3, fontSize: 13, textAlign: 'center', paddingHorizontal: 24 },
});
