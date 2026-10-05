/**
 * smartwatch.service.ts
 * Manages smartwatch / wearable BLE connection and health metric retrieval.
 * On real devices: integrates with react-native-health or Expo Health.
 * Here we provide a mock simulation with realistic para-athlete ranges.
 */
import { WatchMetrics } from '../types';

// ─── Simulated device state ────────────────────────────────────────────────────
let _connected = false;
let _deviceName: string | null = null;
let _lastSync: string | null = null;

function randomIn(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}

function freshMetrics(): WatchMetrics {
  return {
    connected:     _connected,
    deviceName:    _deviceName,
    lastSync:      _lastSync,
    heartRate:     _connected ? randomIn(68, 125) : null,
    hrv:           _connected ? randomIn(28, 72) : null,
    spo2:          _connected ? randomIn(94, 99) : null,
    steps:         _connected ? Math.round(randomIn(800, 3200)) : null,
    activeMinutes: _connected ? Math.round(randomIn(20, 90)) : null,
    calories:      _connected ? Math.round(randomIn(180, 520)) : null,
    stressScore:   _connected ? Math.round(randomIn(20, 75)) : null,
  };
}

// Continuously simulates live updates when connected
let _liveMetrics: WatchMetrics = freshMetrics();

export const smartwatchService = {
  /** Scan for and pair with a BLE wearable (mocked) */
  async connect(deviceName: string = 'Garmin Fenix 7'): Promise<WatchMetrics> {
    await new Promise(r => setTimeout(r, 1800)); // simulate scan delay
    _connected = true;
    _deviceName = deviceName;
    _lastSync = new Date().toISOString();
    _liveMetrics = freshMetrics();
    return _liveMetrics;
  },

  /** Disconnect the paired device */
  async disconnect(): Promise<void> {
    _connected = false;
    _deviceName = null;
    _liveMetrics = freshMetrics();
  },

  /** Get current health metrics snapshot */
  async getMetrics(): Promise<WatchMetrics> {
    if (_connected) {
      // Simulate small drift on each read
      _liveMetrics = {
        ..._liveMetrics,
        heartRate:   randomIn(68, 125),
        hrv:         randomIn(28, 72),
        spo2:        randomIn(94, 99),
        stressScore: randomIn(20, 75),
      };
      _lastSync = new Date().toISOString();
    }
    return { ..._liveMetrics, connected: _connected };
  },

  /** Whether a watch is currently paired */
  isConnected(): boolean { return _connected; },

  /** Returns readable device name */
  deviceName(): string | null { return _deviceName; },

  /**
   * Risk band helper used to colour-code individual metrics:
   * - 'ok'   : within healthy ranges for a para athlete
   * - 'warn' : borderline — monitor
   * - 'risk' : outside safe ranges — flag
   */
  riskBand(metric: keyof WatchMetrics, value: number | null): 'ok' | 'warn' | 'risk' {
    if (value === null) return 'ok';
    switch (metric) {
      case 'heartRate':   return value > 170 ? 'risk' : value > 140 ? 'warn' : 'ok';
      case 'hrv':         return value < 20  ? 'risk' : value < 35  ? 'warn' : 'ok';
      case 'spo2':        return value < 92  ? 'risk' : value < 95  ? 'warn' : 'ok';
      case 'stressScore': return value > 70  ? 'risk' : value > 55  ? 'warn' : 'ok';
      default:            return 'ok';
    }
  },
};
