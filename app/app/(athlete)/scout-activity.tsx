import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import { Colors } from '../../constants/colors';

const ACTIVITY = [
  { id: '1', scout: 'Rajesh Kumar', org: 'Paralympic Scouts India', action: 'viewed your profile', time: '2h ago', type: 'view' },
  { id: '2', scout: 'Maria Santos', org: 'IWAS', action: 'sent a connection request', time: '5h ago', type: 'request' },
  { id: '3', scout: 'Anil Mehta', org: 'State Sports Authority', action: 'shortlisted you', time: '1d ago', type: 'shortlist' },
  { id: '4', scout: 'Priya Nair', org: 'National Paralympic Committee', action: 'viewed your profile', time: '2d ago', type: 'view' },
  { id: '5', scout: 'James Wilson', org: 'British Paralympic Association', action: 'sent a connection request', time: '3d ago', type: 'request' },
];

const TYPE_COLOR: Record<string, string> = { view: Colors.cyan, request: Colors.purple, shortlist: Colors.orange };
const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = { view: 'eye-outline', request: 'people-outline', shortlist: 'star-outline' };

export default function ScoutActivity() {
  const router = useRouter();
  return (
    <Screen>
      <Topbar title="Scout Activity" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {ACTIVITY.map(a => (
          <View key={a.id} style={styles.card}>
            <Ionicons name={TYPE_ICON[a.type]} size={22} color={TYPE_COLOR[a.type]} style={styles.icon} />
            <View style={styles.info}>
              <Text style={styles.scout}>{a.scout}</Text>
              <Text style={styles.org}>{a.org}</Text>
              <Text style={styles.action}><Text style={{ color: TYPE_COLOR[a.type] }}>{a.action}</Text></Text>
              <Text style={styles.time}>{a.time}</Text>
            </View>
            {a.type === 'request' && (
              <View style={styles.actions}>
                <TouchableOpacity style={styles.acceptBtn}><Text style={styles.acceptText}>Accept</Text></TouchableOpacity>
                <TouchableOpacity style={styles.declineBtn}><Text style={styles.declineText}>Decline</Text></TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  icon: { fontSize: 22, marginTop: 2 },
  info: { flex: 1 },
  scout: { color: '#fff', fontSize: 13, fontWeight: '700' },
  org: { color: Colors.t2, fontSize: 11, marginBottom: 2 },
  action: { fontSize: 12, color: Colors.t2, marginBottom: 2 },
  time: { color: Colors.t3, fontSize: 10 },
  actions: { flexDirection: 'column', gap: 6 },
  acceptBtn: { backgroundColor: Colors.green + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: Colors.green + '40' },
  acceptText: { color: Colors.green, fontSize: 11, fontWeight: '700' },
  declineBtn: { backgroundColor: Colors.red + '15', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: Colors.red + '30' },
  declineText: { color: Colors.red, fontSize: 11, fontWeight: '700' },
});
