/**
 * /(coach)/video-sessions.tsx
 * Coach: view, accept/decline session requests, start & record sessions.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth.store';
import { videoSessionService } from '../../services/videoSession.service';
import { VideoSession } from '../../types';

const STATUS_COLOR: Record<string, string> = {
  pending:     Colors.yellow,
  accepted:    Colors.cyan,
  in_progress: Colors.green,
  completed:   Colors.t2,
  declined:    Colors.red,
  cancelled:   Colors.t3,
};

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    pending: 'Pending', accepted: 'Accepted', in_progress: 'Live',
    completed: 'Done', declined: 'Declined', cancelled: 'Cancelled',
  };
  const color = STATUS_COLOR[status] ?? Colors.t3;
  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>{labels[status] ?? status}</Text>
    </View>
  );
}

export default function CoachVideoSessions() {
  const router   = useRouter();
  const userId   = useAuthStore(s => s.userId);
  const userName = useAuthStore(s => s.userName);

  const [sessions,  setSessions]  = useState<VideoSession[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [active,    setActive]    = useState<VideoSession | null>(null);
  const [meetLink,  setMeetLink]  = useState('');
  const [recording, setRecording] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    const s = await videoSessionService.getCoachSessions(userId);
    setSessions(s);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function accept(s: VideoSession) {
    setActionLoading(true);
    const link = meetLink.trim() || `https://meet.google.com/parasync-${s.id.slice(-6)}`;
    await videoSessionService.updateStatus(s.id, 'accepted', link);
    setActionLoading(false);
    setActive(null);
    setMeetLink('');
    load();
  }

  async function decline(s: VideoSession) {
    setActionLoading(true);
    await videoSessionService.updateStatus(s.id, 'declined');
    setActionLoading(false);
    setActive(null);
    load();
  }

  async function complete(s: VideoSession) {
    setActionLoading(true);
    await videoSessionService.completeSession(s.id, recording.trim() || null, null);
    setActionLoading(false);
    setActive(null);
    setRecording('');
    load();
  }

  const pending   = sessions.filter(s => s.status === 'pending');
  const accepted  = sessions.filter(s => ['accepted', 'in_progress'].includes(s.status));
  const pastSess  = sessions.filter(s => ['completed', 'declined', 'cancelled'].includes(s.status));

  function SessionRow({ session }: { session: VideoSession }) {
    return (
      <TouchableOpacity style={styles.card} onPress={() => setActive(session)} activeOpacity={0.85}>
        <View style={styles.cardRow}>
          <View style={styles.cardIcon}>
            <Ionicons
              name={session.status === 'completed' ? 'checkmark-circle' : 'videocam'}
              size={20} color={STATUS_COLOR[session.status] ?? Colors.cyan}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>{session.title}</Text>
            <Text style={styles.cardMeta}>{session.athleteName}</Text>
          </View>
          <StatusBadge status={session.status} />
        </View>
        {session.notes && (
          <Text style={styles.cardNotes} numberOfLines={2}>{session.notes}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <Screen hasOrbs>
      <Topbar title="Video Sessions" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {loading && <View style={styles.center}><ActivityIndicator color={Colors.blue} size="large" /></View>}

        {!loading && pending.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>New Requests <Text style={styles.sectionBadge}>{pending.length}</Text></Text>
            {pending.map(s => <SessionRow key={s.id} session={s} />)}
          </>
        )}

        {!loading && accepted.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Upcoming / Live</Text>
            {accepted.map(s => <SessionRow key={s.id} session={s} />)}
          </>
        )}

        {!loading && pastSess.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Past Sessions</Text>
            {pastSess.map(s => <SessionRow key={s.id} session={s} />)}
          </>
        )}

        {!loading && sessions.length === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="videocam-outline" size={44} color={Colors.t3} />
            <Text style={styles.emptyTitle}>No session requests yet</Text>
            <Text style={styles.emptySub}>Your athletes can request 1-on-1 sessions with you here</Text>
          </View>
        )}

      </ScrollView>

      {/* ── Session Action Modal ── */}
      <Modal visible={!!active} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            {active && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle} numberOfLines={1}>{active.title}</Text>
                  <TouchableOpacity onPress={() => setActive(null)}>
                    <Ionicons name="close" size={22} color={Colors.t2} />
                  </TouchableOpacity>
                </View>

                <StatusBadge status={active.status} />

                <View style={styles.detailRow}>
                  <Ionicons name="person-outline" size={14} color={Colors.t2} />
                  <Text style={styles.detailText}>Athlete: {active.athleteName}</Text>
                </View>
                {active.notes && (
                  <View style={styles.detailRow}>
                    <Ionicons name="chatbubble-outline" size={14} color={Colors.t2} />
                    <Text style={styles.detailText}>{active.notes}</Text>
                  </View>
                )}

                {/* Pending → Accept/Decline */}
                {active.status === 'pending' && (
                  <>
                    <Text style={styles.label}>Meet Link (auto-generated if blank)</Text>
                    <TextInput
                      style={styles.input}
                      value={meetLink}
                      onChangeText={setMeetLink}
                      placeholder="https://meet.google.com/..."
                      placeholderTextColor={Colors.t3}
                    />
                    <View style={styles.btnRow}>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.red + '20', borderColor: Colors.red + '50' }]} onPress={() => decline(active)}>
                        {actionLoading ? <ActivityIndicator color={Colors.red} size="small" /> : <Text style={[styles.actionBtnText, { color: Colors.red }]}>Decline</Text>}
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.cyan, flex: 2 }]} onPress={() => accept(active)}>
                        {actionLoading ? <ActivityIndicator color="#000" size="small" /> : <Text style={[styles.actionBtnText, { color: '#000' }]}>Accept & Share Link</Text>}
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {/* Accepted → Mark as Live / Complete */}
                {active.status === 'accepted' && (
                  <>
                    {active.meetLink && (
                      <TouchableOpacity style={[styles.joinBtn, { backgroundColor: Colors.cyan }]}>
                        <Ionicons name="videocam" size={16} color="#000" />
                        <Text style={styles.joinBtnText}>Open Meet Link</Text>
                      </TouchableOpacity>
                    )}
                    <Text style={[styles.label, { marginTop: 14 }]}>Recording URL (optional)</Text>
                    <TextInput
                      style={styles.input}
                      value={recording}
                      onChangeText={setRecording}
                      placeholder="https://drive.google.com/..."
                      placeholderTextColor={Colors.t3}
                    />
                    <TouchableOpacity style={[styles.joinBtn, { backgroundColor: Colors.green }]} onPress={() => complete(active)}>
                      {actionLoading ? <ActivityIndicator color="#000" size="small" /> : (
                        <>
                          <Ionicons name="checkmark-circle" size={16} color="#000" />
                          <Text style={styles.joinBtnText}>Mark as Completed</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                {/* Completed */}
                {active.status === 'completed' && active.recordingUrl && (
                  <TouchableOpacity style={[styles.joinBtn, { backgroundColor: Colors.green }]}>
                    <Ionicons name="play" size={16} color="#000" />
                    <Text style={styles.joinBtnText}>Watch Recording</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  center: { alignItems: 'center', paddingVertical: 60 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 10, marginTop: 6 },
  sectionBadge: { color: Colors.blue, fontSize: 13 },

  card: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.card2, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: '#fff', fontSize: 13, fontWeight: '700' },
  cardMeta:  { color: Colors.t3, fontSize: 11, marginTop: 2 },
  cardNotes: { color: Colors.t2, fontSize: 11, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border, lineHeight: 16 },

  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  badgeDot: { width: 5, height: 5, borderRadius: 3 },
  badgeText: { fontSize: 10, fontWeight: '700' },

  emptyCard: { alignItems: 'center', paddingVertical: 48, backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, gap: 8 },
  emptyTitle: { color: Colors.t1, fontSize: 16, fontWeight: '700', marginTop: 6 },
  emptySub:   { color: Colors.t3, fontSize: 12, textAlign: 'center', paddingHorizontal: 24 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.bg2, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderBottomWidth: 0, borderColor: Colors.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#fff', fontSize: 17, fontWeight: '800', flex: 1 },

  label: { color: Colors.t2, fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, color: '#fff', fontSize: 13, paddingHorizontal: 14, paddingVertical: 11 },

  btnRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', borderWidth: 1 },
  actionBtnText: { fontWeight: '700', fontSize: 13 },

  joinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 13, marginTop: 14 },
  joinBtnText: { color: '#000', fontWeight: '800', fontSize: 14 },

  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 12 },
  detailText: { color: Colors.t2, fontSize: 12, flex: 1, lineHeight: 18 },
});
