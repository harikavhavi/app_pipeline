import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import FilterBar from '../../components/ui/FilterBar';
import { Colors } from '../../constants/colors';
import { SPORTS } from '../../constants/sports';
import { athleteService } from '../../services/athlete.service';
import { API_BASE } from '../../services/api';

const SORT_OPTIONS = ['Best Score', 'Recent', 'Name A–Z', 'Verified'];

export default function Browse() {
  const router = useRouter();
  const [search,   setSearch]   = useState('');
  const [sport,    setSport]    = useState('All Sports');
  const [sort,     setSort]     = useState('Best Score');
  const [athletes, setAthletes] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    // Fetch all athletes from the pipeline DB
    fetch(`${API_BASE}/athletes`)
      .then(r => r.json())
      .then(data => { setAthletes(data.athletes ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = athletes.filter(a =>
    (a.name ?? '').toLowerCase().includes(search.toLowerCase()) &&
    (sport === 'All Sports' || a.sport === sport)
  );

  return (
    <Screen>
      <Topbar title="Browse Athletes" />
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Search athlete name..."
          placeholderTextColor={Colors.t3}
        />
      </View>
      <FilterBar filters={['All Sports', ...SPORTS.slice(0, 4)]} active={sport} onSelect={setSport} accent={Colors.purple} />
      <FilterBar filters={SORT_OPTIONS} active={sort} onSelect={setSort} accent={Colors.purple} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.purple} size="large" />
            <Text style={styles.loadingText}>Loading athletes…</Text>
          </View>
        )}
        {!loading && (
          <Text style={styles.count}>{filtered.length} athlete{filtered.length !== 1 ? 's' : ''} found</Text>
        )}
        {!loading && filtered.length === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="search-outline" size={44} color={Colors.t3} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No athletes yet</Text>
            <Text style={styles.emptySub}>Athletes appear here after they complete an analysis session</Text>
          </View>
        )}
        {!loading && filtered.map(a => (
          <TouchableOpacity key={a.id} style={styles.athleteRow} onPress={() => router.push(`/(scout)/athlete/${a.id}` as any)}>
            <View style={styles.athleteAvatar}>
              <Text style={styles.athleteInitial}>{(a.name ?? 'A')[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.athleteName}>{a.name ?? '—'}</Text>
              <Text style={styles.athleteMeta}>{(a.sport ?? '').replace(/_/g, ' ')} · {a.ipc_class ?? '—'}</Text>
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
  scroll: { padding: 20, paddingTop: 10, paddingBottom: 48 },
  count: { color: Colors.t2, fontSize: 12, marginBottom: 12 },
  center: { alignItems: 'center', paddingVertical: 60 },
  loadingText: { color: Colors.t3, fontSize: 13, marginTop: 12 },
  emptyCard: { alignItems: 'center', paddingVertical: 48, backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  emptyIcon: { fontSize: 44, marginBottom: 14 },
  emptyTitle: { color: Colors.t1, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptySub: { color: Colors.t3, fontSize: 12, textAlign: 'center', paddingHorizontal: 20 },
  athleteRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  athleteAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.purple + '30', borderWidth: 1.5, borderColor: Colors.purple, alignItems: 'center', justifyContent: 'center' },
  athleteInitial: { color: Colors.purple, fontSize: 18, fontWeight: '800' },
  athleteName: { color: Colors.t1, fontSize: 14, fontWeight: '700' },
  athleteMeta: { color: Colors.t3, fontSize: 11, marginTop: 2 },
  arrow: { color: Colors.t3, fontSize: 20 },
});
