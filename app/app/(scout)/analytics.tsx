import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import PerformanceChart from '../../components/charts/PerformanceChart';
import { Colors } from '../../constants/colors';

export default function ScoutAnalytics() {
  return (
    <Screen>
      <Topbar title="Scout Analytics" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Top Performers by Region</Text>
        {[['Karnataka', 12], ['Maharashtra', 9], ['Delhi', 7], ['Tamil Nadu', 6]].map(([r, c]) => (
          <View key={String(r)} style={styles.regionRow}>
            <Text style={styles.region}>{r}</Text>
            <View style={styles.barWrap}><View style={[styles.bar, { width: `${(c as number / 12) * 100}%` }]} /></View>
            <Text style={styles.count}>{c}</Text>
          </View>
        ))}
        <Text style={styles.sectionTitle}>Top Score Trend</Text>
        <PerformanceChart data={[82, 84, 83, 86, 87, 88, 89]} label="Score" color={Colors.purple} />
        <Text style={styles.sectionTitle}>Classification Breakdown</Text>
        {[['T53', 8], ['T54', 5], ['T51', 3], ['F44', 4]].map(([c, v]) => (
          <View key={String(c)} style={styles.classRow}>
            <Text style={styles.classLabel}>{c}</Text>
            <View style={styles.barWrap}><View style={[styles.bar, { width: `${(v as number / 8) * 100}%` }]} /></View>
            <Text style={styles.count}>{v}</Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 12, marginTop: 8 },
  regionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  region: { color: Colors.t2, fontSize: 12, width: 90 },
  barWrap: { flex: 1, height: 8, backgroundColor: Colors.card2, borderRadius: 4, overflow: 'hidden' },
  bar: { height: '100%', backgroundColor: Colors.purple, borderRadius: 4 },
  count: { color: Colors.purple, fontSize: 12, fontWeight: '700', width: 20 },
  classRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  classLabel: { color: Colors.t2, fontSize: 12, width: 40 },
});
