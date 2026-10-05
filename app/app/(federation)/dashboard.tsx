import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import { Colors } from '../../constants/colors';

const KPIS: { label: string; value: number; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Total Athletes',     value: 248, icon: 'stats-chart-outline' },
  { label: 'New This Month',     value: 18,  icon: 'add-circle-outline' },
  { label: 'Active Events',      value: 4,   icon: 'calendar-outline' },
  { label: 'Scout Connections',  value: 136, icon: 'people-outline' },
];
const ACTIONS = [['Register Athlete', Colors.orange], ['Publish Event', Colors.blue], ['Review Applications', Colors.purple]];

export default function FederationDashboard() {
  return (
    <Screen hasOrbs>
      <Topbar title="Admin Dashboard" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.kpiGrid}>
          {KPIS.map(({ label, value, icon }) => (
            <View key={label} style={styles.kpiBox}>
              <Ionicons name={icon} size={24} color={Colors.orange} style={styles.kpiIcon} />
              <Text style={styles.kpiVal}>{value}</Text>
              <Text style={styles.kpiLabel}>{label}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        {ACTIONS.map(([label, color]) => (
          <TouchableOpacity key={String(label)} style={[styles.actionBtn, { borderColor: color as string + '40' }]}>
            <Text style={[styles.actionText, { color: color as string }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  kpiBox: { width: '48%', backgroundColor: Colors.card, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  kpiIcon: { fontSize: 24, marginBottom: 6 },
  kpiVal: { fontSize: 28, fontWeight: '900', color: Colors.orange, marginBottom: 2 },
  kpiLabel: { color: Colors.t2, fontSize: 11, textAlign: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 12 },
  actionBtn: { backgroundColor: Colors.card, borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1 },
  actionText: { fontSize: 14, fontWeight: '700' },
});
