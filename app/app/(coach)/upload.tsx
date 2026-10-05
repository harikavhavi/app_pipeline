import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import FieldInput from '../../components/auth/FieldInput';
import FieldSelect from '../../components/auth/FieldSelect';
import { Colors } from '../../constants/colors';
import { SPORTS, IPC_CLASSES } from '../../constants/sports';
import { API_BASE } from '../../services/api';

export default function CoachUpload() {
  const [athletes, setAthletes] = React.useState<any[]>([]);
  const [athlete, setAthlete] = React.useState('');
  const [sport, setSport] = React.useState('');
  const [ipc, setIpc] = React.useState('');
  const [selected, setSelected] = React.useState(false);

  React.useEffect(() => {
    fetch(`${API_BASE}/athletes`)
      .then(r => r.json())
      .then(data => setAthletes(data.athletes ?? []))
      .catch(() => {});
  }, []);

  return (
    <Screen hasOrbs>
      <Topbar title="Upload for Athlete" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <FieldSelect label="Select Athlete" value={athlete} options={athletes.map(a => a.name)} onSelect={setAthlete} />
        <FieldSelect label="Sport" value={sport} options={SPORTS} onSelect={setSport} />
        <FieldSelect label="IPC Classification" value={ipc} options={IPC_CLASSES} onSelect={setIpc} />
        <TouchableOpacity style={[styles.dropZone, selected && styles.dropZoneActive]} onPress={() => setSelected(true)} activeOpacity={0.8}>
          {selected ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="film-outline" size={18} color={Colors.blue} />
              <Text style={styles.fileReady}>Video selected — ready for analysis</Text>
            </View>
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={32} color={Colors.t2} style={styles.uploadIcon} />
              <Text style={styles.uploadTitle}>Tap to select video</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.runBtn, (!selected || !athlete) && styles.runBtnDisabled, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }]} disabled={!selected || !athlete}>
          <Ionicons name="hardware-chip-outline" size={17} color="#fff" />
          <Text style={styles.runBtnText}>Run AI Analysis</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  dropZone: { borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: 18, height: 140, alignItems: 'center', justifyContent: 'center', marginBottom: 20, backgroundColor: Colors.card },
  dropZoneActive: { borderColor: Colors.blue, backgroundColor: Colors.blue + '10' },
  uploadIcon: { fontSize: 32, marginBottom: 8 },
  uploadTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  fileReady: { color: Colors.blue, fontSize: 13, fontWeight: '600' },
  runBtn: { backgroundColor: Colors.blue, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  runBtnDisabled: { backgroundColor: Colors.card2, borderWidth: 1, borderColor: Colors.border },
  runBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
