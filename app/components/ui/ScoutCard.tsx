import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { ConnectionStatus } from '../../types';

interface ScoutCardProps {
  scout: {
    id: string;
    name: string;
    org: string;
    sports: string[];
    verified?: boolean;
    status?: ConnectionStatus;
  };
  onConnect?: () => void;
  onMessage?: () => void;
}

export default function ScoutCard({ scout, onConnect, onMessage }: ScoutCardProps) {
  const status = scout.status;
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.monogram}>{scout.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{scout.name}</Text>
          {scout.verified && <Ionicons name="checkmark-circle" size={14} color={Colors.green} />}
        </View>
        <Text style={styles.org}>{scout.org}</Text>
        <Text style={styles.sports}>{scout.sports.slice(0, 2).join(' · ')}</Text>
      </View>
      {status === 'accepted' ? (
        <TouchableOpacity style={styles.messageBtn} onPress={onMessage}>
          <Text style={styles.messageBtnText}>Message</Text>
        </TouchableOpacity>
      ) : status === 'pending' ? (
        <View style={styles.pendingBtn}>
          <Text style={styles.pendingBtnText}>Pending</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.btn} onPress={onConnect}>
          <Text style={styles.btnText}>Connect</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.purple + '30',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.purple + '50',
  },
  monogram: { color: Colors.purple, fontSize: 15, fontWeight: '800' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { color: '#fff', fontSize: 13, fontWeight: '700' },
  org: { color: Colors.t2, fontSize: 11, marginTop: 1 },
  sports: { color: Colors.t3, fontSize: 10, marginTop: 2 },
  btn: {
    backgroundColor: Colors.cyan + '20',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.cyan + '50',
  },
  btnText: { color: Colors.cyan, fontSize: 12, fontWeight: '700' },
  pendingBtn: {
    backgroundColor: Colors.orange + '18',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.orange + '40',
  },
  pendingBtnText: { color: Colors.orange, fontSize: 12, fontWeight: '700' },
  messageBtn: {
    backgroundColor: Colors.green + '18',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.green + '40',
  },
  messageBtnText: { color: Colors.green, fontSize: 12, fontWeight: '700' },
});
