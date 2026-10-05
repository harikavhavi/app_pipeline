import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../../components/layout/Screen';
import Topbar from '../../../components/layout/Topbar';
import FieldInput from '../../../components/auth/FieldInput';
import FieldSelect from '../../../components/auth/FieldSelect';
import Toast from '../../../components/ui/Toast';
import { Colors } from '../../../constants/colors';
import { SPORTS, IPC_CLASSES } from '../../../constants/sports';
import { useAuthStore } from '../../../store/auth.store';
import { authService } from '../../../services/auth.service';

export default function AthleteSignup() {
  const router = useRouter();
  const login = useAuthStore(s => s.login);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', sport: '', ipcClass: '', state: '', dob: '', disability: '', discoverable: true });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, msg: '' });

  function set(key: string, val: string) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSubmit() {
    if (!form.name || !form.email || !form.password || !form.sport) {
      setToast({ visible: true, msg: 'Please fill in all required fields' });
      return;
    }
    setSubmitting(true);
    try {
      const user = await authService.signup({
        name: form.name, email: form.email, password: form.password, role: 'athlete',
        phone: form.phone, sport: form.sport, ipcClass: form.ipcClass,
        state: form.state, dob: form.dob, disability: form.disability, discoverable: form.discoverable,
      });
      login({ role: 'athlete', userId: user.id, userName: user.name, id: user.id, name: user.name, email: user.email });
      router.replace('/(athlete)/home');
    } catch (e: any) {
      setToast({ visible: true, msg: e?.message ?? 'Sign up failed' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen hasOrbs>
      <Topbar title="Athlete Sign Up" onBack={() => router.back()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>Create your athlete profile</Text>

          <FieldInput label="Full Name *" value={form.name} onChangeText={v => set('name', v)} placeholder="Arjun Singh" />
          <FieldInput label="Email *" value={form.email} onChangeText={v => set('email', v)} placeholder="arjun@email.com" keyboardType="email-address" />
          <FieldInput label="Phone" value={form.phone} onChangeText={v => set('phone', v)} placeholder="+91 9876543210" keyboardType="phone-pad" />
          <FieldInput label="Password *" value={form.password} onChangeText={v => set('password', v)} placeholder="Min 8 characters" secureTextEntry />
          <FieldSelect label="Sport *" value={form.sport} options={SPORTS} onSelect={v => set('sport', v)} />
          <FieldSelect label="IPC Classification" value={form.ipcClass} options={IPC_CLASSES} onSelect={v => set('ipcClass', v)} />
          <FieldInput label="State" value={form.state} onChangeText={v => set('state', v)} placeholder="Karnataka" />
          <FieldInput label="Date of Birth" value={form.dob} onChangeText={v => set('dob', v)} placeholder="DD/MM/YYYY" />
          <FieldInput label="Disability Type" value={form.disability} onChangeText={v => set('disability', v)} placeholder="e.g. Spinal Cord Injury" />

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Discoverable by scouts</Text>
            <TouchableOpacity
              style={[styles.toggle, form.discoverable && styles.toggleOn]}
              onPress={() => setForm(f => ({ ...f, discoverable: !f.discoverable }))}
            >
              <View style={[styles.thumb, form.discoverable && styles.thumbOn]} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.btn, { opacity: submitting ? 0.6 : 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }]} onPress={handleSubmit} activeOpacity={0.85} disabled={submitting}>
            <Text style={styles.btnText}>{submitting ? 'Creating account…' : 'Create Account'}</Text>
            {!submitting && <Ionicons name="arrow-forward" size={16} color="#000" />}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.loginLink}>
            <Text style={styles.loginText}>Already have an account? <Text style={{ color: Colors.cyan }}>Log in</Text></Text>
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
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  toggleLabel: { color: Colors.t2, fontSize: 13 },
  toggle: { width: 48, height: 26, borderRadius: 13, backgroundColor: Colors.card2, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', paddingHorizontal: 3 },
  toggleOn: { backgroundColor: Colors.cyan + '30', borderColor: Colors.cyan },
  thumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.t3 },
  thumbOn: { backgroundColor: Colors.cyan, alignSelf: 'flex-end' },
  btn: { backgroundColor: Colors.cyan, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  btnText: { color: '#000', fontSize: 15, fontWeight: '800' },
  loginLink: { alignItems: 'center' },
  loginText: { color: Colors.t2, fontSize: 13 },
});
