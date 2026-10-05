import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FramingFeedback } from '../../types';

/**
 * Warns the athlete when the footage's camera framing made metrics
 * unreliable (see pipeline api.py _framing_feedback(), thresholded on
 * pose_confidence_avg). Only rendered for 'partial'/'poor' quality — a
 * well-filmed session shows nothing here, so this never clutters the
 * common case.
 */
export default function FramingWarningCard({ framing }: { framing?: FramingFeedback | null }) {
  if (!framing || framing.quality === 'good' || !framing.message) return null;
  const isPoor = framing.quality === 'poor';

  return (
    <View style={[styles.card, { borderColor: isPoor ? Colors.red + '55' : Colors.yellow + '55' }]}>
      <View style={styles.header}>
        <Ionicons name="videocam-outline" size={16} color={isPoor ? Colors.red : Colors.yellow} />
        <Text style={[styles.title, { color: isPoor ? Colors.red : Colors.yellow }]}>
          {isPoor ? 'Camera positioning issue' : 'Partial visibility'}
        </Text>
      </View>
      <Text style={styles.message}>{framing.message}</Text>
      {framing.tips.map((tip, i) => (
        <View key={i} style={styles.tipRow}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  title: { fontSize: 13, fontWeight: '700' },
  message: { color: Colors.t2, fontSize: 12, lineHeight: 18, marginBottom: 8 },
  tipRow: { flexDirection: 'row', gap: 6, marginBottom: 3 },
  tipBullet: { color: Colors.t3, fontSize: 12 },
  tipText: { color: Colors.t3, fontSize: 11, lineHeight: 16, flex: 1 },
});
