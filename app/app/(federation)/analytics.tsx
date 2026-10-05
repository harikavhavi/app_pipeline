import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import PerformanceChart from '../../components/charts/PerformanceChart';
import { Colors } from '../../constants/colors';

export default function FederationAnalytics() {
  return (
    <Screen>
      <Topbar title="Analytics Overview" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Athlete Registrations (Monthly)</Text>
        <PerformanceChart data={[18, 22, 26, 21, 28, 32, 30]} label="Athletes" color={Colors.orange} />
        <Text style={styles.sectionTitle}>Sport Participation Trend</Text>
        <PerformanceChart data={[40, 45, 48, 52, 58, 62, 65]} label="Sessions" color={Colors.blue} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 12, marginTop: 8 },
});
