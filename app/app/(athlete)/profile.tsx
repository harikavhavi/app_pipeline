import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import SessionCard from '../../components/ui/SessionCard';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth.store';
import { authService } from '../../services/auth.service';
import { athleteService } from '../../services/athlete.service';
import { Session } from '../../types';

export default function AthleteProfile() {
  const router   = useRouter();
  const userName = useAuthStore(s => s.userName);
  const userId   = useAuthStore(s => s.userId);
  const logout   = useAuthStore(s => s.logout);

  async function handleLogout() {
    await authService.logout();
    logout();
    router.replace('/(auth)/role-select');
  }
  const initials = (userName ?? 'A')
    .split(' ').map((w: string) => w[0] ?? '').join('').slice(0, 2).toUpperCase();

  const [sessions, setSessions] = useState<Session[]>([]);
  useEffect(() => {
    athleteService.getSessions(userId ?? 'new').then(setSessions).catch(() => {});
  }, [userId]);

  const scores = sessions.map(s => s.score ?? s.overallScore).filter((n): n is number => typeof n === 'number');
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const bestScore = scores.length ? Math.max(...scores) : null;
  const sportsCount = new Set(sessions.map(s => s.sport)).size;
  const latestSport = sessions[0]?.sport;

  return (
    <Screen hasOrbs>
      <Topbar
        title="My Profile"
        right={
          <TouchableOpacity><Text style={{ color: Colors.cyan, fontSize: 13 }}>Edit</Text></TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}><Text style={styles.monogram}>{initials}</Text></View>
          <Text style={styles.name}>{userName ?? 'Athlete'}</Text>
          {latestSport && (
            <Text style={styles.meta}>{latestSport.replace(/_/g, ' ')}</Text>
          )}
        </View>

        {/* 4-stat grid */}
        <View style={styles.statGrid}>
          {[
            ['Sessions', sessions.length],
            ['Avg Score', avgScore ?? '—'],
            ['Best Score', bestScore ?? '—'],
            ['Sports', sportsCount || '—'],
          ].map(([l, v]) => (
            <View key={String(l)} style={styles.statBox}>
              <Text style={styles.statVal}>{v}</Text>
              <Text style={styles.statLabel}>{l}</Text>
            </View>
          ))}
        </View>

        {/* Recent sessions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sessions</Text>
          <TouchableOpacity onPress={() => router.push('/(athlete)/history')}>
            <Text style={{ color: Colors.cyan, fontSize: 12 }}>View All</Text>
          </TouchableOpacity>
        </View>
        {sessions.slice(0, 4).map(s => (
          <SessionCard
            key={s.id}
            session={{ id: s.id, date: s.date, sport: s.sport, duration: s.duration, score: s.score ?? s.overallScore }}
            onPress={() => router.push('/(athlete)/dashboard')}
          />
        ))}
        {sessions.length === 0 && (
          <Text style={{ color: Colors.t3, fontSize: 12, textAlign: 'center', paddingVertical: 16 }}>No sessions yet — upload a video to get started</Text>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  avatarWrap: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.cyan + '25', borderWidth: 2, borderColor: Colors.cyan, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  monogram: { color: Colors.cyan, fontSize: 28, fontWeight: '900' },
  name: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  meta: { color: Colors.t2, fontSize: 13, marginBottom: 12, textTransform: 'capitalize' },
  statGrid: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '800', color: Colors.cyan },
  statLabel: { fontSize: 10, color: Colors.t3, marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 10, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  logoutBtn: { alignItems: 'center', paddingVertical: 16, marginTop: 12, borderRadius: 14, borderWidth: 1, borderColor: Colors.red + '40', backgroundColor: Colors.red + '10' },
  logoutText: { color: Colors.red, fontSize: 14, fontWeight: '700' },
});
