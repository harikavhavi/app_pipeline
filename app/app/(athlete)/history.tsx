import React, { useEffect, useState } from 'react';
import { ScrollView, Text, StyleSheet, View, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import SessionCard from '../../components/ui/SessionCard';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth.store';
import { athleteService } from '../../services/athlete.service';
import { Session } from '../../data/mock-sessions';

export default function History() {
  const router    = useRouter();
  const userId    = useAuthStore(s => s.userId);

  const [sessions,     setSessions]     = useState<Session[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [source,       setSource]       = useState<'api' | 'mock'>('mock');
  const [error,        setError]        = useState<string | null>(null);

  async function loadSessions(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else            setLoading(true);
    setError(null);

    try {
      const data = await athleteService.getSessions(userId ?? 'ath1');
      setSessions(data);
      // Detect if result came from real API or mock
      setSource(data.length > 0 && (data[0] as any).athleteId === userId ? 'api' : 'mock');
    } catch (e: any) {
      setError('Could not load sessions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadSessions(); }, []);

  return (
    <Screen>
      <Topbar title="Performance History" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadSessions(true)}
            tintColor={Colors.cyan}
          />
        }
      >
        {/* ── Header row ── */}
        <View style={styles.headerRow}>
          <Text style={styles.count}>
            {loading ? 'Loading…' : `${sessions.length} session${sessions.length !== 1 ? 's' : ''} recorded`}
          </Text>
          {/* Source badge */}
          <View style={[styles.sourceBadge, source === 'api' ? styles.sourceLive : styles.sourceMock, { flexDirection: 'row', alignItems: 'center', gap: 5 }]}>
            <Ionicons name="ellipse" size={8} color={source === 'api' ? Colors.green : Colors.yellow} />
            <Text style={styles.sourceBadgeText}>
              {source === 'api' ? 'Live DB' : 'Mock'}
            </Text>
          </View>
        </View>

        {/* ── Loading ── */}
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.cyan} size="large" />
            <Text style={styles.loadingText}>Fetching from database…</Text>
          </View>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <View style={styles.errorCard}>
            <Ionicons name="warning-outline" size={36} color={Colors.red} style={styles.errorIcon} />
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorSub}>Pull down to retry</Text>
          </View>
        )}

        {/* ── Session list ── */}
        {!loading && sessions.map(s => (
          <SessionCard
            key={s.id}
            session={{
              id:        s.id,
              date:      s.date,
              sport:     s.sport,
              duration:  s.duration,
              score:     s.score,
              topMetric: s.videoFile ?? (s.duration ? `Duration: ${s.duration}` : '—'),
            }}
            onPress={() => router.push({ pathname: '/(athlete)/dashboard', params: { sessionId: s.id } })}
          />
        ))}

        {/* ── Empty state ── */}
        {!loading && !error && sessions.length === 0 && (
          <View style={styles.center}>
            <Ionicons name="folder-open-outline" size={44} color={Colors.t2} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptySub}>Upload a video to run your first analysis</Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  count: { color: Colors.t2, fontSize: 12 },

  sourceBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  sourceLive:  { borderColor: Colors.green + '60', backgroundColor: Colors.green + '18' },
  sourceMock:  { borderColor: Colors.yellow + '60', backgroundColor: Colors.yellow + '12' },
  sourceBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.t1 },

  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingText: { color: Colors.t3, fontSize: 13, marginTop: 14 },

  errorCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.red + '40',
  },
  errorIcon: { fontSize: 36, marginBottom: 10 },
  errorText: { color: Colors.red, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  errorSub:  { color: Colors.t3, fontSize: 12, marginTop: 6 },

  emptyIcon:  { fontSize: 44, marginBottom: 14 },
  emptyTitle: { color: Colors.t1, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptySub:   { color: Colors.t3, fontSize: 12, textAlign: 'center' },
});
