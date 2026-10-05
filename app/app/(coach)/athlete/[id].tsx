import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../../components/layout/Screen';
import Topbar from '../../../components/layout/Topbar';
import SessionCard from '../../../components/ui/SessionCard';
import { Colors } from '../../../constants/colors';
import { useAuthStore } from '../../../store/auth.store';
import { athleteService } from '../../../services/athlete.service';
import { coachService } from '../../../services/coach.service';
import { Session, ConnectionStatus } from '../../../types';

export default function AthleteDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const coachId = useAuthStore(s => s.userId);
  const [athlete, setAthlete] = useState<any>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ConnectionStatus | undefined>(undefined);
  const [requesting, setRequesting] = useState(false);
  const [requestMsg, setRequestMsg] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const athleteId = String(id);
    Promise.all([
      athleteService.getProfile(athleteId),
      athleteService.getSessions(athleteId),
    ]).then(([profile, sess]) => {
      setAthlete(profile);
      setSessions(sess);
      setLoading(false);
    });
    // Fire-and-forget: counts toward this athlete's "Scout Views" stat.
    athleteService.recordView(athleteId);
  }, [id]);

  useEffect(() => {
    if (!coachId || !id) return;
    const athleteId = String(id);
    Promise.all([
      coachService.getRequests(coachId),
      coachService.getConnectedAthletes(coachId),
    ]).then(([pending, connected]) => {
      if (connected.some((a: any) => a.id === athleteId)) setStatus('accepted');
      else if (pending.some(r => r.id === athleteId)) setStatus('pending');
      else setStatus(undefined);
    });
  }, [coachId, id]);

  function openSession(sessionId: string) {
    router.push(`/(coach)/session/${sessionId}` as any);
  }

  async function sendSessionRequest() {
    if (!coachId || !id || sending) return;
    setSending(true);
    const result = await coachService.requestSession(coachId, String(id), requestMsg.trim() || undefined);
    setSending(false);
    if (result) {
      setRequesting(false);
      setRequestMsg('');
      setRequestSent(true);
    }
  }

  if (loading) {
    return (
      <Screen>
        <Topbar title="Athlete" onBack={() => router.back()} />
        <View style={styles.center}><ActivityIndicator color={Colors.blue} size="large" /></View>
      </Screen>
    );
  }

  if (!athlete) {
    return (
      <Screen>
        <Topbar title="Athlete" onBack={() => router.back()} />
        <View style={styles.center}><Text style={styles.emptyText}>Athlete not found.</Text></View>
      </Screen>
    );
  }

  const scores = sessions.map(s => s.overallScore ?? s.score ?? 0).filter(Boolean);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const bestScore = scores.length ? Math.max(...scores) : null;

  return (
    <Screen>
      <Topbar title={athlete.name} onBack={() => router.back()} right={<TouchableOpacity onPress={() => router.push('/(coach)/upload')}><Text style={{ color: Colors.blue, fontSize: 12 }}>Upload Session</Text></TouchableOpacity>} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.avatar}><Text style={styles.monogram}>{(athlete.name ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2)}</Text></View>
          <View>
            <Text style={styles.name}>{athlete.name}</Text>
            <Text style={styles.meta}>{(athlete.sport ?? '').replace(/_/g, ' ')} · {athlete.ipc_class ?? '—'}</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          {[['Sessions', sessions.length], ['Avg Score', avgScore ?? '—'], ['Best', bestScore ?? '—']].map(([l, v]) => (
            <View key={String(l)} style={styles.statBox}>
              <Text style={styles.statVal}>{v}</Text>
              <Text style={styles.statLabel}>{l}</Text>
            </View>
          ))}
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(coach)/compare')}><Text style={styles.actionText}>Compare Sessions</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(coach)/drills')}><Text style={styles.actionText}>Assign Drills</Text></TouchableOpacity>
        </View>

        {status === 'accepted' && (
          <View style={{ marginBottom: 20 }}>
            {!requesting && !requestSent && (
              <TouchableOpacity
                style={[styles.actionBtn, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }]}
                onPress={() => setRequesting(true)}
              >
                <Ionicons name="videocam-outline" size={14} color={Colors.blue} />
                <Text style={styles.actionText}>Request a session</Text>
              </TouchableOpacity>
            )}
            {requesting && (
              <View style={styles.requestForm}>
                <TextInput
                  style={styles.requestInput}
                  placeholder="Optional note (e.g. film today's match, full court view)"
                  placeholderTextColor={Colors.t3}
                  value={requestMsg}
                  onChangeText={setRequestMsg}
                  multiline
                />
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <TouchableOpacity style={[styles.actionBtn, { flex: 1 }]} onPress={() => setRequesting(false)}>
                    <Text style={styles.actionText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { flex: 1, backgroundColor: Colors.blue, borderColor: Colors.blue }]}
                    onPress={sendSessionRequest}
                    disabled={sending}
                  >
                    <Text style={[styles.actionText, { color: '#000' }]}>{sending ? 'Sending…' : 'Send request'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {requestSent && (
              <View style={[styles.requestForm, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                <Ionicons name="checkmark-circle-outline" size={16} color={Colors.green} />
                <Text style={[styles.emptyText, { textAlign: 'left', flex: 1 }]}>Session request sent to {athlete.name}.</Text>
              </View>
            )}
          </View>
        )}

        <Text style={styles.sectionTitle}>Session History</Text>
        {status === 'accepted' ? (
          <>
            {sessions.length === 0 && <Text style={styles.emptyText}>No sessions recorded yet.</Text>}
            {sessions.map(s => (
              <SessionCard
                key={s.id}
                session={{ id: s.id, date: s.date, sport: s.sport, duration: s.duration, score: s.score ?? s.overallScore, topMetric: s.videoFile }}
                onPress={() => openSession(s.id)}
              />
            ))}
          </>
        ) : (
          <View style={styles.lockedCard}>
            <Ionicons name="lock-closed-outline" size={22} color={Colors.t3} />
            <Text style={styles.emptyText}>Connect with this athlete to view their session videos and metrics</Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.card, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.blue + '25', alignItems: 'center', justifyContent: 'center' },
  monogram: { color: Colors.blue, fontSize: 18, fontWeight: '800' },
  name: { color: '#fff', fontSize: 15, fontWeight: '700' },
  meta: { color: Colors.t2, fontSize: 12 },
  statsRow: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '800', color: Colors.blue },
  statLabel: { fontSize: 10, color: Colors.t3, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  actionBtn: { flex: 1, backgroundColor: Colors.blue + '20', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.blue + '40' },
  actionText: { color: Colors.blue, fontSize: 12, fontWeight: '700' },
  requestForm: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border },
  requestInput: { color: '#fff', fontSize: 13, minHeight: 60, textAlignVertical: 'top' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 12 },
  emptyText: { color: Colors.t3, fontSize: 13, textAlign: 'center' },
  lockedCard: {
    alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.card, borderRadius: 12, padding: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
});
