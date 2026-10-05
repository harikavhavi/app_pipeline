import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import { Colors } from '../../constants/colors';

const EVENTS = [
  { id: '1', name: 'National Selection Trials', date: 'Sep 12, 2026', loc: 'New Delhi', rsvps: 42, capacity: 60 },
  { id: '2', name: 'State Championship Karnatka', date: 'Oct 5, 2026', loc: 'Bengaluru', rsvps: 28, capacity: 40 },
  { id: '3', name: 'Asian Para Games Qualifier', date: 'Nov 20, 2026', loc: 'Hyderabad', rsvps: 18, capacity: 25 },
];

export default function FederationEvents() {
  return (
    <Screen>
      <Topbar title="Event Management" right={
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Ionicons name="add-outline" size={14} color={Colors.orange} />
          <Text style={{ color: Colors.orange, fontSize: 12 }}>Publish</Text>
        </TouchableOpacity>
      } />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {EVENTS.map(e => (
          <View key={e.id} style={styles.card}>
            <Text style={styles.name}>{e.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 }}>
              <Ionicons name="calendar-outline" size={11} color={Colors.t2} />
              <Text style={[styles.date, { marginBottom: 0 }]}>{e.date}</Text>
              <Text style={{ color: Colors.t2, fontSize: 12 }}>·</Text>
              <Ionicons name="location-outline" size={11} color={Colors.t2} />
              <Text style={[styles.date, { marginBottom: 0 }]}>{e.loc}</Text>
            </View>
            <View style={styles.rsvpRow}>
              <Text style={styles.rsvpLabel}>RSVPs</Text>
              <View style={styles.rsvpBar}><View style={[styles.rsvpFill, { width: `${(e.rsvps / e.capacity) * 100}%` }]} /></View>
              <Text style={styles.rsvpCount}>{e.rsvps}/{e.capacity}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionText}>Manage</Text></TouchableOpacity>
              <TouchableOpacity style={styles.resultsBtn}><Text style={styles.resultsText}>Publish Results</Text></TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  card: { backgroundColor: Colors.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  name: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  date: { color: Colors.t2, fontSize: 12, marginBottom: 12 },
  rsvpRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  rsvpLabel: { color: Colors.t3, fontSize: 11, width: 40 },
  rsvpBar: { flex: 1, height: 6, backgroundColor: Colors.card2, borderRadius: 3, overflow: 'hidden' },
  rsvpFill: { height: '100%', backgroundColor: Colors.orange, borderRadius: 3 },
  rsvpCount: { color: Colors.orange, fontSize: 11, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, backgroundColor: Colors.orange + '20', borderRadius: 8, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: Colors.orange + '40' },
  actionText: { color: Colors.orange, fontSize: 11, fontWeight: '700' },
  resultsBtn: { flex: 1, backgroundColor: Colors.card2, borderRadius: 8, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  resultsText: { color: Colors.t2, fontSize: 11, fontWeight: '700' },
});
