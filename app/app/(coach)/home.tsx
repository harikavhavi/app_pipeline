import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import { Colors } from '../../constants/colors';
import { API_BASE } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import { useConnectionRequests } from '../../hooks/useConnectionRequests';
import { DUMMY_ROSTER, DUMMY_VIDEO_SESSIONS, DUMMY_TRAINING, sportLabel } from '../../data/dummy.data';

export default function CoachHome() {
  const router = useRouter();
  const userId = useAuthStore(s => s.userId);
  const userName = useAuthStore(s => s.userName);
  const [athletes, setAthletes] = useState<any[]>([]);
  const { count: pendingCount } = useConnectionRequests('coach', userId);

  useEffect(() => {
    fetch(`${API_BASE}/athletes`)
      .then(r => r.json())
      .then(data => setAthletes(data.athletes?.length > 0 ? data.athletes : DUMMY_ROSTER))
      .catch(() => setAthletes(DUMMY_ROSTER));
  }, []);

  const topAthletes = athletes.slice(0, 5);
  const avgScore = Math.round(athletes.reduce((s, a) => s + (a.latestScore ?? 0), 0) / (athletes.length || 1));

  return (
    <Screen hasOrbs>
      <Topbar title="Coach Dashboard" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {pendingCount > 0 && (
          <TouchableOpacity style={styles.requestBanner} onPress={() => router.push('/(coach)/requests' as any)} activeOpacity={0.85}>
            <Ionicons name="notifications-outline" size={22} color={Colors.blue} />
            <View style={{ flex: 1 }}>
              <Text style={styles.requestBannerTitle}>
                {pendingCount} new connection request{pendingCount !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.requestBannerSub}>Tap to review and respond</Text>
            </View>
            <Text style={{ color: Colors.blue, fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        )}

        {/* Quick actions */}
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/(coach)/video-sessions' as any)} activeOpacity={0.85}>
            <Ionicons name="videocam" size={20} color={Colors.blue} />
            <Text style={styles.quickLabel}>Video Sessions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/(coach)/roster' as any)} activeOpacity={0.85}>
            <Ionicons name="people" size={20} color={Colors.cyan} />
            <Text style={styles.quickLabel}>Roster</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/(coach)/analytics' as any)} activeOpacity={0.85}>
            <Ionicons name="stats-chart" size={20} color={Colors.purple} />
            <Text style={styles.quickLabel}>Analytics</Text>
          </TouchableOpacity>
        </View>

        {/* Group stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{athletes.length || DUMMY_ROSTER.length}</Text>
            <Text style={styles.statLabel}>Athletes</Text>
          </View>
          <View style={[styles.statBox, { borderLeftWidth: 1, borderLeftColor: Colors.border }]}>
            <Text style={[styles.statVal, { color: Colors.cyan }]}>{avgScore || 81}</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
          <View style={[styles.statBox, { borderLeftWidth: 1, borderLeftColor: Colors.border }]}>
            <Text style={[styles.statVal, { color: Colors.green }]}>
              {athletes.reduce((s, a) => s + (a.sessionCount ?? 0), 0) || 49}
            </Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={[styles.statBox, { borderLeftWidth: 1, borderLeftColor: Colors.border }]}>
            <Text style={[styles.statVal, { color: Colors.orange }]}>
              {DUMMY_VIDEO_SESSIONS.filter(v => v.status === 'pending' || v.status === 'accepted').length}
            </Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
        </View>

        {/* Upcoming sessions */}
        <Text style={styles.sectionTitle}>Upcoming Video Sessions</Text>
        {DUMMY_VIDEO_SESSIONS.filter(v => v.status !== 'completed').map(vs => (
          <TouchableOpacity
            key={vs.id}
            style={[styles.athleteRow, { marginBottom: 8 }]}
            onPress={() => router.push('/(coach)/video-sessions' as any)}
          >
            <View style={[styles.avatar, { backgroundColor: Colors.blue + '20', borderColor: Colors.blue + '40' }]}>
              <Ionicons name="videocam" size={16} color={Colors.blue} />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{vs.title}</Text>
              <Text style={styles.meta}>{new Date(vs.scheduledAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · {vs.status}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.t3} />
          </TouchableOpacity>
        ))}

        {topAthletes.length === 0 && <Text style={styles.emptyText}>No athletes on your roster yet — they'll appear here once they complete an analysis.</Text>}
        {topAthletes.map(a => (
          <TouchableOpacity key={a.id} style={styles.athleteRow} onPress={() => router.push(`/(coach)/athlete/${a.id}` as any)}>
            <View style={styles.avatar}><Text style={styles.monogram}>{(a.name ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2)}</Text></View>
            <View style={styles.info}>
              <Text style={styles.name}>{a.name}</Text>
              <Text style={styles.meta}>{(a.sport ?? '').replace(/_/g, ' ')} · {a.ipc_class ?? '—'}</Text>
            </View>
            <TouchableOpacity
              style={styles.logBtn}
              onPress={() => router.push(`/(coach)/athlete-log/${a.id}` as any)}
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
  statsRow: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '800', color: Colors.blue },
  statLabel: { fontSize: 10, color: Colors.t3, marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 12 },
  athleteRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.blue + '25', alignItems: 'center', justifyContent: 'center' },
  monogram: { color: Colors.blue, fontWeight: '800' },
  info: { flex: 1 },
  name: { color: '#fff', fontSize: 13, fontWeight: '600' },
  meta: { color: Colors.t2, fontSize: 11 },
  emptyText: { color: Colors.t3, fontSize: 13, marginBottom: 8 },
  requestBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.blue + '18',
    borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.blue + '40',
  },
  requestBannerIcon: { fontSize: 22 },
  requestBannerTitle: { color: '#fff', fontSize: 13, fontWeight: '700' },
  requestBannerSub: { color: Colors.t2, fontSize: 11, marginTop: 2 },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  quickCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 12, alignItems: 'center', gap: 6 },
  quickLabel: { color: Colors.t2, fontSize: 10, fontWeight: '600', textAlign: 'center' },
  logBtn: { padding: 4 },
});

