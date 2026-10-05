import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface MetricChipProps {
  label: string;
  value: string;
  unit?: string;
  accent?: string;
}

export default function MetricChip({ label, value, unit, accent = Colors.cyan }: MetricChipProps) {
  return (
    <View style={[styles.chip, { borderColor: accent + '30' }]}>
      <Text style={[styles.value, { color: accent }]}>{value}{unit ? <Text style={styles.unit}> {unit}</Text> : null}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: Colors.card2,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    minWidth: 80,
  },
  value: { fontSize: 18, fontWeight: '800' },
  unit: { fontSize: 11, fontWeight: '400' },
  label: { color: Colors.t2, fontSize: 11, marginTop: 4, textAlign: 'center' },
});
