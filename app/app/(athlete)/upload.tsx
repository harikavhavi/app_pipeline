import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import FieldSelect from '../../components/auth/FieldSelect';
import FramingTips from '../../components/ui/FramingTips';
import { Colors } from '../../constants/colors';
import { SPORTS, IPC_CLASSES } from '../../constants/sports';
import { useAuthStore } from '../../store/auth.store';
import { useAnalysisStore } from '../../store/analysis.store';

const METRICS_TOGGLES = ['Motion', 'Pose & Form', 'Timing', 'Fatigue & Risk'];

export default function Upload() {
  const router = useRouter();
  const { sessionRequestId, requestMessage } = useLocalSearchParams<{ sessionRequestId?: string; requestMessage?: string }>();
  const userName = useAuthStore(s => s.userName);
  const setCurrentAnalysis = useAnalysisStore(s => s.setCurrentAnalysis);
  const [selected,      setSelected]      = useState(false);
  const [fileName,      setFileName]      = useState('');
  const [videoUri,      setVideoUri]      = useState('');
  const [videoBlob,     setVideoBlob]     = useState<Blob | null>(null);
  const [sport,         setSport]         = useState(SPORTS[0].id);
  const [ipcClass,      setIpcClass]      = useState('T53');
  const [activeMetrics, setActiveMetrics] = useState<string[]>(METRICS_TOGGLES);

  async function handlePickVideo() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: Platform.OS === 'web'
          ? ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/*']
          : ['video/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setFileName(asset.name);
        setVideoUri(asset.uri);
        setSelected(true);
        // On web: eagerly read the blob now while the object URL is still valid
        if (Platform.OS === 'web' && asset.file) {
          setVideoBlob(asset.file as Blob);
        } else {
          setVideoBlob(null);
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open file picker. Please try again.');
    }
  }
  function toggleMetric(m: string) {
    setActiveMetrics(a => a.includes(m) ? a.filter(x => x !== m) : [...a, m]);
  }

  function handleRunAnalysis() {
    if (!selected || !sport) return;
    setCurrentAnalysis({
      sport,
      ipcClass: ipcClass || 'T53',
      fileName,
      videoUri,
      videoBlob: videoBlob ?? undefined,   // pass blob directly to avoid refetch
      metrics: activeMetrics,
      startedAt: Date.now(),
      sessionRequestId: sessionRequestId || undefined,
    });
    router.push('/(athlete)/processing');
  }

  return (
    <Screen hasOrbs>
      <Topbar title="Upload & Analyse" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {sessionRequestId && (
          <View style={styles.requestBanner}>
            <Ionicons name="megaphone-outline" size={16} color={Colors.cyan} />
            <Text style={styles.requestBannerText}>
              Fulfilling your coach's request{requestMessage ? `: "${requestMessage}"` : ''}
            </Text>
          </View>
        )}

        <FramingTips />

        {/* Drop zone */}
        <TouchableOpacity style={[styles.dropZone, selected && styles.dropZoneActive]} onPress={handlePickVideo} activeOpacity={0.8}>
          {selected ? (
            <>
              <Ionicons name="film-outline" size={40} color={Colors.cyan} style={styles.fileIcon} />
              <Text style={styles.fileName}>{fileName}</Text>
              <Text style={styles.fileReady}>Ready for analysis</Text>
            </>
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={36} color={Colors.t2} style={styles.uploadIcon} />
              <Text style={styles.uploadTitle}>Tap to select video</Text>
              <Text style={styles.uploadSub}>MP4 · MOV · AVI up to 2GB</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Athlete info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Athlete</Text>
          <Text style={styles.infoValue}>{userName ?? 'Athlete'}</Text>
        </View>

        {/* Sport + Class */}
        <FieldSelect label="Sport *" value={sport} options={SPORTS} onSelect={setSport} />
        <FieldSelect label="IPC Classification" value={ipcClass} options={IPC_CLASSES} onSelect={setIpcClass} />

        {/* Metrics toggles */}
        <Text style={styles.metricsLabel}>Analysis Pillars</Text>
        <View style={styles.metricsGrid}>
          {METRICS_TOGGLES.map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.metricToggle, activeMetrics.includes(m) && styles.metricToggleActive]}
              onPress={() => toggleMetric(m)}
            >
              <Text style={[styles.metricText, activeMetrics.includes(m) && { color: Colors.cyan }]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.runBtn, (!selected || !sport) && styles.runBtnDisabled, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }]}
          onPress={handleRunAnalysis}
          disabled={!selected || !sport}
          activeOpacity={0.85}
        >
          <Ionicons name="hardware-chip-outline" size={16} color={(!selected || !sport) ? Colors.t3 : '#000'} />
          <Text style={[styles.runBtnText, (!selected || !sport) && { color: Colors.t3 }]}>Run AI Analysis</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },
  requestBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.cyan + '12', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.cyan + '30' },
  requestBannerText: { flex: 1, color: Colors.t1, fontSize: 12, fontWeight: '600' },
  dropZone: { borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: 18, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 20, backgroundColor: Colors.card },
  dropZoneActive: { borderColor: Colors.cyan, backgroundColor: Colors.cyan + '10' },
  uploadIcon: { fontSize: 36, marginBottom: 10 },
  uploadTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 6 },
  uploadSub: { color: Colors.t3, fontSize: 12 },
  fileIcon: { fontSize: 40, marginBottom: 8 },
  fileName: { color: Colors.cyan, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  fileReady: { color: Colors.green, fontSize: 11 },
  infoCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  infoLabel: { color: Colors.t2, fontSize: 12 },
  infoValue: { color: '#fff', fontSize: 13, fontWeight: '600' },
  metricsLabel: { color: Colors.t2, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  metricToggle: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card },
  metricToggleActive: { borderColor: Colors.cyan, backgroundColor: Colors.cyan + '18' },
  metricText: { color: Colors.t2, fontSize: 12, fontWeight: '600' },
  runBtn: { backgroundColor: Colors.cyan, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  runBtnDisabled: { backgroundColor: Colors.card2, borderWidth: 1, borderColor: Colors.border },
  runBtnText: { color: '#000', fontSize: 15, fontWeight: '800' },
});
