import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/layout/Screen';
import GridBackground from '../../components/layout/GridBackground';
import { Colors } from '../../constants/colors';

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }[] = [
  { icon: 'videocam-outline',    title: 'Video-only',  desc: 'No wearables needed' },
  { icon: 'stats-chart-outline', title: '57 metrics',  desc: 'Across 14 pillars' },
  { icon: 'search-outline',      title: 'Scout ready',  desc: 'Connect with scouts' },
];

export default function GuestLanding() {
  const router = useRouter();
  return (
    <Screen>
      <GridBackground />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.logo}>PS</Text>
        <Text style={styles.tagline}>ParaSync</Text>
        <Text style={styles.sub}>AI-powered biomechanics platform for para-athletes. 57 metrics. Real insight. No hardware.</Text>
        <TouchableOpacity style={[styles.primaryBtn, { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }]} onPress={() => router.push('/(guest)/showcase')} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Browse Athletes</Text>
          <Ionicons name="arrow-forward" size={16} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(auth)/role-select')} activeOpacity={0.85}>
          <Text style={styles.secondaryBtnText}>Sign Up Free</Text>
        </TouchableOpacity>
        <View style={styles.features}>
          {FEATURES.map(({ icon, title, desc }) => (
            <View key={title} style={styles.feature}>
              <Ionicons name={icon} size={24} color={Colors.cyan} style={styles.featureIcon} />
              <Text style={styles.featureTitle}>{title}</Text>
              <Text style={styles.featureDesc}>{desc}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 32, paddingTop: 80, paddingBottom: 60, alignItems: 'center' },
  logo: { fontSize: 48, fontWeight: '900', color: Colors.cyan, marginBottom: 8 },
  tagline: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 16, textAlign: 'center' },
  sub: { color: Colors.t2, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 36, maxWidth: 300 },
  primaryBtn: { backgroundColor: Colors.cyan, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 40, marginBottom: 12, width: '100%', alignItems: 'center' },
  primaryBtnText: { color: '#000', fontSize: 15, fontWeight: '800' },
  secondaryBtn: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card },
  secondaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  features: { flexDirection: 'row', gap: 10, marginTop: 40, width: '100%' },
  feature: { flex: 1, backgroundColor: Colors.card, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  featureIcon: { fontSize: 24, marginBottom: 6 },
  featureTitle: { color: Colors.cyan, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  featureDesc: { color: Colors.t3, fontSize: 10, textAlign: 'center' },
});
