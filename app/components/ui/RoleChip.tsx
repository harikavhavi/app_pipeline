import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, RoleAccent } from '../../constants/colors';

interface RoleChipProps {
  role: string;
  sport?: string;
  ipcClass?: string;
}

export default function RoleChip({ role, sport, ipcClass }: RoleChipProps) {
  const accent = RoleAccent[role] ?? Colors.t2;
  return (
    <View style={styles.row}>
      <View style={[styles.chip, { borderColor: accent + '40', backgroundColor: accent + '15' }]}>
        <Text style={[styles.label, { color: accent }]}>{role.toUpperCase()}</Text>
      </View>
      {sport && (
        <View style={[styles.chip, { borderColor: Colors.border }]}>
          <Text style={styles.label2}>{sport}</Text>
        </View>
      )}
      {ipcClass && (
        <View style={[styles.chip, { borderColor: Colors.border }]}>
          <Text style={styles.label2}>{ipcClass}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  label2: { fontSize: 10, color: Colors.t2 },
});
