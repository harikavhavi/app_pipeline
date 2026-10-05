import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../../components/layout/Screen';
import Topbar from '../../../components/layout/Topbar';
import FieldInput from '../../../components/auth/FieldInput';
import FieldSelect from '../../../components/auth/FieldSelect';
import Toast from '../../../components/ui/Toast';
import { Colors } from '../../../constants/colors';
import { SPORTS } from '../../../constants/sports';
import { useAuthStore } from '../../../store/auth.store';
import { authService } from '../../../services/auth.service';

const SCOUT_ROLES = ['Talent Scout', 'Performance Analyst', 'Team Manager', 'Federation Representative'];
const LEVELS = ['Club', 'State', 'National', 'International'];

export default function ScoutSignup() {
  const router = useRouter();
  const login = useAuthStore(s => s.login);
  const [form, setForm] = useState({ name: '', email: '', password: '', org: '', role: '', sport: '', level: '' });
  const [toast, setToast] = useState({ visible: false, msg: '' });
  const [submitted, setSubmitted] = useState(false);

  function set(key: string, val: string) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSubmit() {
    if (!form.name || !form.email || !form.password) {
      setToast({ visible: true, msg: 'Please fill in all required fields' }); return;
    }
    try {
      const user = await authService.signup({
        name: form.name, email: form.email, password: form.password, role: 'scout',
        sport: form.sport, org: form.org, scoutRole: form.role, level: form.level,
      });
      setSubmitted(true);
      setTimeout(() => {
        login({ role: 'scout', userId: user.id, userName: user.name, id: user.id, name: user.name, email: user.email });
        router.replace('/(scout)/home');
      }, 1800);
    } catch (e: any) {
      setToast({ visible: true, msg: e?.message ?? 'Sign up failed' });
    }
  }

  if (submitted) return (
    <Screen hasOrbs>
      <Text style={styles.pendingTitle}>Verification Pending</Text>
      <Text style={styles.pendingBody}>Your scout account is under review. You'll be notified within 24 hours.</Text>
    </Screen>
  );

  return (
    <Screen hasOrbs>
      <Topbar title="Scout Sign Up" onBack={() => router.back()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>Register as a talent scout</Text>
          <FieldInput label="Full Name *" value={form.name} onChangeText={v => set('name', v)} placeholder="Scout Name" />
          <FieldInput label="Email *" value={form.email} onChangeText={v => set('email', v)} placeholder="scout@org.com" keyboardType="email-address" />
          <FieldInput label="Password *" value={form.password} onChangeText={v => set('password', v)} placeholder="Min 8 characters" secureTextEntry />
          <FieldInput label="Organization" value={form.org} onChangeText={v => set('org', v)} placeholder="Paralympic Scouts India" />
          <FieldSelect label="Scout Role" value={form.role} options={SCOUT_ROLES} onSelect={v => set('role', v)} />
          <FieldSelect label="Sports Covered" value={form.sport} options={SPORTS} onSelect={v => set('sport', v)} />
          <FieldSelect label="Level" value={form.level} options={LEVELS} onSelect={v => set('level', v)} />

          <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.purple, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }]} onPress={handleSubmit} activeOpacity={0.85}>
            <Text style={styles.btnText}>Submit Application</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast message={toast.msg} visible={toast.visible} onHide={() => setToast(t => ({ ...t, visible: false }))} type="warn" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 24, paddingBottom: 48 },
  subtitle: { color: Colors.t2, fontSize: 14, marginBottom: 24 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  pendingTitle: { color: Colors.purple, fontSize: 22, fontWeight: '800', textAlign: 'center', marginTop: 120, marginBottom: 16 },
  pendingBody: { color: Colors.t2, fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
});
