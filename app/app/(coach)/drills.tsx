import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import { Colors } from '../../constants/colors';
import { MOCK_DRILLS } from '../../data/mock-drills';

export default function Drills() {
  return (
    <Screen>
      <Topbar title="Drill Planner" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Drill Library</Text>
        {MOCK_DRILLS.length === 0 && <Text style={styles.emptyText}>No drills available yet.</Text>}
        {MOCK_DRILLS.map(d => (
          <View key={d.id} style={styles.drillCard}>
            <View style={styles.drillHeader}>
              <Text style={styles.drillName}>{d.name}</Text>
              <TouchableOpacity style={styles.assignBtn}><Text style={styles.assignText}>Assign</Text></TouchableOpacity>
            </View>
            <Text style={styles.drillDesc}>{d.description}</Text>
            <Text style={styles.drillTarget}>Target: {d.pillar}</Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 12 },
  emptyText: { color: Colors.t3, fontSize: 13, marginBottom: 8 },
  drillCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  drillHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  drillName: { color: '#fff', fontSize: 13, fontWeight: '700', flex: 1 },
  assignBtn: { backgroundColor: Colors.blue + '25', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: Colors.blue + '50' },
  assignText: { color: Colors.blue, fontSize: 11, fontWeight: '700' },
  drillDesc: { color: Colors.t2, fontSize: 12, lineHeight: 18, marginBottom: 4 },
  drillTarget: { color: Colors.t3, fontSize: 10 },
});
