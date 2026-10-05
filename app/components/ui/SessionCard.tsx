import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { ScoreRing } from './ScoreRing';

interface SessionCardProps {
  session: {
    id: string;
    date: string;
    sport: string;
    duration: string;
    score?: number;
    topMetric?: string;
  };
  onPress?: () => void;
}

export default function SessionCard({ session, onPress }: SessionCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.left}>
        <Text style={styles.sport}>{session.sport}</Text>
        <Text style={styles.date}>{session.date}</Text>
        <Text style={styles.duration}>{session.duration}</Text>
        {session.topMetric && <Text style={styles.metric}>{session.topMetric}</Text>}
      </View>
      {session.score !== undefined && (
        <ScoreRing score={session.score} size={52} strokeWidth={4} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  left: { flex: 1 },
  sport: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  date: { color: Colors.t2, fontSize: 12, marginBottom: 1 },
  duration: { color: Colors.t3, fontSize: 11 },
  metric: { color: Colors.cyan, fontSize: 11, marginTop: 4 },
});
