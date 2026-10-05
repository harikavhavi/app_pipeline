import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import { Colors } from '../../constants/colors';

export default function Reports() {
  return (
    <Screen>
      <Topbar title="Scouting Reports" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.emptyCard}>
          <Ionicons name="bar-chart-outline" size={44} color={Colors.t3} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No reports yet</Text>
          <Text style={styles.emptySub}>Reports are generated when athletes complete analysis sessions and share with scouts</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  emptyCard: { alignItems: 'center', paddingVertical: 60, backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  emptyIcon: { fontSize: 44, marginBottom: 14 },
  emptyTitle: { color: Colors.t1, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptySub: { color: Colors.t3, fontSize: 12, textAlign: 'center', paddingHorizontal: 20 },
});
