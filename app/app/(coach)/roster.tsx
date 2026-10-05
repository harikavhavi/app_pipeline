import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import { Colors } from '../../constants/colors';
import { API_BASE } from '../../services/api';

export default function Roster() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [athletes, setAthletes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/athletes`)
      .then(r => r.json())
      .then(data => { setAthletes(data.athletes ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = athletes.filter(a => (a.name ?? '').toLowerCase().includes(search.toLowerCase()));

  return (
    <Screen>
      <Topbar title="My Roster" />
      <View style={styles.searchWrap}>
        <TextInput style={styles.search} value={search} onChangeText={setSearch} placeholder="Search athletes..." placeholderTextColor={Colors.t3} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.blue} size="large" />
          </View>
        )}
        {!loading && filtered.length === 0 && (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No athletes yet — they'll appear here once they complete an analysis</Text>
          </View>
        )}
        {!loading && filtered.map(a => (
          <TouchableOpacity key={a.id} style={styles.row} onPress={() => router.push(`/(coach)/athlete/${a.id}` as any)} activeOpacity={0.8}>
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
  searchWrap: { paddingHorizontal: 20, paddingVertical: 10 },
  search: { backgroundColor: Colors.card, borderRadius: 12, padding: 12, color: '#fff', borderWidth: 1, borderColor: Colors.border, fontSize: 13 },
  scroll: { padding: 20, paddingTop: 8, paddingBottom: 48 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.blue + '25', alignItems: 'center', justifyContent: 'center' },
  monogram: { color: Colors.blue, fontWeight: '800', fontSize: 15 },
  info: { flex: 1 },
  name: { color: '#fff', fontSize: 13, fontWeight: '600' },
  meta: { color: Colors.t2, fontSize: 11 },
  score: { color: Colors.t3, fontSize: 10, marginTop: 2 },
  arrow: { color: Colors.t2, fontSize: 20 },
  center: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { color: Colors.t3, fontSize: 13, textAlign: 'center', paddingHorizontal: 24 },
});
