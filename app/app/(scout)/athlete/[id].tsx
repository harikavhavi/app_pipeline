import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../../components/layout/Screen';
import Topbar from '../../../components/layout/Topbar';
import SafetyBadge from '../../../components/ui/SafetyBadge';
import SessionCard from '../../../components/ui/SessionCard';
import { Colors } from '../../../constants/colors';
import { useAuthStore } from '../../../store/auth.store';
import { scoutService } from '../../../services/scout.service';
import { API_BASE } from '../../../services/api';
import { ConnectionStatus } from '../../../types';

export default function ScoutAthleteDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scoutId = useAuthStore(s => s.userId);
  const [athlete,  setAthlete]  = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [status,   setStatus]   = useState<ConnectionStatus | undefined>(undefined);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/athletes/${id}`).then(r => r.json()).catch(() => null),
      fetch(`${API_BASE}/sessions/${id}`).then(r => r.json()).catch(() => ({ sessions: [] })),
    ]).then(([athleteData, sessData]) => {
      setAthlete(athleteData);
      setSessions(sessData?.sessions ?? []);
      setLoading(false);
    });
    // Fire-and-forget: counts toward this athlete's "Scout Views" stat.
    fetch(`${API_BASE}/athletes/${id}/view`, { method: 'POST' }).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!scoutId || !id) return;
    Promise.all([
      scoutService.getRequests(scoutId),
      scoutService.getConnectedAthletes(scoutId),
    ]).then(([pending, connected]) => {
      if (connected.some((a: any) => a.id === id)) setStatus('accepted');
      else if (pending.some(r => r.id === id)) setStatus('pending');
      else setStatus(undefined);
    });
  }, [scoutId, id]);

  function openChat() {
    router.push({ pathname: '/(scout)/chat', params: { athleteId: id, athleteName: athlete?.name } });
  }

  function openSession(sessionId: string) {
    router.push(`/(scout)/session/${sessionId}` as any);
  }

  if (loading) {
    return (
      <Screen>
        <Topbar title="Athlete Profile" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.purple} size="large" />
        </View>
      </Screen>
    );
  }

  if (!athlete) {
    return (
      <Screen>
        <Topbar title="Athlete Not Found" onBack={() => router.back()} />
        <View style={styles.center}>
          <Text style={styles.notFound}>Athlete not found in database</Text>
        </View>
      </Screen>
    );
  }

  const name     = athlete.name ?? 'Unknown';
  const initials = name.split(' ').map((w: string) => w[0] ?? '').join('').slice(0, 2).toUpperCase();

  return (
    <Screen>
      <Topbar title={name} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero card */}
        <View style={styles.hero}>
          <View style={styles.avatar}><Text style={styles.monogram}>{initials}</Text></View>
          <View style={styles.info}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.meta}>{(athlete.sport ?? '').replace(/_/g, ' ')} · {athlete.ipc_class ?? '—'}</Text>
            <SafetyBadge level="LOW" compact />
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.shortlistBtn, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }]}>
            <Ionicons name="star-outline" size={13} color={Colors.orange} />
            <Text style={styles.shortlistText}>Shortlist</Text>
          </TouchableOpacity>
          {status === 'accepted' ? (
            <TouchableOpacity style={[styles.messageBtn, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }]} onPress={openChat}>
              <Ionicons name="chatbubble-outline" size={13} color={Colors.green} />
              <Text style={styles.messageBtnText}>Message</Text>
            </TouchableOpacity>
          ) : status === 'pending' ? (
            <View style={[styles.pendingBtn, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }]}>
              <Ionicons name="time-outline" size={13} color={Colors.orange} />
              <Text style={styles.pendingBtnText}>Pending</Text>
            </View>
          ) : (
            <View style={styles.connectBtn}><Text style={styles.connectText}>Not Connected</Text></View>
          )}
          <TouchableOpacity style={[styles.reportBtn, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }]} onPress={() => router.push('/(scout)/reports')}>
            <Ionicons name="document-text-outline" size={13} color={Colors.t2} />
            <Text style={styles.reportText}>Report</Text>
          </TouchableOpacity>
        </View>

        {/* Session videos + metrics — gated behind an accepted connection */}
        <Text style={styles.sectionTitle}>
          {sessions.length > 0 ? `Sessions (${sessions.length})` : 'No Analysis Data Yet'}
        </Text>

        {status === 'accepted' ? (
          <>
            {sessions.map((s: any) => {
              const scored = (s.metric_cards ?? []).filter((c: any) => c.score != null);
              const avgScore = scored.length
                ? Math.round(scored.reduce((sum: number, c: any) => sum + c.score, 0) / scored.length)
                : 0;
              return (
                <SessionCard
                  key={s.id}
                  session={{
                    id: s.id,
                    date: s.date,
                    sport: (s.sport ?? '').replace(/_/g, ' '),
                    duration: s.video_metadata?.duration_sec
                      ? `${Math.floor(s.video_metadata.duration_sec / 60)}m ${Math.round(s.video_metadata.duration_sec % 60)}s`
                      : '—',
                    score: avgScore,
                    topMetric: s.video_metadata?.filename,
                  }}
                  onPress={() => openSession(s.id)}
                />
              );
            })}
            {sessions.length === 0 && (
              <View style={styles.noDataCard}>
                <Text style={styles.noDataText}>This athlete hasn't completed an analysis session yet</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.noDataCard}>
            <Ionicons name="lock-closed-outline" size={22} color={Colors.t3} />
            <Text style={[styles.noDataText, { marginTop: 8 }]}>
              Connect with this athlete to view their session videos and metrics
            </Text>
          </View>
        )}

        <View style={styles.joinBanner}>
          <Text style={styles.joinText}>ParaSync verified athlete — all 30 metrics available to connected scouts</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { color: Colors.t3, fontSize: 14 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.card, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.purple + '25', borderWidth: 1.5, borderColor: Colors.purple, alignItems: 'center', justifyContent: 'center' },
  monogram: { color: Colors.purple, fontSize: 18, fontWeight: '800' },
  info: { flex: 1 },
  name: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  meta: { color: Colors.t2, fontSize: 12, marginBottom: 6 },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  shortlistBtn: { flex: 1, backgroundColor: Colors.orange + '20', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.orange + '40' },
  shortlistText: { color: Colors.orange, fontSize: 11, fontWeight: '700' },
  connectBtn: { flex: 1, backgroundColor: Colors.card2, borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  connectText: { color: Colors.t2, fontSize: 11, fontWeight: '700' },
  pendingBtn: { flex: 1, backgroundColor: Colors.orange + '18', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.orange + '40' },
  pendingBtnText: { color: Colors.orange, fontSize: 11, fontWeight: '700' },
  messageBtn: { flex: 1, backgroundColor: Colors.green + '18', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.green + '40' },
  messageBtnText: { color: Colors.green, fontSize: 11, fontWeight: '700' },
  reportBtn: { flex: 1, backgroundColor: Colors.card2, borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  reportText: { color: Colors.t2, fontSize: 11, fontWeight: '700' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 12 },
  noDataCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  noDataText: { color: Colors.t3, fontSize: 12, textAlign: 'center' },
  joinBanner: { backgroundColor: Colors.purple + '15', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.purple + '30', marginTop: 8 },
  joinText: { color: Colors.t2, fontSize: 12, lineHeight: 18 },
});
