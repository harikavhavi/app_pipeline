import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const TIPS = [
  { icon: 'move-outline' as const, text: 'Position the camera 3-5m to the side of the athlete, not head-on' },
  { icon: 'body-outline' as const, text: 'Keep the full body and wheelchair in frame for the whole session' },
  { icon: 'phone-portrait-outline' as const, text: 'Mount on a tripod or stable surface — avoid handholding' },
  { icon: 'sunny-outline' as const, text: 'Film in good, even lighting — avoid strong backlight' },
];

/**
 * Pre-upload camera-framing advice — collapsed by default so it doesn't
 * compete with the actual upload action for attention (see the app's
 * "keep it clean" UI directive). Tap to expand before filming.
 */
export default function FramingTips() {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.header} onPress={() => setExpanded(e => !e)} activeOpacity={0.7}>
        <Ionicons name="information-circle-outline" size={16} color={Colors.cyan} />
        <Text style={styles.headerText}>Filming tips for best results</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.t3} />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.tips}>
          {TIPS.map((t, i) => (
            <View key={i} style={styles.tipRow}>
              <Ionicons name={t.icon} size={14} color={Colors.t2} style={styles.tipIcon} />
              <Text style={styles.tipText}>{t.text}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: Colors.card, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12 },
  headerText: { flex: 1, color: Colors.t2, fontSize: 12, fontWeight: '600' },
  tips: { paddingHorizontal: 14, paddingBottom: 12, gap: 8 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  tipIcon: { marginTop: 1 },
  tipText: { color: Colors.t3, fontSize: 11, lineHeight: 16, flex: 1 },
});
