import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import PillarSection from '../../components/ui/PillarSection';
import AILogEntry from '../../components/ui/AILogEntry';
import SafetyBadge from '../../components/ui/SafetyBadge';
import AthleteFeedbackCard from '../../components/ui/AthleteFeedbackCard';
import FramingWarningCard from '../../components/ui/FramingWarningCard';
import { Colors } from '../../constants/colors';
import { useAnalysisStore } from '../../store/analysis.store';
import { useAuthStore } from '../../store/auth.store';
import { athleteService } from '../../services/athlete.service';
import { Session, AthleteMetricsSummary } from '../../types';
import { DUMMY_SESSIONS } from '../../data/dummy.data';


export default function Dashboard() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const inMemoryResult = useAnalysisStore(s => s.result);
  const userName = useAuthStore(s => s.userName);
  const userId = useAuthStore(s => s.userId);
  const [scoutVisible, setScoutVisible] = useState(true);
  const [showAILog,    setShowAILog]    = useState(false);
  const [showPillars,  setShowPillars]  = useState(false);

  const [session, setSession] = useState<Session | null>(sessionId ? null : inMemoryResult);
  const [loadingSession, setLoadingSession] = useState(!!sessionId);
  const [summary, setSummary] = useState<AthleteMetricsSummary | null>(null);

  // Load a specific past session when navigated here with ?sessionId=...
  useEffect(() => {
    if (!sessionId) {
      // Use in-memory result or dummy data as fallback
      setSession(inMemoryResult ?? (DUMMY_SESSIONS[0] as unknown as Session));
      return;
    }
    setLoadingSession(true);
    athleteService.getSession(String(sessionId))
      .then(s => { setSession(s ?? (DUMMY_SESSIONS[0] as unknown as Session)); setLoadingSession(false); })
      .catch(() => { setSession(DUMMY_SESSIONS[0] as unknown as Session); setLoadingSession(false); });
  }, [sessionId]);

  // Career-level aggregate (avg + best per metric, across every session)
  useEffect(() => {
    if (!userId) return;
    athleteService.getMetricsSummary(userId).then(setSummary);
  }, [userId, session]);

  const initials = (userName ?? 'A S')
    .split(' ').map((w: string) => w[0] ?? '').join('').slice(0, 2).toUpperCase();

  const pillars = session?.metricCards?.length
    ? Object.entries(
        session.metricCards.reduce((acc: any, card: any) => {
          (acc[card.pillar] = acc[card.pillar] || []).push(card);
          return acc;
        }, {})
      )
    : [];

  const riskCard = session?.metricCards?.find(c => c.id === 'p12_rsi_risk_level');
  const riskLevel = typeof riskCard?.value === 'string' ? riskCard.value : null;

  return (
    <Screen hasOrbs>
      <Topbar
        title={sessionId ? 'Session Detail' : 'Dashboard'}
        onBack={() => router.back()}
        right={
          <TouchableOpacity onPress={() => router.push('/(athlete)/history')}>
            <Text style={{ color: Colors.cyan, fontSize: 13, fontWeight: '700' }}>History</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Athlete identity strip ── */}
        <View style={styles.identityRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.athleteName}>{userName ?? 'Athlete'}</Text>
            <Text style={styles.athleteMeta}>
              {session ? `${session.sport} · ${session.ipcClass}` : 'No session selected'}
            </Text>
          </View>
          {riskLevel && <SafetyBadge level={riskLevel as any} compact />}
        </View>

        {/* ── Career overview (aggregate across all sessions) ── */}
        <View style={styles.careerCard}>
          <Text style={styles.careerTitle}>Career Overview</Text>
          <View style={styles.careerStatsRow}>
            <View style={styles.careerStat}>
              <Text style={styles.careerVal}>{summary?.sessions_count ?? 0}</Text>
              <Text style={styles.careerLabel}>Sessions</Text>
            </View>
            <View style={styles.careerDivider} />
            <View style={styles.careerStat}>
              <Text style={styles.careerVal}>{summary?.overall_avg ?? '—'}</Text>
              <Text style={styles.careerLabel}>Avg Score</Text>
            </View>
            <View style={styles.careerDivider} />
            <View style={[styles.careerStat]}>
              <Text style={[styles.careerVal, { color: Colors.green }]}>{summary?.overall_best ?? '—'}</Text>
              <Text style={styles.careerLabel}>Best Score</Text>
            </View>
          </View>
        </View>

        {/* ── This session ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{sessionId ? 'This Session' : 'Latest Session'}</Text>
          {session && (
            <Text style={styles.sessionDate}>{session.date}</Text>
          )}
        </View>

        {loadingSession && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.cyan} />
            <Text style={styles.loadingText}>Loading session…</Text>
          </View>
        )}

        {!loadingSession && session && (
          <>
            <View style={styles.scoreHero}>
              <View>
                <Text style={styles.scoreHeroNum}>{session.score ?? session.overallScore ?? 0}</Text>
                <Text style={styles.scoreHeroLabel}>Session Score</Text>
              </View>
              {session.isEstimated && (
                <View style={[styles.preliminaryTag, { flexDirection: 'row', alignItems: 'center', gap: 5 }]}>
                  <Ionicons name="warning-outline" size={12} color={Colors.orange} />
                  <Text style={styles.preliminaryText}>Preliminary Estimate</Text>
                </View>
              )}
            </View>

            <FramingWarningCard framing={session.framingFeedback} />
            <AthleteFeedbackCard text={session.feedback?.athlete_feedback} />

            {/* ── Metrics Pillars — collapsed by default ── */}
            <TouchableOpacity
              style={styles.collapseHeader}
              onPress={() => setShowPillars(v => !v)}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Biomechanics Metrics</Text>
                {!showPillars && pillars.length > 0 && (
                  <Text style={styles.collapseHint}>{pillars.length} pillar{pillars.length > 1 ? 's' : ''} · tap to view</Text>
                )}
              </View>
              <Ionicons name={showPillars ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.t3} />
            </TouchableOpacity>

            {showPillars && (
              pillars.length > 0 ? (
                pillars.map(([pillarName, cards]: any) => (
                  <PillarSection key={pillarName} title={pillarName} cards={cards} />
                ))
              ) : (
                <View style={styles.emptyPillars}>
                  <Ionicons name="stats-chart-outline" size={40} color={Colors.t2} style={styles.emptyPillarsIcon} />
                  <Text style={styles.emptyPillarsTitle}>No metrics for this session</Text>
                </View>
              )
            )}

            {/* ── AI Overview — collapsed by default, preview badge shown ── */}
            <TouchableOpacity
              style={styles.collapseHeader}
              onPress={() => setShowAILog(v => !v)}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>AI Analysis Overview</Text>
                {!showAILog && (
                  <View style={styles.aiSummaryRow}>
                    {(session.aiLog?.length ?? 0) > 0 && (
                      <View style={styles.aiCountBadge}>
                        <Ionicons name="sparkles" size={10} color={Colors.cyan} />
                        <Text style={styles.aiCountText}>{session.aiLog.length} insight{session.aiLog.length > 1 ? 's' : ''}</Text>
                      </View>
                    )}
                    {session.aiLog?.some(e => e.type === 'warn') && (
                      <View style={[styles.aiCountBadge, { borderColor: Colors.orange + '50', backgroundColor: Colors.orange + '15' }]}>
                        <Ionicons name="warning-outline" size={10} color={Colors.orange} />
                        <Text style={[styles.aiCountText, { color: Colors.orange }]}>
                          {session.aiLog.filter(e => e.type === 'warn').length} risk flag{session.aiLog.filter(e => e.type === 'warn').length > 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}
                    {(session.aiLog?.length ?? 0) === 0 && (
                      <Text style={styles.collapseHint}>Tap to view AI insights</Text>
                    )}
                  </View>
                )}
              </View>
              <Ionicons name={showAILog ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.t3} />
            </TouchableOpacity>

            {showAILog && (
              (session.aiLog?.length ? session.aiLog : [
                { msg: 'No AI insights recorded for this session', type: 'warn' as const },
              ]).map((e, i) => <AILogEntry key={i} msg={e.msg} type={e.type as 'good' | 'warn'} />)
            )}
          </>
        )}

        {!loadingSession && !session && (
          <View style={styles.emptyPillars}>
            <Ionicons name="stats-chart-outline" size={40} color={Colors.t2} style={styles.emptyPillarsIcon} />
            <Text style={styles.emptyPillarsTitle}>No session yet</Text>
            <Text style={styles.emptyPillarsSub}>Upload and analyse a video to see your biomechanics metrics here</Text>
            <TouchableOpacity style={[styles.uploadBtn, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }]} onPress={() => router.push('/(athlete)/upload')}>
              <Text style={styles.uploadBtnText}>Analyse a Video</Text>
              <Ionicons name="arrow-forward" size={14} color="#000" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Scout visibility ── */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Scout Visibility</Text>
          <Switch value={scoutVisible} onValueChange={setScoutVisible} trackColor={{ true: Colors.cyan, false: Colors.card2 }} thumbColor="#fff" />
        </View>

        {/* Connect CTA */}
        <TouchableOpacity style={[styles.scoutBtn, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }]} onPress={() => router.push('/(athlete)/connect')}>
          <Ionicons name="link-outline" size={16} color={Colors.cyan} />
          <Text style={styles.scoutBtnText}>Connect with Scouts & Coaches</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },

  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.cyan + '25', borderWidth: 1.5, borderColor: Colors.cyan, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.cyan, fontWeight: '800', fontSize: 14 },
  athleteName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  athleteMeta: { color: Colors.t2, fontSize: 12, marginTop: 1 },

  careerCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 18, marginBottom: 22, borderWidth: 1, borderColor: Colors.border },
  careerTitle: { color: Colors.t2, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
  careerStatsRow: { flexDirection: 'row', alignItems: 'center' },
  careerStat: { flex: 1, alignItems: 'center' },
  careerDivider: { width: 1, height: 32, backgroundColor: Colors.border },
  careerVal: { fontSize: 26, fontWeight: '900', color: Colors.cyan },
  careerLabel: { color: Colors.t3, fontSize: 10, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.4 },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  sessionDate: { color: Colors.t3, fontSize: 11 },

  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 20 },
  loadingText: { color: Colors.t3, fontSize: 13 },

  scoreHero: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 16, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  scoreHeroNum: { fontSize: 34, fontWeight: '900', color: Colors.cyan },
  scoreHeroLabel: { color: Colors.t2, fontSize: 11, marginTop: 2 },
  preliminaryTag: { backgroundColor: Colors.orange + '20', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: Colors.orange + '50' },
  preliminaryText: { color: Colors.orange, fontSize: 11, fontWeight: '700' },

  emptyPillars: { backgroundColor: Colors.card, borderRadius: 16, padding: 32, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  emptyPillarsIcon: { fontSize: 40, marginBottom: 12 },
  emptyPillarsTitle: { color: Colors.t1, fontSize: 15, fontWeight: '700', marginBottom: 6 },
  emptyPillarsSub: { color: Colors.t3, fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  uploadBtn: { backgroundColor: Colors.cyan, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  uploadBtnText: { color: '#000', fontSize: 13, fontWeight: '800' },

  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginTop: 8, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  toggleLabel: { color: Colors.t2, fontSize: 13 },

  scoutBtn: { backgroundColor: Colors.cyan + '18', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.cyan + '40' },
  scoutBtnText: { color: Colors.cyan, fontSize: 14, fontWeight: '700' },

  // ── Collapsible section headers ────────────────────────────────────────────
  collapseHeader: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    padding: 14, marginBottom: 8, marginTop: 4,
  },
  collapseHint:  { color: Colors.t3, fontSize: 11, marginTop: 2 },

  // ── AI summary badges ──────────────────────────────────────────────────────
  aiSummaryRow:  { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  aiCountBadge:  {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.cyan + '15', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.cyan + '40',
  },
  aiCountText: { color: Colors.cyan, fontSize: 10, fontWeight: '700' },
});

