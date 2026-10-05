import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../../components/layout/Screen';
import Topbar from '../../../components/layout/Topbar';
import { Colors } from '../../../constants/colors';
import { MOCK_ATHLETES } from '../../../data/mock-athletes';

export default function GuestAthleteProfile() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const athlete = MOCK_ATHLETES.find(a => a.id === id) ?? MOCK_ATHLETES[0];

  return (
    <Screen>
      <Topbar title={athlete.name} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.avatar}><Text style={styles.monogram}>{athlete.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}</Text></View>
          <Text style={styles.name}>{athlete.name}</Text>
          <Text style={styles.meta}>{athlete.sport} · {athlete.ipcClass} · {athlete.state}</Text>
        </View>
        {[['Best Score', `${athlete.bestScore ?? 88}/100`], ['Sessions', athlete.sessions ?? 24], ['Sport', athlete.sport], ['IPC Class', athlete.ipcClass]].map(([l, v]) => (
          <View key={String(l)} style={styles.row}><Text style={styles.label}>{l}</Text><Text style={styles.value}>{v}</Text></View>
        ))}
        <View style={styles.banner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Ionicons name="lock-closed-outline" size={13} color={Colors.t2} />
            <Text style={[styles.bannerText, { marginBottom: 0, flex: 1 }]}>Full biomechanics report available to registered scouts</Text>
          </View>
          <TouchableOpacity style={[styles.joinBtn, { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }]} onPress={() => router.push('/(auth)/role-select')}>
            <Text style={styles.joinBtnText}>Join ParaSync to connect</Text>
            <Ionicons name="arrow-forward" size={14} color="#000" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  hero: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.card2, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  monogram: { color: Colors.t2, fontSize: 26, fontWeight: '900' },
  name: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  meta: { color: Colors.t2, fontSize: 13 },
  row: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.card, borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  label: { color: Colors.t2, fontSize: 13 },
  value: { color: '#fff', fontSize: 13, fontWeight: '600' },
  banner: { backgroundColor: Colors.cyan + '15', borderRadius: 14, padding: 16, marginTop: 16, borderWidth: 1, borderColor: Colors.cyan + '30' },
  bannerText: { color: Colors.t2, fontSize: 12, marginBottom: 12 },
  joinBtn: { backgroundColor: Colors.cyan, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  joinBtnText: { color: '#000', fontSize: 13, fontWeight: '800' },
});
