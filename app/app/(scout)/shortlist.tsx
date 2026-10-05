/**
 * /(scout)/shortlist.tsx
 * Scout's shortlisted / selected athletes with log access and notes.
 */
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth.store';
import { API_BASE } from '../../services/api';
import { DUMMY_ATHLETES, sportLabel, scoreColor } from '../../data/dummy.data';

export default function Shortlist() {
  const router  = useRouter();
  const userId  = useAuthStore(s => s.userId);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/athletes`)
      .then(r => r.json())
      .then(data => {
        const list = data.athletes ?? [];
        setAthletes(list.length > 0 ? list : DUMMY_ATHLETES);
        setLoading(false);
      })
      .catch(() => { setAthletes(DUMMY_ATHLETES); setLoading(false); });
  }, []);

  return (
    <Screen>
      <Topbar title="My Shortlist" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {loading && <View style={styles.center}><ActivityIndicator color={Colors.purple} /></View>}

        {!loading && athletes.length === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="clipboard-outline" size={44} color={Colors.t3} />
            <Text style={styles.emptyTitle}>No shortlisted athletes</Text>
            <Text style={styles.emptySub}>Browse athletes and add them to your shortlist for quick access</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(scout)/browse' as any)}>
              <Text style={styles.browseBtnText}>Browse Athletes</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {!loading && athletes.length > 0 && (
          <>
            <Text style={styles.sectionMeta}>
              {athletes.length} athlete{athletes.length > 1 ? 's' : ''} shortlisted · tap to view profile
            </Text>
            {athletes.map(a => (
              <View key={a.id} style={styles.athleteRow}>
                <TouchableOpacity style={styles.athleteMain} onPress={() => router.push(`/(scout)/athlete/${a.id}` as any)} activeOpacity={0.85}>
                  <View style={styles.avatar}>
                    <Text style={styles.initial}>{(a.name ?? 'A')[0].toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.athleteName}>{a.name ?? '—'}</Text>
                    <Text style={styles.athleteMeta}>{sportLabel(a.sport ?? '')} · {a.ipc_class ?? '—'} · {a.state ?? ''}</Text>
                  </View>
                  {a.latestScore != null && (
                    <Text style={{ fontSize: 18, fontWeight: '800', color: scoreColor(a.latestScore), marginRight: 8 }}>
                      {a.latestScore}
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.logBtn}
                  onPress={() => router.push(`/(scout)/athlete-log/${a.id}` as any)}
                >
                  <Ionicons name="document-text-outline" size={16} color={Colors.purple} />
                  <Text style={styles.logBtnText}>Log</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  center: { alignItems: 'center', paddingVertical: 60 },
  sectionMeta: { color: Colors.t3, fontSize: 11, marginBottom: 12 },

  athleteRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: 12,
    padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, gap: 8,
  },
  athleteMain: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.purple + '25', borderWidth: 1, borderColor: Colors.purple, alignItems: 'center', justifyContent: 'center' },
  initial: { color: Colors.purple, fontSize: 16, fontWeight: '800' },
  athleteName: { color: Colors.t1, fontSize: 13, fontWeight: '700' },
  athleteMeta: { color: Colors.t3, fontSize: 11, marginTop: 2 },
  logBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.purple + '15', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: Colors.purple + '40' },
  logBtnText: { color: Colors.purple, fontSize: 10, fontWeight: '700' },

  emptyCard: { alignItems: 'center', paddingVertical: 60, backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, gap: 8 },
  emptyTitle: { color: Colors.t1, fontSize: 16, fontWeight: '700', marginTop: 6 },
  emptySub:   { color: Colors.t3, fontSize: 12, textAlign: 'center', paddingHorizontal: 20 },
  browseBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.purple, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8 },
  browseBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});
