import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth.store';
import { athleteService } from '../../services/athlete.service';
import { Coach } from '../../types';

export default function MyCoach() {
  const router = useRouter();
  const userId = useAuthStore(s => s.userId);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    athleteService.getMyCoaches(userId).then(data => { setCoaches(data); setLoading(false); });
  }, [userId]);

  return (
    <Screen>
      <Topbar
        title="My Coach"
        onBack={() => router.back()}
        right={
          <TouchableOpacity onPress={() => router.push({ pathname: '/(athlete)/connect', params: { tab: 'coaches' } })}>
            <Text style={{ color: Colors.blue, fontSize: 12 }}>+ Find Coach</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {!loading && coaches.length === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="school-outline" size={44} color={Colors.t2} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No coach connected yet</Text>
            <Text style={styles.emptySub}>Browse the coach network to connect with a para-sport coach</Text>
            <TouchableOpacity style={[styles.emptyBtn, { flexDirection: 'row', alignItems: 'center', gap: 6 }]} onPress={() => router.push({ pathname: '/(athlete)/connect', params: { tab: 'coaches' } })}>
              <Text style={styles.emptyBtnText}>Find a Coach</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        {coaches.map(coach => (
          <View key={coach.id} style={styles.coachCard}>
            <View style={styles.avatar}><Text style={styles.monogram}>{coach.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</Text></View>
            <View>
              <Text style={styles.coachName}>{coach.name}</Text>
              <Text style={styles.coachOrg}>{coach.federation || 'Independent'}</Text>
              <Text style={styles.coachSpec}>{coach.sport ? coach.sport.replace(/_/g, ' ') : 'Sport not specified'}{coach.experience ? ` · ${coach.experience}` : ''}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  coachCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: Colors.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.blue + '30', borderWidth: 1.5, borderColor: Colors.blue, alignItems: 'center', justifyContent: 'center' },
  monogram: { color: Colors.blue, fontSize: 20, fontWeight: '800' },
  coachName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  coachOrg: { color: Colors.t2, fontSize: 12 },
  coachSpec: { color: Colors.t3, fontSize: 11, marginTop: 2 },
  emptyCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  emptyIcon: { fontSize: 44, marginBottom: 14 },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptySub: { color: Colors.t3, fontSize: 12, textAlign: 'center', marginBottom: 18 },
  emptyBtn: { backgroundColor: Colors.blue, borderRadius: 10, paddingHorizontal: 22, paddingVertical: 10 },
  emptyBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
