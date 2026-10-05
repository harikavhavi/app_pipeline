import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

type Option = string | { id: string; label: string };

interface FieldSelectProps {
  label: string;
  value: string;
  options: Option[];
  onSelect: (value: string) => void;
  placeholder?: string;
}

function optId(o: Option): string { return typeof o === 'string' ? o : o.id; }
function optLabel(o: Option): string { return typeof o === 'string' ? o : o.label; }

export default function FieldSelect({ label, value, options, onSelect, placeholder = 'Select...' }: FieldSelectProps) {
  const [open, setOpen] = React.useState(false);

  const displayLabel = options.find(o => optId(o) === value);
  const displayText = displayLabel ? optLabel(displayLabel) : value;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.selector} onPress={() => setOpen(o => !o)} activeOpacity={0.8}>
        <Text style={displayText ? styles.value : styles.placeholder}>{displayText || placeholder}</Text>
        <Text style={styles.arrow}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdown}>
          {options.map(opt => (
            <TouchableOpacity
              key={optId(opt)}
              style={[styles.option, value === optId(opt) && styles.optionActive]}
              onPress={() => { onSelect(optId(opt)); setOpen(false); }}
            >
              <Text style={[styles.optionText, value === optId(opt) && { color: Colors.cyan }]}>{optLabel(opt)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: { color: Colors.t2, fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  selector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.card, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  value: { color: '#fff', fontSize: 14 },
  placeholder: { color: Colors.t3, fontSize: 14 },
  arrow: { color: Colors.t2, fontSize: 10 },
  dropdown: {
    backgroundColor: Colors.card2, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    marginTop: 4, maxHeight: 200, overflow: 'hidden',
  },
  option: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  optionActive: { backgroundColor: Colors.cyan + '15' },
  optionText: { color: Colors.t2, fontSize: 13 },
});
