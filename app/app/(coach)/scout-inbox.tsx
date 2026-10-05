import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import { Colors } from '../../constants/colors';

const INBOX: { id: string; scout: string; org: string; athlete: string; msg: string; time: string }[] = [];

export default function ScoutInbox() {
  return (
    <Screen>
      <Topbar title="Scout Inbox" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {INBOX.length === 0 && <Text style={styles.emptyText}>No scout messages yet.</Text>}
        {INBOX.map(m => (
          <View key={m.id} style={styles.card}>
            <Text style={styles.scout}>{m.scout} <Text style={styles.org}>· {m.org}</Text></Text>
            <Text style={styles.re}>Re: {m.athlete}</Text>
            <Text style={styles.msg}>"{m.msg}"</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.replyBtn}><Text style={styles.replyText}>Reply</Text></TouchableOpacity>
              <Text style={styles.time}>{m.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  card: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  scout: { color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 2 },
  org: { color: Colors.t2, fontWeight: '400' },
  re: { color: Colors.blue, fontSize: 11, marginBottom: 8 },
  msg: { color: Colors.t2, fontSize: 13, fontStyle: 'italic', lineHeight: 20, marginBottom: 10 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  replyBtn: { backgroundColor: Colors.blue + '25', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: Colors.blue + '40' },
  replyText: { color: Colors.blue, fontSize: 12, fontWeight: '700' },
  time: { color: Colors.t3, fontSize: 10 },
  emptyText: { color: Colors.t3, fontSize: 13 },
});
