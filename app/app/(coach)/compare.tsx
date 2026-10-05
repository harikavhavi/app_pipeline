import React, { useEffect, useState } from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import FieldSelect from '../../components/auth/FieldSelect';
import { Colors } from '../../constants/colors';
import { API_BASE } from '../../services/api';

export default function Compare() {
  const router = useRouter();
  const [athletes, setAthletes] = useState<any[]>([]);
  const [athleteA, setAthleteA] = useState('');
  const [athleteB, setAthleteB] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/athletes`)
      .then(r => r.json())
      .then(data => setAthletes(data.athletes ?? []))
      .catch(() => {});
  }, []);

  return (
    <Screen>
      <Topbar title="Session Comparison" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <FieldSelect label="Athlete A" value={athleteA} options={athletes.map(a => a.name)} onSelect={setAthleteA} />
        <FieldSelect label="Athlete B" value={athleteB} options={athletes.map(a => a.name)} onSelect={setAthleteB} />
        {(athleteA || athleteB) && (
          <Text style={styles.emptyText}>Not enough session history yet to compare these athletes.</Text>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  emptyText: { color: Colors.t3, fontSize: 13, marginTop: 16 },
});
