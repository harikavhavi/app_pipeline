import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import SafetyBadge from '../../components/ui/SafetyBadge';
import { Colors } from '../../constants/colors';

const RSI_HISTORY = [
  { date: '22 Aug', value: 14, level: 'LOW' },
  { date: '15 Aug', value: 18, level: 'LOW' },
  { date: '08 Aug', value: 28, level: 'MED' },
  { date: '01 Aug', value: 36, level: 'HIGH' },
  { date: '25 Jul', value: 22, level: 'MED' },
];

const WARMUP = [
  'Shoulder mobility circles — 2×10 reps each direction',
  'Wrist flexor stretch — 30 seconds per arm',
  'Trunk rotation against resistance — 3×15 reps',
  'Gradual push cadence build-up — 5 minutes at 60% intensity',
  'Hip flexor activation stretch — 45 seconds per side',
];

export default function Safety() {
  const router = useRouter();
  return (
    <Screen>
      <Topbar title="Injury & Safety" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Current Status</Text>
        <SafetyBadge level="LOW" />

        <Text style={styles.sectionTitle}>RSI History</Text>
        {RSI_HISTORY.map((r, i) => (
          <View key={i} style={styles.rsiRow}>
            <Text style={styles.rsiDate}>{r.date}</Text>
            <View style={styles.rsiBarWrap}>
              <View style={[styles.rsiBar, { width: `${(r.value / 50) * 100}%`, backgroundColor: r.level === 'LOW' ? Colors.green : r.level === 'MED' ? Colors.orange : Colors.red }]} />
            </View>
            <Text style={[styles.rsiVal, { color: r.level === 'LOW' ? Colors.green : r.level === 'MED' ? Colors.orange : Colors.red }]}>{r.value}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Warm-Up Suggestions</Text>
        {WARMUP.map((w, i) => (
          <View key={i} style={styles.warmupRow}>
            <Text style={styles.warmupNum}>{i + 1}</Text>
            <Text style={styles.warmupText}>{w}</Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 12, marginTop: 12 },
  rsiRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  rsiDate: { color: Colors.t2, fontSize: 11, width: 50 },
  rsiBarWrap: { flex: 1, height: 8, backgroundColor: Colors.card2, borderRadius: 4, overflow: 'hidden' },
  rsiBar: { height: '100%', borderRadius: 4 },
  rsiVal: { fontSize: 12, fontWeight: '700', width: 24 },
  warmupRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: Colors.card, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  warmupNum: { color: Colors.cyan, fontSize: 13, fontWeight: '800', width: 18 },
  warmupText: { color: Colors.t2, fontSize: 13, flex: 1, lineHeight: 20 },
});
