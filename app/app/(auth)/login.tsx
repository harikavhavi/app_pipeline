import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/layout/Screen';
import GridBackground from '../../components/layout/GridBackground';
import FieldInput from '../../components/auth/FieldInput';
import FieldSelect from '../../components/auth/FieldSelect';
import Toast from '../../components/ui/Toast';
import { Colors, RoleAccent } from '../../constants/colors';
import { useAuthStore } from '../../store/auth.store';
import { authService } from '../../services/auth.service';

const ROLES = ['athlete', 'coach', 'scout', 'federation'] as const;
type Role = typeof ROLES[number];

export default function Login() {
  const router = useRouter();
  const login = useAuthStore(s => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('athlete');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, msg: '' });

  const ROLE_ROUTES: Record<Role, string> = {
    athlete: '/(athlete)/home',
    coach: '/(coach)/home',
    scout: '/(scout)/home',
    federation: '/(federation)/dashboard',
  };

  async function handleLogin() {
    if (!email || !password) {
      setToast({ visible: true, msg: 'Enter your email and password' }); return;
    }
    setSubmitting(true);
    try {
      const user = await authService.login(email, password, role);
      login({ ...user, role, userId: user.id, userName: user.name });
      router.replace(ROLE_ROUTES[role] as any);
    } catch (e: any) {
      setToast({ visible: true, msg: e?.message ?? 'Login failed' });
    } finally {
      setSubmitting(false);
    }
  }

  const accent = RoleAccent[role];

  return (
    <Screen>
      <GridBackground />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.logo}>PS</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your ParaSync account</Text>

          <Text style={styles.roleLabel}>I am a…</Text>
          <View style={styles.roleRow}>
            {ROLES.map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.roleChip, role === r && { backgroundColor: RoleAccent[r] + '25', borderColor: RoleAccent[r] }]}
                onPress={() => setRole(r)}
              >
                <Text style={[styles.roleChipText, role === r && { color: RoleAccent[r] }]}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FieldInput label="Email" value={email} onChangeText={setEmail} placeholder="you@email.com" keyboardType="email-address" />
          <FieldInput label="Password" value={password} onChangeText={setPassword} placeholder="Your password" secureTextEntry />

          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgot}>
            <Text style={[styles.forgotText, { color: accent }]}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, { backgroundColor: accent, opacity: submitting ? 0.6 : 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }]} onPress={handleLogin} activeOpacity={0.85} disabled={submitting}>
            <Text style={[styles.btnText, { color: role === 'athlete' ? '#000' : '#fff' }]}>{submitting ? 'Signing in…' : 'Sign In'}</Text>
            {!submitting && <Ionicons name="arrow-forward" size={16} color={role === 'athlete' ? '#000' : '#fff'} />}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/role-select')} style={styles.signupLink}>
            <Text style={styles.signupText}>Don't have an account? <Text style={{ color: accent }}>Sign up</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast message={toast.msg} visible={toast.visible} onHide={() => setToast(t => ({ ...t, visible: false }))} type="warn" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 28, paddingTop: 80, paddingBottom: 48 },
  logo: { fontSize: 36, fontWeight: '900', color: Colors.cyan, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 6 },
  subtitle: { color: Colors.t2, fontSize: 14, marginBottom: 32 },
  roleLabel: { color: Colors.t2, fontSize: 12, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  roleChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card },
  roleChipText: { color: Colors.t2, fontSize: 12, fontWeight: '600' },
  forgot: { alignSelf: 'flex-end', marginBottom: 20, marginTop: -6 },
  forgotText: { fontSize: 12 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  btnText: { fontSize: 15, fontWeight: '800' },
  signupLink: { alignItems: 'center' },
  signupText: { color: Colors.t2, fontSize: 13 },
});
