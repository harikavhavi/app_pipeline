import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth.store';
import { athleteService } from '../../services/athlete.service';
import { SessionRequest } from '../../types';

interface ConnItem { id: string; name: string; status: string; kind: 'scout' | 'coach' }

type Item =
  | { kind: 'session_request'; id: string; data: SessionRequest }
  | { kind: 'connection'; id: string; data: ConnItem };

export default function Notifications() {
  const router = useRouter();
  const userId = useAuthStore(s => s.userId);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      athleteService.getSessionRequests(userId, 'pending'),
      athleteService.getScouts(userId),
      athleteService.getConnectedCoachRequests(userId),
    ]).then(([sessionRequests, scouts, coaches]) => {
      const list: Item[] = [
        ...sessionRequests.map((r): Item => ({ kind: 'session_request', id: r.id, data: r })),
        ...(scouts as any[]).filter(s => s.status === 'pending').map((s): Item => ({
          kind: 'connection', id: `scout_${s.id}`, data: { id: s.id, name: s.name ?? 'A scout', status: s.status, kind: 'scout' },
        })),
        ...(coaches as any[]).filter(c => c.status === 'pending').map((c): Item => ({
          kind: 'connection', id: `coach_${c.id}`, data: { id: c.id, name: c.name ?? 'A coach', status: c.status, kind: 'coach' },
        })),
      ];
      setItems(list);
      setLoading(false);
    });
  }, [userId]);

  function openItem(item: Item) {
    if (item.kind === 'session_request') {
      router.push({
        pathname: '/(athlete)/upload',
        params: { sessionRequestId: item.data.id, requestMessage: item.data.message ?? '' },
      });
    } else {
      router.push({ pathname: '/(athlete)/connect', params: { tab: item.data.kind === 'scout' ? 'scouts' : 'coaches' } });
    }
  }

  return (
    <Screen>
      <Topbar title="Notifications" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.cyan} />
            <Text style={styles.loadingText}>Loading…</Text>
          </View>
        )}

        {!loading && items.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={40} color={Colors.t2} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>You're all caught up</Text>
            <Text style={styles.emptySub}>New session requests and connection requests will show up here</Text>
          </View>
        )}

        {!loading && items.map(item => (
          <TouchableOpacity key={item.id} onPress={() => openItem(item)} activeOpacity={0.75}>
            <View style={[styles.card, { borderLeftColor: item.kind === 'session_request' ? Colors.cyan : Colors.blue, borderLeftWidth: 3 }]}>
              <Ionicons
                name={item.kind === 'session_request' ? 'videocam-outline' : 'people-outline'}
                size={20}
                color={item.kind === 'session_request' ? Colors.cyan : Colors.blue}
                style={styles.icon}
              />
              <View style={styles.info}>
                {item.kind === 'session_request' ? (
                  <>
                    <Text style={styles.title}>Your coach requested a new session</Text>
                    <Text style={styles.body}>{item.data.message || 'Record and upload a new session when you can.'}</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.title}>Connection request</Text>
                    <Text style={styles.body}>{item.data.name} ({item.data.kind}) wants to connect — tap to respond.</Text>
                  </>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 20 },
  loadingText: { color: Colors.t3, fontSize: 13 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { color: Colors.t1, fontSize: 15, fontWeight: '700', marginBottom: 6 },
  emptySub: { color: Colors.t3, fontSize: 12, textAlign: 'center', maxWidth: 260 },
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  icon: { marginTop: 1 },
  info: { flex: 1 },
  title: { color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 3 },
  body: { color: Colors.t2, fontSize: 12, lineHeight: 18 },
});
