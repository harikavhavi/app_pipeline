/**
 * Topbar.tsx
 * App-wide top navigation bar.
 * - Left side: hamburger ☰ menu (opens slide-in drawer) OR back arrow
 * - Center: page title
 * - Right: optional action (label, icon, or custom node)
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useScreenMenu } from './Screen';

interface Props {
  title: string;
  /** Show back arrow instead of hamburger. Default: false (shows hamburger). */
  showBack?: boolean;
  /** Override back handler */
  onBack?: () => void;
  rightLabel?: string;
  onRight?: () => void;
  /** Render a custom element in the right slot */
  right?: React.ReactNode;
  accent?: string;
}

export const Topbar: React.FC<Props> = ({
  title,
  showBack = false,
  onBack,
  rightLabel,
  onRight,
  right,
  accent = Colors.cyan,
}) => {
  const router  = useRouter();
  const { openMenu } = useScreenMenu();

  const handleBack = onBack ?? (() => router.back());
  const showBackBtn = showBack || !!onBack;

  return (
    <View style={styles.bar}>
      {/* Left — hamburger or back */}
      {showBackBtn ? (
        <TouchableOpacity style={styles.btn} onPress={handleBack}>
          <Ionicons name="arrow-back" size={22} color={accent} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.btn} onPress={openMenu}>
          <View style={styles.hamburger}>
            <View style={[styles.hLine, { width: 20 }]} />
            <View style={[styles.hLine, { width: 14 }]} />
            <View style={[styles.hLine, { width: 17 }]} />
          </View>
        </TouchableOpacity>
      )}

      <Text style={styles.title} numberOfLines={1}>{title}</Text>

      {/* Right slot */}
      {right ? (
        <View style={styles.btn}>{right}</View>
      ) : rightLabel ? (
        <TouchableOpacity style={styles.btn} onPress={onRight}>
          <Text style={[styles.rightLabel, { color: accent }]}>{rightLabel}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.btn} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  btn:      { width: 44, alignItems: 'center', justifyContent: 'center' },
  title:    { color: Colors.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.3, flex: 1, textAlign: 'center' },
  rightLabel: { fontSize: 14, fontWeight: '600' },

  hamburger: { gap: 4 },
  hLine:     { height: 2, backgroundColor: Colors.t1, borderRadius: 2 },
});

export default Topbar;
