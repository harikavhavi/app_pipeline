import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import { Colors } from '../../constants/colors';
import { API_BASE } from '../../services/api';

export default function CoachAnalytics() {
  const [athletes, setAthletes] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/athletes`)
      .then(r => r.json())
      .then(data => setAthletes(data.athletes ?? []))
      .catch(() => {});
  }, []);

  const bySport = athletes.reduce((acc: Record<string, number>, a) => {
    const sport = (a.sport ?? 'Unspecified').replace(/_/g, ' ');
    acc[sport] = (acc[sport] ?? 0) + 1;
    return acc;
  }, {});
  const sportEntries = Object.entries(bySport);
  const maxCount = Math.max(1, ...sportEntries.map(([, c]) => c));

  return (
    <Screen>
      <Topbar title="Group Analytics" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Avg Score Trend (Squad)</Text>
        <Text style={styles.emptyText}>Not enough session history yet to chart a trend.</Text>

        <Text style={styles.sectionTitle}>RSI Risk Distribution</Text>
        <Text style={styles.emptyText}>No injury-risk data available yet.</Text>

        <Text style={styles.sectionTitle}>Sport Participation</Text>
        {sportEntries.length === 0 && <Text style={styles.emptyText}>No athletes on your roster yet.</Text>}
        {sportEntries.map(([s, c]) => (
          <View key={s} style={styles.sportRow}>
            <Text style={styles.sportName}>{s}</Text>
            <View style={styles.barWrap}><View style={[styles.bar, { width: `${(c / maxCount) * 100}%` }]} /></View>
            <Text style={styles.sportCount}>{c}</Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 12, marginTop: 8 },
  emptyText: { color: Colors.t3, fontSize: 13, marginBottom: 20 },
  sportRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  sportName: { color: Colors.t2, fontSize: 12, width: 140 },
  barWrap: { flex: 1, height: 8, backgroundColor: Colors.card2, borderRadius: 4, overflow: 'hidden' },
  bar: { height: '100%', backgroundColor: Colors.blue, borderRadius: 4 },
  sportCount: { color: Colors.blue, fontSize: 13, fontWeight: '700', width: 20 },
});
