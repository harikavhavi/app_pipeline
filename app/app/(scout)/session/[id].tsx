import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../../components/layout/Screen';
import Topbar from '../../../components/layout/Topbar';
import PillarSection from '../../../components/ui/PillarSection';
import { Colors } from '../../../constants/colors';
import { API_BASE } from '../../../services/api';

export default function ScoutSessionDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/session/${id}`)
      .then(r => r.json())
      .then(data => { setSession(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Screen>
        <Topbar title="Session" onBack={() => router.back()} />
        <View style={styles.center}><ActivityIndicator color={Colors.purple} size="large" /></View>
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen>
        <Topbar title="Session" onBack={() => router.back()} />
        <View style={styles.center}><Text style={styles.emptyText}>Session not found.</Text></View>
      </Screen>
    );
  }

  const cards = session.metric_cards ?? [];
  const scored = cards.filter((c: any) => c.score != null);
  const avgScore = scored.length
    ? Math.round(scored.reduce((sum: number, c: any) => sum + c.score, 0) / scored.length)
    : 0;
  const pillars: [string, any[]][] = cards.length
    ? Object.entries(cards.reduce((acc: any, card: any) => {
        (acc[card.pillar] = acc[card.pillar] || []).push(card);
        return acc;
      }, {}))
    : [];
  const hasVideo = session.video_metadata?.has_video && !videoError;

  return (
    <Screen>
      <Topbar title={(session.sport ?? '').replace(/_/g, ' ') || 'Session'} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {hasVideo ? (
          <View style={styles.videoWrap}>
            <Video
              source={{ uri: `${API_BASE}/session/${id}/video` }}
              style={StyleSheet.absoluteFill}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              onError={() => setVideoError(true)}
            />
          </View>
        ) : (
          <View style={styles.noVideoCard}>
            <Ionicons name="videocam-off-outline" size={28} color={Colors.t3} />
            <Text style={styles.noVideoText}>Video not available for this session</Text>
          </View>
        )}

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.sportText}>{(session.sport ?? '').replace(/_/g, ' ')}</Text>
            <Text style={styles.dateText}>{session.date} · {session.ipc_class ?? '—'}</Text>
          </View>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{avgScore}</Text>
          </View>
        </View>

        {pillars.length > 0 ? (
          pillars.map(([pillarName, pillarCards]) => (
            <PillarSection key={pillarName} title={pillarName} cards={pillarCards} accent={Colors.purple} />
          ))
        ) : (
          <View style={styles.noVideoCard}>
            <Text style={styles.noVideoText}>No metrics recorded for this session</Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: Colors.t3, fontSize: 14 },
  videoWrap: {
    width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000',
    borderRadius: 14, overflow: 'hidden', marginBottom: 16,
  },
  noVideoCard: {
    alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.card, borderRadius: 14, padding: 24,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 16,
  },
  noVideoText: { color: Colors.t3, fontSize: 12, textAlign: 'center' },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  sportText: { color: '#fff', fontSize: 16, fontWeight: '700', textTransform: 'capitalize' },
  dateText: { color: Colors.t2, fontSize: 12, marginTop: 2 },
  scoreBadge: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.purple + '20',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.purple,
  },
  scoreText: { color: Colors.purple, fontSize: 16, fontWeight: '800' },
});
