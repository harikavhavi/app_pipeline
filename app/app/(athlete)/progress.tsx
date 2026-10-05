import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import RadarChart from '../../components/charts/RadarChart';
import PerformanceChart from '../../components/charts/PerformanceChart';
import { Colors } from '../../constants/colors';

const RADAR_LABELS = ['Propulsion', 'Symmetry', 'Stability', 'Reaction', 'Consistency', 'Spatial'];
const RADAR_CURRENT = [88, 92, 79, 76, 84, 71];
const RADAR_BEST = [91, 96, 85, 80, 90, 78];

export default function Progress() {
  const router = useRouter();
  return (
    <Screen>
      <Topbar title="Progress & Radar" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>6-Pillar Radar</Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: Colors.cyan }]} /><Text style={styles.legendText}>Current</Text></View>
          <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: Colors.purple }]} /><Text style={styles.legendText}>Personal Best</Text></View>
        </View>
        <RadarChart labels={RADAR_LABELS} current={RADAR_CURRENT} best={RADAR_BEST} />
        <Text style={styles.sectionTitle}>Trend — Rim Speed</Text>
        <PerformanceChart data={[3.2, 3.4, 3.6, 3.7, 3.8, 4.0, 4.1]} label="m/s" color={Colors.cyan} />
        <Text style={styles.sectionTitle}>Trend — Push Cadence</Text>
        <PerformanceChart data={[48, 50, 51, 52, 53, 54, 54]} label="/min" color={Colors.blue} />
        <Text style={styles.sectionTitle}>Trend — Symmetry Ratio</Text>
        <PerformanceChart data={[85, 87, 88, 90, 91, 92, 92]} label="%" color={Colors.green} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 12, marginTop: 4 },
  legend: { flexDirection: 'row', gap: 20, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: Colors.t2, fontSize: 12 },
});
