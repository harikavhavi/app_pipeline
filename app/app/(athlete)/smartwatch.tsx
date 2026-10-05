/**
 * /(athlete)/smartwatch.tsx
 * Connect smartwatch and view real-time health metrics for para-athlete analysis.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Screen from '../../components/layout/Screen';
import Topbar from '../../components/layout/Topbar';
import { Colors } from '../../constants/colors';
import { smartwatchService } from '../../services/smartwatch.service';
import { WatchMetrics } from '../../types';

const DEVICES = ['Garmin Fenix 7', 'Apple Watch Ultra', 'Samsung Galaxy Watch 6', 'Polar Vantage V3', 'Wahoo TICKR'];

interface WatchMetricDef {
  key: keyof WatchMetrics;
  label: string;
  unit: string;
  icon: any;
  description: string;
}

const METRIC_DEFS: WatchMetricDef[] = [
  { key: 'heartRate',    label: 'Heart Rate',    unit: 'bpm', icon: 'heart',           description: 'Current beats per minute. High HR during exercise is expected, but recovery matters.' },
  { key: 'hrv',          label: 'HRV',           unit: 'ms',  icon: 'pulse',            description: 'Heart Rate Variability — higher is generally better for recovery and readiness.' },
  { key: 'spo2',         label: 'SpO₂',          unit: '%',   icon: 'water',            description: 'Blood oxygen saturation. Below 94% warrants monitoring in para athletes.' },
  { key: 'stressScore',  label: 'Stress Score',  unit: '',    icon: 'alert-circle',     description: 'Autonomic nervous system load. High stress during training can increase injury risk.' },
  { key: 'steps',        label: 'Steps',         unit: '',    icon: 'walk',             description: 'Daily activity count (wheelchair push-equivalents for WC sports).' },
  { key: 'activeMinutes',label: 'Active Mins',   unit: 'min', icon: 'timer',            description: 'Time spent in moderate-to-vigorous physical activity today.' },
  { key: 'calories',     label: 'Calories',      unit: 'kcal',icon: 'flame',            description: 'Active calories burned today.' },
];

function RiskIndicator({ level }: { level: 'ok' | 'warn' | 'risk' }) {
  const color = level === 'ok' ? Colors.green : level === 'warn' ? Colors.yellow : Colors.red;
  return <View style={[styles.riskDot, { backgroundColor: color }]} />;
}

function WatchChip({
  def, value,
}: { def: WatchMetricDef; value: number | null }) {
  const risk = value !== null ? smartwatchService.riskBand(def.key, value) : 'ok';
  const color = risk === 'ok' ? Colors.cyan : risk === 'warn' ? Colors.yellow : Colors.red;
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity style={styles.chip} onPress={() => setExpanded(e => !e)} activeOpacity={0.85}>
      <View style={styles.chipTop}>
        <View style={[styles.chipIconWrap, { backgroundColor: color + '18' }]}>
          <Ionicons name={def.icon} size={18} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.chipLabel}>{def.label}</Text>
          {value !== null ? (
            <Text style={[styles.chipVal, { color }]}>
              {typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(1)) : value}
              {def.unit ? <Text style={styles.chipUnit}> {def.unit}</Text> : null}
            </Text>
          ) : (
            <Text style={styles.chipNoData}>—</Text>
          )}
        </View>
        <RiskIndicator level={risk} />
      </View>
      {expanded && (
        <Text style={styles.chipDesc}>{def.description}</Text>
      )}
    </TouchableOpacity>
  );
}

export default function Smartwatch() {
  const router    = useRouter();
  const pulseAnim = useRef(new Animated.Value(0.8)).current;

  const [metrics,    setMetrics]    = useState<WatchMetrics | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [deviceIdx,  setDeviceIdx]  = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animate the pulse ring around the watch icon
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.8,  duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const m = await smartwatchService.getMetrics();
      setMetrics(m);
    }, 3000);
  }, []);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  async function handleConnect() {
    setConnecting(true);
    const m = await smartwatchService.connect(DEVICES[deviceIdx]);
    setMetrics(m);
    setConnecting(false);
    startPolling();
  }

  async function handleDisconnect() {
    await smartwatchService.disconnect();
    if (pollRef.current) clearInterval(pollRef.current);
    const m = await smartwatchService.getMetrics();
    setMetrics(m);
  }

  const connected = metrics?.connected ?? false;

  return (
    <Screen hasOrbs>
      <Topbar title="Health Monitor" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Device Card ── */}
        <View style={styles.deviceCard}>
          <Animated.View style={[styles.watchGlow, { transform: [{ scale: pulseAnim }], opacity: connected ? 1 : 0.3 }]} />
          <View style={[styles.watchIcon, { borderColor: connected ? Colors.cyan : Colors.border }]}>
            <Ionicons name="watch" size={32} color={connected ? Colors.cyan : Colors.t3} />
          </View>

          <Text style={styles.deviceName}>
            {connected ? metrics?.deviceName ?? 'Connected Device' : 'No Device Connected'}
          </Text>
          {connected && metrics?.lastSync && (
            <Text style={styles.lastSync}>
              Last sync: {new Date(metrics.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}

          {!connected && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.devicePicker}>
              {DEVICES.map((d, i) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.deviceChip, deviceIdx === i && styles.deviceChipActive]}
                  onPress={() => setDeviceIdx(i)}
                >
                  <Text style={[styles.deviceChipText, deviceIdx === i && { color: Colors.cyan }]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity
            style={[styles.connectBtn, connected && { backgroundColor: Colors.red + '20', borderColor: Colors.red + '50' }]}
            onPress={connected ? handleDisconnect : handleConnect}
            disabled={connecting}
          >
            {connecting ? (
              <ActivityIndicator color={Colors.cyan} size="small" />
            ) : (
              <>
                <Ionicons name={connected ? 'bluetooth' : 'bluetooth-outline'} size={16} color={connected ? Colors.red : Colors.cyan} />
                <Text style={[styles.connectBtnText, connected && { color: Colors.red }]}>
                  {connected ? 'Disconnect' : `Connect to ${DEVICES[deviceIdx]}`}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Why it matters ── */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.blue} />
          <Text style={styles.infoText}>
            Health metrics from your smartwatch are combined with biomechanics analysis to give a more complete picture of your para-athlete performance and recovery state.
          </Text>
        </View>

        {/* ── Metrics Grid ── */}
        {!connected && (
          <View style={styles.noMetrics}>
            <Ionicons name="pulse-outline" size={40} color={Colors.t3} />
            <Text style={styles.noMetricsTitle}>Connect your watch to see live metrics</Text>
            <Text style={styles.noMetricsSub}>Metrics like HRV, heart rate and SpO₂ will appear here once connected</Text>
          </View>
        )}

        {connected && metrics && (
          <>
            <Text style={styles.sectionTitle}>Live Health Metrics</Text>
            <Text style={styles.sectionSub}>Tap any metric to learn more • Updates every 3 seconds</Text>
            <View style={styles.grid}>
              {METRIC_DEFS.map(def => (
                <WatchChip
                  key={def.key}
                  def={def}
                  value={metrics[def.key] as number | null}
                />
              ))}
            </View>

            {/* ── Risk Summary ── */}
            <View style={styles.riskCard}>
              <Text style={styles.riskTitle}>Health Status Summary</Text>
              {METRIC_DEFS.filter(d => ['heartRate', 'hrv', 'spo2', 'stressScore'].includes(d.key)).map(def => {
                const val = metrics[def.key] as number | null;
                const risk = smartwatchService.riskBand(def.key, val);
                if (risk === 'ok') return null;
                return (
                  <View key={def.key} style={styles.riskRow}>
                    <Ionicons name={risk === 'risk' ? 'warning' : 'alert-circle'} size={14} color={risk === 'risk' ? Colors.red : Colors.yellow} />
                    <Text style={[styles.riskText, { color: risk === 'risk' ? Colors.red : Colors.yellow }]}>
                      {def.label} ({val}{def.unit}) — {risk === 'risk' ? 'flag for coach review' : 'monitor closely'}
                    </Text>
                  </View>
                );
              }).filter(Boolean)}
              {METRIC_DEFS.filter(d => ['heartRate', 'hrv', 'spo2', 'stressScore'].includes(d.key)).every(def => {
                const val = metrics[def.key] as number | null;
                return smartwatchService.riskBand(def.key, val) === 'ok';
              }) && (
                <View style={styles.riskRow}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.green} />
                  <Text style={[styles.riskText, { color: Colors.green }]}>All monitored metrics are within healthy ranges</Text>
                </View>
              )}
            </View>
          </>
        )}

      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 48 },

  deviceCard: { backgroundColor: Colors.card, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 24, alignItems: 'center', marginBottom: 16, overflow: 'hidden' },
  watchGlow: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: Colors.cyan, opacity: 0.06 },
  watchIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.card2, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  deviceName: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  lastSync: { color: Colors.t3, fontSize: 11, marginBottom: 14 },
  devicePicker: { marginVertical: 14, maxHeight: 44 },
  deviceChip: { backgroundColor: Colors.card2, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: Colors.border },
  deviceChipActive: { borderColor: Colors.cyan, backgroundColor: Colors.cyan + '15' },
  deviceChipText: { color: Colors.t2, fontSize: 11, fontWeight: '600' },
  connectBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.cyan + '15', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1, borderColor: Colors.cyan + '40', marginTop: 4 },
  connectBtnText: { color: Colors.cyan, fontSize: 13, fontWeight: '700' },

  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: Colors.blue + '12', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.blue + '30', marginBottom: 20 },
  infoText: { flex: 1, color: Colors.t2, fontSize: 12, lineHeight: 18 },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 4 },
  sectionSub:   { fontSize: 11, color: Colors.t3, marginBottom: 14 },

  grid: { gap: 10 },
  chip: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14 },
  chipTop:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chipIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chipLabel:  { color: Colors.t2, fontSize: 11, fontWeight: '600' },
  chipVal:    { fontSize: 20, fontWeight: '800', marginTop: 2 },
  chipUnit:   { fontSize: 11, fontWeight: '400', color: Colors.t3 },
  chipNoData: { color: Colors.t3, fontSize: 18, fontWeight: '700', marginTop: 2 },
  chipDesc:   { color: Colors.t3, fontSize: 11, lineHeight: 16, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  riskDot:    { width: 8, height: 8, borderRadius: 4 },

  noMetrics:      { alignItems: 'center', paddingVertical: 48, backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, gap: 8 },
  noMetricsTitle: { color: Colors.t1, fontSize: 15, fontWeight: '700', marginTop: 6, textAlign: 'center', paddingHorizontal: 20 },
  noMetricsSub:   { color: Colors.t3, fontSize: 12, textAlign: 'center', paddingHorizontal: 24, lineHeight: 18 },

  riskCard: { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14, marginTop: 14 },
  riskTitle: { color: Colors.t1, fontSize: 13, fontWeight: '700', marginBottom: 12 },
  riskRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  riskText:  { fontSize: 12, flex: 1, lineHeight: 16 },
});
