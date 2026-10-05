import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/layout/Screen';
import GridBackground from '../../components/layout/GridBackground';
import { Colors } from '../../constants/colors';

export default function SignupWall() {
  const router = useRouter();
  return (
    <Screen>
      <GridBackground />
      <View style={styles.content}>
        <Ionicons name="trophy-outline" size={56} color={Colors.orange} style={styles.icon} />
        <Text style={styles.title}>You've explored 5 athlete profiles</Text>
        <Text style={styles.body}>Sign up to connect with athletes, access full biomechanics reports, and join the ParaSync network.</Text>
        <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.cyan, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }]} onPress={() => router.push('/(auth)/signup/athlete' as any)}>
          <Text style={[styles.btnText, { color: '#000' }]}>I'm an Athlete</Text>
          <Ionicons name="arrow-forward" size={15} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.purple, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }]} onPress={() => router.push('/(auth)/signup/scout' as any)}>
          <Text style={styles.btnText}>I'm a Scout</Text>
          <Ionicons name="arrow-forward" size={15} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.blue, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }]} onPress={() => router.push('/(auth)/signup/coach' as any)}>
          <Text style={styles.btnText}>I'm a Coach</Text>
          <Ionicons name="arrow-forward" size={15} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backText}>Continue browsing</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 32, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 12 },
  body: { color: Colors.t2, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  btn: { borderRadius: 14, paddingVertical: 14, width: '100%', alignItems: 'center', marginBottom: 10 },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  backLink: { marginTop: 8 },
  backText: { color: Colors.t3, fontSize: 13 },
});
