import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import FieldInput from '../../components/auth/FieldInput';
import Toast from '../../components/ui/Toast';
import { Colors } from '../../constants/colors';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [toast, setToast] = useState({ visible: false, msg: '' });

  function handleSend() {
    if (!email) { setToast({ visible: true, msg: 'Enter your email' }); return; }
    setSent(true);
  }

  return (
    <Screen hasOrbs>
      <Topbar title="Forgot Password" onBack={() => router.back()} />
      <View style={styles.content}>
        {sent ? (
          <>
            <Ionicons name="mail-outline" size={48} color={Colors.cyan} style={styles.icon} />
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.body}>We've sent password reset instructions to <Text style={{ color: Colors.cyan }}>{email}</Text></Text>
            <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.btnText}>Back to Login</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.body}>Enter your registered email address and we'll send you reset instructions.</Text>
            <FieldInput label="Email" value={email} onChangeText={setEmail} placeholder="you@email.com" keyboardType="email-address" />
            <TouchableOpacity style={[styles.btn, { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }]} onPress={handleSend}>
              <Text style={styles.btnText}>Send Reset Link</Text>
              <Ionicons name="arrow-forward" size={16} color="#000" />
            </TouchableOpacity>
          </>
        )}
      </View>
      <Toast message={toast.msg} visible={toast.visible} onHide={() => setToast(t => ({ ...t, visible: false }))} type="warn" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 28, paddingTop: 40 },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 12 },
  body: { color: Colors.t2, fontSize: 14, lineHeight: 22, marginBottom: 28 },
  btn: { backgroundColor: Colors.cyan, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#000', fontSize: 15, fontWeight: '800' },
});
