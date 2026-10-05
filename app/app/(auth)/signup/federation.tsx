import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../../components/layout/Screen';
import Topbar from '../../../components/layout/Topbar';
import FieldInput from '../../../components/auth/FieldInput';
import FieldSelect from '../../../components/auth/FieldSelect';
import { Colors } from '../../../constants/colors';
import { SPORTS } from '../../../constants/sports';
import { useAuthStore } from '../../../store/auth.store';
import { authService } from '../../../services/auth.service';
import Toast from '../../../components/ui/Toast';

const FED_TYPES = ['National Paralympic Committee', 'State Sports Authority', 'International Federation', 'Club / Academy'];

export default function FederationSignup() {
  const router = useRouter();
  const login = useAuthStore(s => s.login);
  const [form, setForm] = useState({ orgName: '', contact: '', email: '', type: '', sport: '', regNumber: '' });
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState({ visible: false, msg: '' });

  function set(key: string, val: string) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSubmit() {
    if (!form.orgName || !form.contact || !form.email) {
      setToast({ visible: true, msg: 'Please fill in all required fields' }); return;
    }
    // Federation accounts don't set a password on this form — generate a placeholder
    // the org can reset later (there's no reset flow yet, but this keeps signup real).
    try {
      const user = await authService.signup({
        name: form.contact, email: form.email, password: `${form.email}-${Date.now()}`, role: 'federation',
        sport: form.sport, orgName: form.orgName, type: form.type, regNumber: form.regNumber,
      });
      setSubmitted(true);
      setTimeout(() => {
        login({ role: 'federation', userId: user.id, userName: form.orgName, id: user.id, name: form.orgName, email: user.email });
        router.replace('/(federation)/dashboard');
      }, 2000);
    } catch (e: any) {
      setToast({ visible: true, msg: e?.message ?? 'Submission failed' });
    }
  }

  if (submitted) return (
    <Screen hasOrbs>
      <View style={styles.successBox}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successTitle}>Application Submitted</Text>
        <Text style={styles.successBody}>Your federation application is under review. Our team will contact you within 2–3 business days.</Text>
      </View>
    </Screen>
  );

  return (
    <Screen hasOrbs>
      <Topbar title="Federation Sign Up" onBack={() => router.back()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>Register your federation or governing body</Text>
          <FieldInput label="Organization Name *" value={form.orgName} onChangeText={v => set('orgName', v)} placeholder="Paralympic Committee of India" />
          <FieldInput label="Contact Person *" value={form.contact} onChangeText={v => set('contact', v)} placeholder="Name of admin" />
          <FieldInput label="Official Email *" value={form.email} onChangeText={v => set('email', v)} placeholder="admin@federation.org" keyboardType="email-address" />
          <FieldSelect label="Federation Type" value={form.type} options={FED_TYPES} onSelect={v => set('type', v)} />
          <FieldSelect label="Primary Sport" value={form.sport} options={SPORTS} onSelect={v => set('sport', v)} />
          <FieldInput label="Registration Number" value={form.regNumber} onChangeText={v => set('regNumber', v)} placeholder="GOV/2024/XXXX" />

          <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.orange, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }]} onPress={handleSubmit} activeOpacity={0.85}>
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
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  successBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  successIcon: { fontSize: 64, color: Colors.green, marginBottom: 16 },
  successTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 12 },
  successBody: { color: Colors.t2, fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
