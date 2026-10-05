/**
 * /(athlete)/home.tsx
 * Para-athlete home screen — clean, progressive disclosure design.
 * Heavy metrics are hidden by default; quick-action cards surface key features.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import SessionCard from '../../components/ui/SessionCard';
import { Colors, ScoreColor } from '../../constants/colors';
import { useAuthStore } from '../../store/auth.store';
import { greeting } from '../../utils/greeting';
import { athleteService } from '../../services/athlete.service';
import { smartwatchService } from '../../services/smartwatch.service';
import { Session } from '../../types';
import { DUMMY_SESSIONS, DUMMY_WATCH_METRICS } from '../../data/dummy.data';

export default function AthleteHome() {
  const router   = useRouter();
  const userName = useAuthStore(s => s.userName);
  const userId   = useAuthStore(s => s.userId);

  const [sessions,    setSessions]    = useState<Session[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [viewCount,   setViewCount]   = useState<number | null>(null);
  const [connections, setConnections] = useState<number | null>(null);
  const [matchRate,   setMatchRate]   = useState<number | null>(null);
  const [showLastMetrics, setShowLastMetrics] = useState(false);
  const [watchConnected,  setWatchConnected]  = useState(false);

  useEffect(() => {
    athleteService.getSessions(userId ?? 'new')
      .then(data => {
        // Use dummy data as fallback when no real sessions exist
        setSessions(data.length > 0 ? data : DUMMY_SESSIONS as unknown as Session[]);
        setLoading(false);
      })
      .catch(() => {
        setSessions(DUMMY_SESSIONS as unknown as Session[]);
        setLoading(false);
      });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      athleteService.getProfile(userId),
      athleteService.getScouts(userId),
      athleteService.getConnectedCoachRequests(userId),
    ]).then(([profile, scouts, coaches]) => {
      setViewCount(profile?.view_count ?? 14);
      const all = [...scouts, ...coaches];
      const accepted = all.filter(c => c.status === 'accepted').length;
      setConnections(accepted > 0 ? accepted : 3);
      setMatchRate(all.length > 0 ? Math.round((accepted / all.length) * 100) : 78);
    }).catch(() => {
      setViewCount(14); setConnections(3); setMatchRate(78);
    });
    setWatchConnected(smartwatchService.isConnected());
  }, [userId]);

  const recentSessions = sessions.slice(0, 3);
  const lastSession    = sessions[0] ?? null;

  return (
    <Screen hasOrbs>
      <Topbar
        title="ParaSync"
        right={
          <TouchableOpacity onPress={() => router.push('/(athlete)/notifications')}>
            <Ionicons name="notifications-outline" size={20} color={Colors.white} />
          </TouchableOpacity>
        }
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Greeting ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Text style={styles.greeting}>{greeting()}, {userName?.split(' ')[0] ?? 'Athlete'}</Text>
          <Ionicons name="hand-left-outline" size={20} color={Colors.cyan} style={{ transform: [{ rotate: '-45deg' }] }} />
        </View>
        <Text style={styles.subGreeting}>
          {sessions.length > 0
            ? `${sessions.length} session${sessions.length > 1 ? 's' : ''} analysed`
            : 'No sessions yet — upload your first video'}
        </Text>

        {/* ── Scout stats strip ── */}
        <View style={styles.statsStrip}>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{viewCount ?? '—'}</Text>
            <Text style={styles.statLabel}>Scout Views</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statVal}>{connections ?? '—'}</Text>
            <Text style={styles.statLabel}>Connections</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[styles.statVal, { color: Colors.green }]}>
              {matchRate != null ? `${matchRate}%` : '—'}
            </Text>
            <Text style={styles.statLabel}>Match Rate</Text>
          </View>
        </View>

        {/* ── Analyse CTA ── */}
        <TouchableOpacity
          style={styles.ctaCard}
          onPress={() => router.push('/(athlete)/upload')}
          activeOpacity={0.85}
        >
          <Ionicons name="videocam-outline" size={26} color={Colors.cyan} />
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>Analyse New Session</Text>
            <Text style={styles.ctaBody}>Upload a training video for AI biomechanics analysis</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={Colors.cyan} />
        </TouchableOpacity>

        {/* ── Quick Actions Grid ── */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={[styles.quickCard, { borderColor: Colors.blue + '40', backgroundColor: Colors.blue + '0A' }]}
            onPress={() => router.push('/(athlete)/video-sessions')}
            activeOpacity={0.85}
          >
            <View style={[styles.quickIcon, { backgroundColor: Colors.blue + '20' }]}>
              <Ionicons name="videocam" size={20} color={Colors.blue} />
            </View>
            <Text style={styles.quickTitle}>Video Sessions</Text>
            <Text style={styles.quickSub}>1-on-1 with coach</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickCard,
              watchConnected
                ? { borderColor: Colors.green + '50', backgroundColor: Colors.green + '0A' }
                : { borderColor: Colors.purple + '40', backgroundColor: Colors.purple + '0A' },
            ]}
            onPress={() => router.push('/(athlete)/smartwatch')}
            activeOpacity={0.85}
          >
            <View style={[styles.quickIcon, { backgroundColor: (watchConnected ? Colors.green : Colors.purple) + '20' }]}>
              <Ionicons name="watch" size={20} color={watchConnected ? Colors.green : Colors.purple} />
            </View>
            <Text style={styles.quickTitle}>Health Monitor</Text>
            <Text style={styles.quickSub}>
              {watchConnected ? '● Connected' : 'Connect watch'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, { borderColor: Colors.cyan + '30', backgroundColor: Colors.cyan + '08' }]}
            onPress={() => router.push('/(athlete)/ai-chat')}
            activeOpacity={0.85}
          >
            <View style={[styles.quickIcon, { backgroundColor: Colors.cyan + '20' }]}>
              <Ionicons name="sparkles" size={20} color={Colors.cyan} />
            </View>
            <Text style={styles.quickTitle}>ParaSync AI</Text>
            <Text style={styles.quickSub}>Ask me anything</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, { borderColor: Colors.orange + '40', backgroundColor: Colors.orange + '08' }]}
            onPress={() => router.push('/(athlete)/connect')}
            activeOpacity={0.85}
          >
            <View style={[styles.quickIcon, { backgroundColor: Colors.orange + '18' }]}>
              <Ionicons name="people" size={20} color={Colors.orange} />
            </View>
            <Text style={styles.quickTitle}>Connect</Text>
            <Text style={styles.quickSub}>Scouts & coaches</Text>
          </TouchableOpacity>
        </View>

        {/* ── Last Session — collapsed by default ── */}
        {lastSession && (lastSession.metricCards?.length ?? 0) > 0 && (
          <View style={styles.lastSessionWrap}>
            <TouchableOpacity
              style={styles.lastSessionHeader}
              onPress={() => setShowLastMetrics(v => !v)}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Last Session Snapshot</Text>
                <Text style={styles.lastSessionMeta}>{lastSession.date} · Score {lastSession.score ?? lastSession.overallScore}</Text>
              </View>
              <Ionicons
                name={showLastMetrics ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={Colors.t3}
              />
            </TouchableOpacity>

            {showLastMetrics && (
              <View style={styles.metricsGrid}>
                {(lastSession.metricCards ?? []).slice(0, 4).map(mc => (
                  <View key={mc.id} style={styles.metricChip}>
                    <Text style={styles.metricVal}>
                      {typeof mc.value === 'number' ? mc.value.toFixed(1) : mc.value}
                      <Text style={styles.metricUnit}> {mc.unit ?? ''}</Text>
                    </Text>
                    <Text style={styles.metricLabel}>{mc.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Recent sessions ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          <TouchableOpacity onPress={() => router.push('/(athlete)/history')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.cyan} />
            <Text style={styles.loadingText}>Loading sessions…</Text>
          </View>
        )}

        {!loading && recentSessions.length === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="film-outline" size={44} color={Colors.t2} />
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptySub}>Tap "Analyse New Session" above to get started</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/(athlete)/upload')}
            >
              <Text style={styles.emptyBtnText}>Upload Video</Text>
              <Ionicons name="arrow-forward" size={14} color="#000" />
            </TouchableOpacity>
          </View>
        )}

        {!loading && recentSessions.map(s => (
          <SessionCard
            key={s.id}
            session={{
              id:        s.id,
              date:      s.date,
              sport:     s.sport,
              duration:  s.duration,
              score:     s.score ?? s.overallScore,
              topMetric: (s.metricCards ?? [])[0]
                ? `${(s.metricCards ?? [])[0].label}: ${(s.metricCards ?? [])[0].value} ${(s.metricCards ?? [])[0].unit ?? ''}`
                : `${s.ipcClass}`,
            }}
            onPress={() => router.push({ pathname: '/(athlete)/dashboard', params: { sessionId: s.id } })}
          />
        ))}

      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40 },

  greeting:    { fontSize: 22, fontWeight: '800', color: '#fff' },
  subGreeting: { color: Colors.t2, fontSize: 13, marginBottom: 20 },

  statsStrip:  { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  stat:        { flex: 1, alignItems: 'center' },
  statVal:     { fontSize: 20, fontWeight: '800', color: Colors.cyan, marginBottom: 2 },
  statLabel:   { fontSize: 10, color: Colors.t3 },
  statDivider: { width: 1, backgroundColor: Colors.border },

  ctaCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.cyan + '12', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.cyan + '35', marginBottom: 24 },
  ctaTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  ctaBody:  { color: Colors.t2, fontSize: 11 },

  sectionTitle:  { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  viewAll:       { color: Colors.cyan, fontSize: 12 },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  quickCard: {
    width: '47.5%', backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, padding: 14, gap: 6,
  },
  quickIcon:  { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  quickTitle: { color: '#fff', fontSize: 12, fontWeight: '700' },
  quickSub:   { color: Colors.t3, fontSize: 10 },

  lastSessionWrap:   { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 24 },
  lastSessionHeader: { flexDirection: 'row', alignItems: 'center' },
  lastSessionMeta:   { color: Colors.t3, fontSize: 11, marginTop: 2, marginBottom: 0 },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  metricChip:  { backgroundColor: Colors.card2, borderRadius: 10, padding: 10, minWidth: '45%', flex: 1, borderWidth: 1, borderColor: Colors.border },
  metricVal:   { color: Colors.cyan, fontSize: 16, fontWeight: '800' },
  metricUnit:  { color: Colors.t3, fontSize: 10, fontWeight: '400' },
  metricLabel: { color: Colors.t3, fontSize: 9, marginTop: 3 },

  loadingRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 20 },
  loadingText: { color: Colors.t3, fontSize: 13 },

  emptyCard:    { backgroundColor: Colors.card, borderRadius: 16, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  emptyTitle:   { color: Colors.t1, fontSize: 16, fontWeight: '700', marginBottom: 6, marginTop: 10 },
  emptySub:     { color: Colors.t3, fontSize: 12, textAlign: 'center', marginBottom: 18 },
  emptyBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.cyan, borderRadius: 10, paddingHorizontal: 22, paddingVertical: 10 },
  emptyBtnText: { color: '#000', fontSize: 13, fontWeight: '800' },
});
