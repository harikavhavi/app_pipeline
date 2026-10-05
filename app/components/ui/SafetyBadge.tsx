import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/colors";

type Level = "clear" | "monitor" | "risk" | "LOW" | "MED" | "HIGH";
const COLORS: Record<string, string> = {
  clear: Colors.green, monitor: Colors.yellow, risk: Colors.red,
  LOW: Colors.green, MED: Colors.yellow, HIGH: Colors.red,
};
const LABELS: Record<string, string> = {
  clear: "CLEAR", monitor: "MONITOR", risk: "AT RISK",
  LOW: "LOW", MED: "MEDIUM", HIGH: "HIGH",
};

interface Props {
  level: Level;
  /** When true, renders a smaller pill with no dot */
  compact?: boolean;
  style?: import('react-native').ViewStyle;
}

export const SafetyBadge: React.FC<Props> = ({ level, compact = false, style }) => (
  <View style={[
    styles.badge,
    { backgroundColor: `${COLORS[level]}22`, borderColor: `${COLORS[level]}66` },
    compact && styles.compact,
    style,
  ]}>
    {!compact && <View style={[styles.dot, { backgroundColor: COLORS[level] }]} />}
    <Text style={[styles.label, { color: COLORS[level] }, compact && styles.compactLabel]}>
      {LABELS[level] ?? level}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  compact: { paddingHorizontal: 7, paddingVertical: 3 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  label: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  compactLabel: { fontSize: 10 },
});

export default SafetyBadge;
