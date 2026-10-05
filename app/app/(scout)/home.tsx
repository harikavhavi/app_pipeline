import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth.store';
import { useConnectionRequests } from '../../hooks/useConnectionRequests';
import { API_BASE } from '../../services/api';

export default function ScoutHome() {
  const router   = useRouter();
  const userName = useAuthStore(s => s.userName);
  const userId   = useAuthStore(s => s.userId);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const { count: pendingCount } = useConnectionRequests('scout', userId);

  useEffect(() => {
    fetch(`${API_BASE}/athletes`)
      .then(r => r.json())
      .then(data => { setAthletes(data.athletes ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Screen hasOrbs>
      <Topbar title="Scout Feed" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {pendingCount > 0 && (
          <TouchableOpacity style={styles.requestBanner} onPress={() => router.push('/(scout)/requests' as any)} activeOpacity={0.85}>
            <Ionicons name="notifications-outline" size={22} color={Colors.purple} />
            <View style={{ flex: 1 }}>
              <Text style={styles.requestBannerTitle}>
                {pendingCount} new connection request{pendingCount !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.requestBannerSub}>Tap to review and respond</Text>
            </View>
            <Text style={{ color: Colors.purple, fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        )}

        {/* Stats strip */}
        <View style={styles.statsStrip}>
          {[['Athletes', athletes.length], ['Viewed', 0], ['Shortlisted', 0]].map(([l, v]) => (
            <View key={String(l)} style={styles.stat}>
              <Text style={styles.statVal}>{v}</Text>
              <Text style={styles.statLabel}>{l}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Athletes in Database</Text>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.purple} />
            <Text style={styles.loadingText}>Loading…</Text>
          </View>
        )}

        {!loading && athletes.length === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="person-outline" size={44} color={Colors.t3} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No athletes yet</Text>
            <Text style={styles.emptySub}>Athletes appear here after they sign up and complete an analysis</Text>
            <TouchableOpacity style={[styles.browseBtn, { flexDirection: 'row', alignItems: 'center', gap: 6 }]} onPress={() => router.push('/(scout)/browse' as any)}>
              <Text style={styles.browseBtnText}>Browse</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {!loading && athletes.map(a => (
          <TouchableOpacity
            key={a.id}
            style={styles.athleteRow}
            onPress={() => router.push(`/(scout)/athlete/${a.id}` as any)}
          >
            <View style={styles.avatar}>
              <Text style={styles.initial}>{(a.name ?? 'A')[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.athleteName}>{a.name ?? '—'}</Text>
              <Text style={styles.athleteMeta}>{(a.sport ?? '').replace(/_/g, ' ')} · {a.ipc_class ?? '—'}</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push(`/(scout)/athlete-log/${a.id}` as any)}
              style={{ padding: 6 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="document-text-outline" size={16} color={Colors.t3} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  statsStrip: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '800', color: Colors.purple, marginBottom: 2 },
  statLabel: { fontSize: 10, color: Colors.t3 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 12 },
  center: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { color: Colors.t3, fontSize: 12, marginTop: 10 },
  emptyCard: { alignItems: 'center', paddingVertical: 48, backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  emptyIcon: { fontSize: 44, marginBottom: 14 },
  emptyTitle: { color: Colors.t1, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptySub: { color: Colors.t3, fontSize: 12, textAlign: 'center', paddingHorizontal: 20, marginBottom: 18 },
  browseBtn: { backgroundColor: Colors.purple, borderRadius: 10, paddingHorizontal: 22, paddingVertical: 10 },
  browseBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  athleteRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.purple + '30', borderWidth: 1.5, borderColor: Colors.purple, alignItems: 'center', justifyContent: 'center' },
  initial: { color: Colors.purple, fontSize: 18, fontWeight: '800' },
  athleteName: { color: Colors.t1, fontSize: 14, fontWeight: '700' },
  athleteMeta: { color: Colors.t3, fontSize: 11, marginTop: 2 },
  requestBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.purple + '18',
    borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.purple + '40',
  },
  requestBannerIcon: { fontSize: 22 },
  requestBannerTitle: { color: '#fff', fontSize: 13, fontWeight: '700' },
  requestBannerSub: { color: Colors.t2, fontSize: 11, marginTop: 2 },
});
