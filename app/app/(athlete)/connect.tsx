import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import ScoutCard from '../../components/ui/ScoutCard';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth.store';
import { scoutService } from '../../services/scout.service';
import { athleteService } from '../../services/athlete.service';
import { Scout, Coach } from '../../types';

type Tab = 'scouts' | 'coaches';

export default function Connect() {
  const router = useRouter();
  const { tab: initialTab } = useLocalSearchParams<{ tab?: string }>();
  const userId = useAuthStore(s => s.userId);
  const [tab, setTab] = useState<Tab>(initialTab === 'coaches' ? 'coaches' : 'scouts');

  const [scouts, setScouts] = useState<Scout[]>([]);
  const [scoutStatus, setScoutStatus] = useState<Record<string, Scout['status']>>({});
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [coachStatus, setCoachStatus] = useState<Record<string, Coach['status']>>({});

  function loadConnections() {
    if (!userId) return;
    scoutService.getMyScouts(userId).then(mine => {
      const map: Record<string, Scout['status']> = {};
      mine.forEach(s => { map[s.id] = s.status; });
      setScoutStatus(map);
    });
    athleteService.getMyCoaches(userId).then(mine => {
      const map: Record<string, Coach['status']> = {};
      mine.forEach(c => { map[c.id] = c.status; });
      setCoachStatus(map);
    });
  }

  useEffect(() => {
    scoutService.getScouts().then(setScouts);
    athleteService.getCoaches().then(setCoaches);
    loadConnections();
  }, [userId]);

  async function handleConnectScout(scoutId: string) {
    if (!userId) return;
    const ok = await scoutService.connect(userId, scoutId);
    if (ok) setScoutStatus(s => ({ ...s, [scoutId]: 'pending' }));
  }

  async function handleConnectCoach(coachId: string) {
    if (!userId) return;
    const ok = await athleteService.connectCoach(userId, coachId);
    if (ok) setCoachStatus(s => ({ ...s, [coachId]: 'pending' }));
  }

  function openScoutChat(scout: Scout) {
    router.push({ pathname: '/(athlete)/chat', params: { type: 'scout', id: scout.id, name: scout.name } });
  }

  function openCoachChat(coach: Coach) {
    router.push({ pathname: '/(athlete)/chat', params: { type: 'coach', id: coach.id, name: coach.name } });
  }

  return (
    <Screen hasOrbs>
      <Topbar title="Connect" onBack={() => router.back()} />
      <View style={styles.toggleRow}>
        <TouchableOpacity style={[styles.toggleBtn, tab === 'scouts' && styles.toggleBtnActive]} onPress={() => setTab('scouts')}>
          <Text style={[styles.toggleText, tab === 'scouts' && styles.toggleTextActive]}>Scouts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggleBtn, tab === 'coaches' && styles.toggleBtnActive]} onPress={() => setTab('coaches')}>
          <Text style={[styles.toggleText, tab === 'coaches' && styles.toggleTextActive]}>Coaches</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {tab === 'scouts' ? (
          <>
            <Text style={styles.sectionTitle}>Scouts Near You</Text>
            {scouts.length === 0 ? (
              <Text style={styles.emptyText}>No scouts registered yet.</Text>
            ) : (
              scouts.map(s => (
                <ScoutCard
                  key={s.id}
                  scout={{ ...s, status: scoutStatus[s.id] }}
                  onConnect={() => handleConnectScout(s.id)}
                  onMessage={() => openScoutChat(s)}
                />
              ))
            )}
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Coaches</Text>
            {coaches.length === 0 ? (
              <Text style={styles.emptyText}>No coaches registered yet.</Text>
            ) : (
              coaches.map(c => {
                const status = coachStatus[c.id];
                return (
                  <View key={c.id} style={styles.coachCard}>
                    <View style={styles.avatar}>
                      <Text style={styles.monogram}>{c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</Text>
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.name}>{c.name}</Text>
                      <Text style={styles.meta}>{c.federation || 'Independent'}</Text>
                      <Text style={styles.meta2}>{c.sport ? c.sport.replace(/_/g, ' ') : 'Sport not specified'}{c.experience ? ` · ${c.experience}` : ''}</Text>
                    </View>
                    {status === 'accepted' ? (
                      <TouchableOpacity style={styles.messageBtn} onPress={() => openCoachChat(c)}>
                        <Text style={styles.messageBtnText}>Message</Text>
                      </TouchableOpacity>
                    ) : status === 'pending' ? (
                      <View style={styles.pendingBtn}>
                        <Text style={styles.pendingBtnText}>Pending</Text>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.btn} onPress={() => handleConnectCoach(c.id)}>
                        <Text style={styles.btnText}>Connect</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toggleRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 4, marginTop: 4 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  toggleBtnActive: { backgroundColor: Colors.cyan + '20', borderColor: Colors.cyan },
  toggleText: { color: Colors.t2, fontSize: 13, fontWeight: '700' },
  toggleTextActive: { color: Colors.cyan },
  scroll: { padding: 20, paddingBottom: 48 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 12 },
  emptyText: { color: Colors.t3, fontSize: 13, marginBottom: 8 },
  coachCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 14,
    padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, gap: 12,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.blue + '30',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.blue + '50',
  },
  monogram: { color: Colors.blue, fontSize: 15, fontWeight: '800' },
  info: { flex: 1 },
  name: { color: '#fff', fontSize: 13, fontWeight: '700' },
  meta: { color: Colors.t2, fontSize: 11, marginTop: 1 },
  meta2: { color: Colors.t3, fontSize: 10, marginTop: 2 },
  btn: {
    backgroundColor: Colors.blue + '20', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.blue + '50',
  },
  btnConnected: { backgroundColor: Colors.card2, borderColor: Colors.border },
  btnText: { color: Colors.blue, fontSize: 12, fontWeight: '700' },
  pendingBtn: {
    backgroundColor: Colors.orange + '18', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.orange + '40',
  },
  pendingBtnText: { color: Colors.orange, fontSize: 12, fontWeight: '700' },
  messageBtn: {
    backgroundColor: Colors.green + '18', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.green + '40',
  },
  messageBtnText: { color: Colors.green, fontSize: 12, fontWeight: '700' },
});
