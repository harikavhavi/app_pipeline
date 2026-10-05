import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface VideoThumbProps {
  video: {
    id: string;
    filename: string;
    sport: string;
    date: string;
    score?: number;
    duration?: string;
  };
  onViewAnalysis?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
}

export default function VideoThumb({ video, onViewAnalysis, onShare, onDelete }: VideoThumbProps) {
  return (
    <View style={styles.card}>
      <View style={styles.thumb}>
        <Ionicons name="film-outline" size={28} color={Colors.t3} />
        {video.duration && <Text style={styles.duration}>{video.duration}</Text>}
      </View>
      <View style={styles.info}>
        <Text style={styles.filename} numberOfLines={1}>{video.filename}</Text>
        <Text style={styles.meta}>{video.sport} · {video.date}</Text>
        {video.score !== undefined && (
          <Text style={styles.score}>Score <Text style={{ color: Colors.cyan }}>{video.score}</Text>/100</Text>
        )}
        <View style={styles.actions}>
          {onViewAnalysis && (
            <TouchableOpacity style={styles.btn} onPress={onViewAnalysis}>
              <Text style={styles.btnText}>Analysis</Text>
            </TouchableOpacity>
          )}
          {onShare && (
            <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={onShare}>
              <Text style={[styles.btnText, { color: Colors.t2 }]}>Share</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={onDelete}>
              <Text style={[styles.btnText, { color: Colors.red }]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thumb: {
    width: 90,
    backgroundColor: Colors.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbIcon: { fontSize: 28 },
  duration: { color: Colors.t3, fontSize: 10, marginTop: 4 },
  info: { flex: 1, padding: 12 },
  filename: { color: '#fff', fontSize: 13, fontWeight: '600', marginBottom: 3 },
  meta: { color: Colors.t2, fontSize: 11, marginBottom: 4 },
  score: { color: Colors.t2, fontSize: 11, marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: {
    backgroundColor: Colors.cyan + '20',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.cyan + '40',
  },
  btnSecondary: { backgroundColor: Colors.card2, borderColor: Colors.border },
  btnDanger: { backgroundColor: Colors.red + '15', borderColor: Colors.red + '30' },
  btnText: { color: Colors.cyan, fontSize: 11, fontWeight: '600' },
});
