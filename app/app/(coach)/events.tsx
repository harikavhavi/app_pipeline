import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import { Colors } from '../../constants/colors';

const EVENTS: { id: string; name: string; date: string; loc: string; rsvp: string }[] = [];

export default function CoachEvents() {
  return (
    <Screen>
      <Topbar title="Event Calendar" right={<TouchableOpacity><Text style={{ color: Colors.blue, fontSize: 12 }}>+ Add</Text></TouchableOpacity>} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {EVENTS.length === 0 && <Text style={styles.emptyText}>No upcoming events yet.</Text>}
        {EVENTS.map(e => (
          <View key={e.id} style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.name}>{e.name}</Text>
              <Text style={[styles.rsvp, { color: e.rsvp === 'Open' ? Colors.green : Colors.t3 }]}>{e.rsvp}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <Ionicons name="calendar-outline" size={12} color={Colors.t2} />
              <Text style={[styles.date, { marginBottom: 0 }]}>{e.date}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 }}>
              <Ionicons name="location-outline" size={12} color={Colors.t2} />
              <Text style={[styles.loc, { marginBottom: 0 }]}>{e.loc}</Text>
            </View>
            {e.rsvp === 'Open' && <TouchableOpacity style={styles.rsvpBtn}><Text style={styles.rsvpText}>RSVP Athletes</Text></TouchableOpacity>}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  card: { backgroundColor: Colors.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  name: { color: '#fff', fontSize: 14, fontWeight: '700', flex: 1 },
  rsvp: { fontSize: 11, fontWeight: '700' },
  date: { color: Colors.t2, fontSize: 12, marginBottom: 4 },
  loc: { color: Colors.t2, fontSize: 12, marginBottom: 10 },
  rsvpBtn: { backgroundColor: Colors.blue + '20', borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: Colors.blue + '40' },
  rsvpText: { color: Colors.blue, fontSize: 12, fontWeight: '700' },
  emptyText: { color: Colors.t3, fontSize: 13 },
});
