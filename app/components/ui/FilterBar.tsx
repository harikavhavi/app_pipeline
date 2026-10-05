import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

type FilterOption = string | { id: string; label: string };
function optId(o: FilterOption): string { return typeof o === 'string' ? o : o.id; }
function optLabel(o: FilterOption): string { return typeof o === 'string' ? o : o.label; }

interface FilterBarProps {
  filters: FilterOption[];
  active: string;
  onSelect: (f: string) => void;
  accent?: string;
}

export default function FilterBar({ filters, active, onSelect, accent = Colors.cyan }: FilterBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {filters.map(f => {
        const id = optId(f);
        const label = optLabel(f);
        return (
          <TouchableOpacity
            key={id}
            style={[styles.chip, active === id && { backgroundColor: accent + '25', borderColor: accent }]}
            onPress={() => onSelect(id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.label, active === id && { color: accent }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 20, gap: 8, paddingVertical: 4 },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  label: { color: Colors.t2, fontSize: 12, fontWeight: '600' },
});
