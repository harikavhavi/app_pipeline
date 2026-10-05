import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import { Colors } from '../../constants/colors';
import { MOCK_ATHLETES } from '../../data/mock-athletes';

export default function Registry() {
  return (
    <Screen>
      <Topbar title="Athlete Registry" right={<TouchableOpacity><Text style={{ color: Colors.orange, fontSize: 12 }}>+ Register</Text></TouchableOpacity>} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.count}>{MOCK_ATHLETES.length} registered athletes</Text>
        {MOCK_ATHLETES.map(a => (
          <View key={a.id} style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.name}>{a.name}</Text>
              <Text style={styles.meta}>{a.sport} · {a.ipcClass} · {a.state}</Text>
            </View>
            <TouchableOpacity style={styles.verifyBtn}><Text style={styles.verifyText}>Verify</Text></TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  count: { color: Colors.t2, fontSize: 12, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  info: { flex: 1 },
  name: { color: '#fff', fontSize: 13, fontWeight: '600' },
  meta: { color: Colors.t2, fontSize: 11 },
  verifyBtn: { backgroundColor: Colors.orange + '20', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: Colors.orange + '40' },
  verifyText: { color: Colors.orange, fontSize: 11, fontWeight: '700' },
});
