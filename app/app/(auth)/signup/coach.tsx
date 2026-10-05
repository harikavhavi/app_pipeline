import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
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

const EXPERIENCE = ['< 1 year', '1–3 years', '3–5 years', '5–10 years', '10+ years'];
const FEDERATIONS = ['Paralympic Committee of India', 'IWAS', 'IPC', 'State Body', 'Independent'];

export default function CoachSignup() {
  const router = useRouter();
  const login = useAuthStore(s => s.login);
  const [form, setForm] = useState({ name: '', email: '', password: '', sport: '', experience: '', federation: '', certification: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, msg: '' });

  function set(key: string, val: string) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSubmit() {
    if (!form.name || !form.email || !form.password) {
      setToast({ visible: true, msg: 'Please fill in all required fields' });
      return;
    }
    setSubmitting(true);
    try {
      const user = await authService.signup({
        name: form.name, email: form.email, password: form.password, role: 'coach',
        sport: form.sport, experience: form.experience, federation: form.federation, certification: form.certification,
      });
      login({ ...user, role: 'coach', userId: user.id, userName: user.name });
      router.replace('/(coach)/home');
    } catch (e: any) {
      setToast({ visible: true, msg: e?.message ?? 'Sign up failed' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen hasOrbs>
      <Topbar title="Coach Sign Up" onBack={() => router.back()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>Register as a para-sport coach</Text>
          <FieldInput label="Full Name *" value={form.name} onChangeText={v => set('name', v)} placeholder="Coach Ramesh" />
          <FieldInput label="Email *" value={form.email} onChangeText={v => set('email', v)} placeholder="coach@email.com" keyboardType="email-address" />
          <FieldInput label="Password *" value={form.password} onChangeText={v => set('password', v)} placeholder="Min 8 characters" secureTextEntry />
          <FieldSelect label="Sport Specialization" value={form.sport} options={SPORTS} onSelect={v => set('sport', v)} />
          <FieldSelect label="Years of Experience" value={form.experience} options={EXPERIENCE} onSelect={v => set('experience', v)} />
          <FieldSelect label="Federation (Optional)" value={form.federation} options={FEDERATIONS} onSelect={v => set('federation', v)} />
          <FieldInput label="Certification / Credential" value={form.certification} onChangeText={v => set('certification', v)} placeholder="IPC Level 2, NIS, etc." />

          <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.blue, opacity: submitting ? 0.6 : 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }]} onPress={handleSubmit} activeOpacity={0.85} disabled={submitting}>
            <Text style={styles.btnText}>{submitting ? 'Creating account…' : 'Create Coach Account'}</Text>
            {!submitting && <Ionicons name="arrow-forward" size={16} color="#fff" />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.loginLink}>
            <Text style={styles.loginText}>Already have an account? <Text style={{ color: Colors.blue }}>Log in</Text></Text>
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
  loginLink: { alignItems: 'center' },
  loginText: { color: Colors.t2, fontSize: 13 },
});
