import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, Animated, StyleSheet, ScrollView,
  Dimensions, Platform, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/layout/Screen';
import { Colors } from '../../constants/colors';
import { useAnalysisStore } from '../../store/analysis.store';
import { useAuthStore } from '../../store/auth.store';
import { API_BASE } from '../../services/api';
import { Session } from '../../types';

// ─── Layout ──────────────────────────────────────────────────────────────────
const { width: W } = Dimensions.get('window');

// ─── Pipeline stages ──────────────────────────────────────────────────────────
const STAGES: { stage: string; pct: number; msg: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { stage: 'decode',           pct: 5,   msg: 'Extracting and decoding video frames',        icon: 'film-outline' },
  { stage: 'stabilize',        pct: 12,  msg: 'Stabilizing footage — removing camera shake', icon: 'move-outline' },
  { stage: 'pose_detection',   pct: 30,  msg: 'Running pose estimation on athlete body',     icon: 'body-outline' },
  { stage: 'object_detection', pct: 45,  msg: 'Detecting wheelchair and wheel mechanics',    icon: 'locate-outline' },
  { stage: 'optical_flow',     pct: 55,  msg: 'Computing rim speed and trajectory data',     icon: 'speedometer-outline' },
  { stage: 'feature_p01_p04', pct: 65,  msg: 'Extracting propulsion, symmetry & stability', icon: 'barbell-outline' },
  { stage: 'feature_p05_p08', pct: 73,  msg: 'Measuring reaction speed and technique',      icon: 'flash-outline' },
  { stage: 'feature_p09_p14', pct: 82,  msg: 'Computing fatigue & injury risk signals',     icon: 'shield-outline' },
  { stage: 'scoring',          pct: 90,  msg: 'Scoring metrics against IPC baseline',        icon: 'stats-chart-outline' },
  { stage: 'feedback',         pct: 96,  msg: 'Generating coaching report',                  icon: 'document-text-outline' },
  { stage: 'complete',         pct: 100, msg: 'Analysis complete',                           icon: 'checkmark-circle-outline' },
];

// ─── Live ticker definitions ───────────────────────────────────────────────────
const TICKER_DEFS = [
  { key: 'speed',   label: 'Rim Speed', unit: 'm/s' },
  { key: 'cadence', label: 'Cadence',   unit: '/min' },
  { key: 'sym',     label: 'Symmetry',  unit: '%'   },
  { key: 'react',   label: 'Reaction',  unit: 'ms'  },
  { key: 'rsi',     label: 'RSI',       unit: ''    },
  { key: 'cover',   label: 'Coverage',  unit: '%'   },
];

function freshTick() {
  return {
    speed:   (3.0 + Math.random() * 1.5).toFixed(1),
    cadence: String(Math.round(38 + Math.random() * 20)),
    sym:     String(Math.round(80 + Math.random() * 15)),
    react:   String(Math.round(260 + Math.random() * 60)),
    rsi:     String(Math.round(10  + Math.random() * 15)),
    cover:   String(Math.round(62  + Math.random() * 20)),
  };
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function Processing() {
  const router          = useRouter();
  const currentAnalysis = useAnalysisStore(s => s.currentAnalysis);
  const setResult       = useAnalysisStore(s => s.setResult);
  const userId          = useAuthStore(s => s.userId)   ?? `usr_${Date.now()}`;
  const userName        = useAuthStore(s => s.userName) ?? 'Unknown Athlete';

  const videoUri = currentAnalysis?.videoUri ?? '';
  const sport    = currentAnalysis?.sport    ?? 'wheelchair_basketball';
  const ipcClass = currentAnalysis?.ipcClass ?? currentAnalysis?.classification ?? 'T53';

  // ── anim refs ───────────────────────────────────────────────────────────────
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim    = useRef(new Animated.Value(0.6)).current;
  const rotateAnim   = useRef(new Animated.Value(0)).current;
  const glowAnim     = useRef(new Animated.Value(0)).current;

  // ── state ────────────────────────────────────────────────────────────────────
  const [stageIdx,    setStageIdx]    = useState(0);
  const [ticks,       setTicks]       = useState(freshTick());
  const [frame,       setFrame]       = useState(0);
  const [totalFrames, setTotalFrames] = useState(1800);
  const [done,        setDone]        = useState(false);
  const [keyframes,   setKeyframes]   = useState<{ timestamp: number; image: string }[]>([]);
  const [keyframeIdx, setKeyframeIdx] = useState(0);

  const tickTimer     = useRef<ReturnType<typeof setInterval> | null>(null);
  const frameTimer    = useRef<ReturnType<typeof setInterval> | null>(null);
  const keyframeTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── boot animations ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Pulse the center orb
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1,   duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    // Spin the ring
    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 2200, useNativeDriver: true })
    ).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 1400, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.2, duration: 1400, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1], outputRange: ['0%', '100%'],
  });
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1], outputRange: ['0deg', '360deg'],
  });
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1], outputRange: [0.2, 0.7],
  });

  // ── tickers ──────────────────────────────────────────────────────────────────
  const startTickers = useCallback(() => {
    tickTimer.current  = setInterval(() => setTicks(freshTick()), 400);
    frameTimer.current = setInterval(() =>
      setFrame(f => Math.min(f + Math.round(4 + Math.random() * 8), totalFrames)), 160);
  }, [totalFrames]);

  const stopTickers = useCallback(() => {
    if (tickTimer.current)     clearInterval(tickTimer.current);
    if (frameTimer.current)    clearInterval(frameTimer.current);
    if (keyframeTimer.current) clearInterval(keyframeTimer.current);
  }, []);

  // ── keyframe slideshow ──────────────────────────────────────────────────────
  // Cycles through the pose-tracked sample frames the backend sends once pose
  // estimation finishes, so the athlete can see the AI actually tracking their
  // movement instead of a generic spinner.
  const startKeyframeSlideshow = useCallback((frames: { timestamp: number; image: string }[]) => {
    if (keyframeTimer.current) clearInterval(keyframeTimer.current);
    if (!frames.length) return;
    setKeyframes(frames);
    setKeyframeIdx(0);
    keyframeTimer.current = setInterval(() => {
      setKeyframeIdx(i => (i + 1) % frames.length);
    }, 700);
  }, []);

  // ── stage advance ────────────────────────────────────────────────────────────
  const applyStage = useCallback((idx: number, pct: number) => {
    setStageIdx(idx);
    Animated.timing(progressAnim, { toValue: pct / 100, duration: 700, useNativeDriver: false }).start();
  }, [progressAnim]);

  // ── finish ───────────────────────────────────────────────────────────────────
  const finish = useCallback((session: any) => {
    stopTickers();
    setFrame(totalFrames);
    setDone(true);
    setResult(session);
    setTimeout(() => router.replace('/(athlete)/dashboard'), 1400);
  }, [stopTickers, totalFrames, setResult, router]);

  // ── REAL SSE ─────────────────────────────────────────────────────────────────
  async function runRealSSE() {
    startTickers();
    try {
      const form = new FormData();
      if (Platform.OS === 'web') {
        // Use pre-read blob stored during file picking (avoids refetching expired blob URL)
        const preloaded = currentAnalysis?.videoBlob;
        const blob: Blob = preloaded
          ? preloaded
          : await fetch(videoUri).then(r => r.blob());
        form.append('video', blob, currentAnalysis?.fileName ?? 'video.mp4');
      } else {
        (form as any).append('video', { uri: videoUri, name: currentAnalysis?.fileName ?? 'video.mp4', type: 'video/mp4' });
      }
      form.append('sport',        sport);
      form.append('ipc_class',    ipcClass);
      form.append('athlete_id',   userId);
      form.append('athlete_name', userName);  // so the DB saves a real name
      if (currentAnalysis?.sessionRequestId) {
        form.append('session_request_id', currentAnalysis.sessionRequestId);
      }

      if (Platform.OS === 'web') {
        const response = await fetch(`${API_BASE}/analyse`, { method: 'POST', body: form });
        if (!response.ok || !response.body) throw new Error('no stream');

        const reader = response.body.getReader();
        const dec = new TextDecoder();
        let buf = '', ev = '';

        while (true) {
          const { done: sd, value } = await reader.read();
          if (sd) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            if (line.startsWith('event:')) { ev = line.slice(6).trim(); continue; }
            if (!line.startsWith('data:')) continue;
            try {
              const payload = JSON.parse(line.slice(5).trim());
              const idx = STAGES.findIndex(s => s.stage === ev);
              if (idx >= 0) applyStage(idx, STAGES[idx].pct);
              if (payload.video_metadata?.frames_analysed) setTotalFrames(payload.video_metadata.frames_analysed);
              if (ev === 'keyframes_ready' && payload.session_id) {
                fetch(`${API_BASE}/session/${payload.session_id}/keyframes`)
                  .then(r => r.json())
                  .then(d => { if (Array.isArray(d.frames)) startKeyframeSlideshow(d.frames); })
                  .catch(() => {});
              }
              if (ev === 'complete' && payload.result) {
                const cards    = payload.result.metric_cards ?? [];
                const scored   = cards.filter((c: any) => c.score != null);
                const avgScore = scored.length
                  ? Math.round(scored.reduce((sum: number, c: any) => sum + c.score, 0) / scored.length)
                  : 0;
                const session: Session = {
                  id:          payload.result.session_id ?? `sess_${Date.now()}`,
                  athleteId:   userId,
                  sport,
                  sportLabel:  sport.replace(/_/g, ' ').replace(/\\b\\w/g, (c: string) => c.toUpperCase()),
                  ipcClass,
                  date:        new Date().toISOString().split('T')[0],
                  duration:    payload.result.video_metadata?.duration_sec
                    ? `${Math.floor(payload.result.video_metadata.duration_sec / 60)}m ${Math.round(payload.result.video_metadata.duration_sec % 60)}s`
                    : '—',
                  videoFile:    payload.result.video_metadata?.filename,
                  overallScore: avgScore,
                  score:        avgScore,
                  metricCards:  cards,
                  aiLog:        payload.result.ai_log ?? [],
                  feedback:     payload.result.feedback ?? { scout_feedback: '', coach_feedback: '' },
                  framingFeedback: payload.result.video_metadata?.framing_feedback ?? null,
                };
                finish(session);
              }
            } catch (_) {}
          }
        }
      } else {
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', `${API_BASE}/analyse`);
          
          let seenBytes = 0;
          let buf = '', ev = '';
          
          xhr.onprogress = () => {
            const chunk = xhr.responseText.substring(seenBytes);
            seenBytes = xhr.responseText.length;
            buf += chunk;
            const lines = buf.split('\n');
            buf = lines.pop() ?? '';
            for (const line of lines) {
              if (line.startsWith('event:')) { ev = line.slice(6).trim(); continue; }
              if (!line.startsWith('data:')) continue;
              try {
                const payload = JSON.parse(line.slice(5).trim());
                const idx = STAGES.findIndex(s => s.stage === ev);
                if (idx >= 0) applyStage(idx, STAGES[idx].pct);
                if (payload.video_metadata?.frames_analysed) setTotalFrames(payload.video_metadata.frames_analysed);
                if (ev === 'keyframes_ready' && payload.session_id) {
                  fetch(`${API_BASE}/session/${payload.session_id}/keyframes`)
                    .then(r => r.json())
                    .then(d => { if (Array.isArray(d.frames)) startKeyframeSlideshow(d.frames); })
                    .catch(() => {});
                }
                if (ev === 'complete' && payload.result) {
                  const cards    = payload.result.metric_cards ?? [];
                  const scored   = cards.filter((c: any) => c.score != null);
                  const avgScore = scored.length
                    ? Math.round(scored.reduce((sum: number, c: any) => sum + c.score, 0) / scored.length)
                    : 0;
                  const session: Session = {
                    id:          payload.result.session_id ?? `sess_${Date.now()}`,
                    athleteId:   userId,
                    sport,
                    sportLabel:  sport.replace(/_/g, ' ').replace(/\\b\\w/g, (c: string) => c.toUpperCase()),
                    ipcClass,
                    date:        new Date().toISOString().split('T')[0],
                    duration:    payload.result.video_metadata?.duration_sec
                      ? `${Math.floor(payload.result.video_metadata.duration_sec / 60)}m ${Math.round(payload.result.video_metadata.duration_sec % 60)}s`
                      : '—',
                    videoFile:    payload.result.video_metadata?.filename,
                    overallScore: avgScore,
                    score:        avgScore,
                    metricCards:  cards,
                    aiLog:        payload.result.ai_log ?? [],
                    feedback:     payload.result.feedback ?? { scout_feedback: '', coach_feedback: '' },
                    framingFeedback: payload.result.video_metadata?.framing_feedback ?? null,
                  };
                  finish(session);
                  resolve();
                }
              } catch (_) {}
            }
          };
          
          xhr.onload = () => {
            if (xhr.status !== 200) reject(new Error('HTTP Error ' + xhr.status));
          };
          xhr.onerror = () => reject(new Error('Network Error'));
          xhr.send(form as any);
        });
      }
    } catch (err) {
      console.warn('SSE failed → mock:', err);
      runMock();
    }
  }

  // ── MOCK fallback ─────────────────────────────────────────────────────────────
  function runMock() {
    startTickers();
    let idx = 0;
    const iv = setInterval(() => {
      idx++;
      if (idx < STAGES.length) {
        applyStage(idx, STAGES[idx].pct);
      } else {
        clearInterval(iv);
        const session: Session = {
          id:          `sess_${Date.now()}`,
          athleteId:   userId,
          sport,
          sportLabel:  sport.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
          ipcClass,
          date:        new Date().toISOString().split('T')[0],
          duration:    '—',
          overallScore: 0,
          score:        0,
          metricCards:  [],
          aiLog:        [{ msg: 'Pipeline offline — no real metrics available', type: 'warn' }],
          feedback:     { scout_feedback: '', coach_feedback: '' },
        };
        finish(session);
      }
    }, 900);
    return () => clearInterval(iv);
  }

  // ── (re)start a run whenever a new analysis is requested ──────────────────────
  // `processing` is a hidden tab (see (athlete)/_layout.tsx), so React Navigation
  // keeps this screen instance mounted forever instead of unmounting it when you
  // navigate away — it just hides it. That means a plain `useEffect(fn, [])` only
  // ever fires once for the lifetime of the app, so a second video would just
  // re-show the first run's leftover "done" state instead of analysing anything.
  // Depending on `startedAt` (set fresh on every "Run AI Analysis" tap) makes a
  // new upload actually kick off a new run, and we reset all local UI state here
  // instead of relying on a fresh mount to do it for us.
  useEffect(() => {
    stopTickers();
    setStageIdx(0);
    setFrame(0);
    setDone(false);
    setTicks(freshTick());
    setKeyframes([]);
    setKeyframeIdx(0);
    progressAnim.setValue(0);

    if (videoUri) {
      runRealSSE();
      return () => stopTickers();
    } else {
      return runMock();
    }
  }, [currentAnalysis?.startedAt]);

  // ── render ───────────────────────────────────────────────────────────────────
  const currentStage = STAGES[stageIdx];

  return (
    <Screen>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ══ HERO LOADING AREA ══════════════════════════════════════════════════ */}
        <View style={s.heroArea}>

          {keyframes.length > 0 && !done ? (
            <>
              {/* AI-tracked sample frame, cycling through the pose-tracked keyframes */}
              <Image
                source={{ uri: keyframes[keyframeIdx]?.image }}
                style={s.keyframeImage}
                resizeMode="cover"
              />
              <View style={s.keyframeBadge}>
                <Ionicons name="body-outline" size={11} color={Colors.cyan} />
                <Text style={s.keyframeBadgeText}>AI POSE TRACKING</Text>
              </View>
              <View style={s.keyframeCounter}>
                <Text style={s.framePillText}>
                  FRAME {keyframeIdx + 1} / {keyframes.length}
                </Text>
              </View>
            </>
          ) : (
            <>
              {/* Ambient glow */}
              <Animated.View style={[s.glow, { opacity: glowOpacity }]} />

              {/* Spinning outer ring */}
              <Animated.View style={[s.ring, { transform: [{ rotate: spin }] }]}>
                <View style={s.ringDot} />
              </Animated.View>

              {/* Counter-spinning inner ring */}
              <Animated.View style={[s.ringInner, { transform: [{ rotate: spin }] }]} />

              {/* Pulsing centre orb */}
              <Animated.View style={[s.orb, { opacity: pulseAnim, transform: [{ scale: pulseAnim }] }]}>
                <Ionicons name={done ? 'checkmark-circle-outline' : currentStage.icon} size={32} color={Colors.cyan} />
              </Animated.View>
            </>
          )}

          {/* Stage label below orb */}
          <View style={s.stageLabel}>
            <Text style={s.stageName}>
              {done ? 'COMPLETE' : currentStage.stage.toUpperCase().replace(/_/g, ' ')}
            </Text>
            <Text style={s.stageMsg} numberOfLines={1}>
              {currentStage.msg}
            </Text>
          </View>

          {/* Frame counter (hidden while the real keyframe counter is showing) */}
          {!(keyframes.length > 0 && !done) && (
            <View style={[s.framePill, { flexDirection: 'row', alignItems: 'center', gap: 5 }]}>
              {done && <Ionicons name="checkmark-outline" size={11} color={Colors.cyan} />}
              <Text style={s.framePillText}>
                {done ? `${totalFrames} frames` : `FRAME  ${String(frame).padStart(5, '0')} / ${totalFrames}`}
              </Text>
            </View>
          )}
        </View>

        {/* ══ PROGRESS BAR ═══════════════════════════════════════════════════════ */}
        <View style={s.progressWrap}>
          <View style={s.progressBg}>
            <Animated.View style={[s.progressFill, { width: progressWidth }]}>
              <View style={s.progressGlow} />
            </Animated.View>
          </View>
          <View style={s.progressLabels}>
            <Text style={s.progressMsg} numberOfLines={1}>{currentStage.msg}</Text>
            <Text style={s.progressPct}>{currentStage.pct}%</Text>
          </View>
        </View>

        {/* ══ LIVE METRIC TICKERS ════════════════════════════════════════════════ */}
        <View style={s.tickerRow}>
          {TICKER_DEFS.map(def => (
            <View key={def.key} style={[s.tickerCell, done && s.tickerDone]}>
              <Text style={s.tickerVal}>
                {(ticks as any)[def.key]}
                <Text style={s.tickerUnit}>{def.unit ? ` ${def.unit}` : ''}</Text>
              </Text>
              <Text style={s.tickerLabel}>{def.label}</Text>
            </View>
          ))}
        </View>

        {/* ══ PIPELINE STAGE LOG ════════════════════════════════════════════════ */}
        <View style={s.logCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Ionicons name="settings-outline" size={13} color={Colors.t1} />
            <Text style={[s.logHeader, { marginBottom: 0 }]}>Pipeline Log</Text>
          </View>
          <View style={s.logDivider} />
          {STAGES.slice(0, stageIdx + 1).map((st, i, arr) => {
            const isActive = i === arr.length - 1;
            return (
              <View key={st.stage} style={s.logRow}>
                <Ionicons
                  name={isActive ? 'play' : 'checkmark'}
                  size={12}
                  color={isActive ? Colors.cyan : Colors.green}
                  style={{ width: 16 }}
                />
                <View style={s.logBody}>
                  <Text style={[s.logStage, isActive && { color: Colors.cyan }]}>
                    {st.stage.toUpperCase().replace(/_/g, ' ')}
                  </Text>
                  <Text style={s.logMsg}>{st.msg}</Text>
                </View>
                <Text style={s.logPct}>{st.pct}%</Text>
              </View>
            );
          })}
        </View>

      </ScrollView>
    </Screen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  scroll: { paddingBottom: 48 },

  // ── Hero loading area ────────────────────────────────────────────────────────
  heroArea: {
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    overflow: 'hidden',
  },

  // Ambient background glow
  glow: {
    position: 'absolute',
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: Colors.cyan,
    shadowColor: Colors.cyan, shadowRadius: 80, shadowOpacity: 1,
    elevation: 0,
  },

  // Outer spinning ring
  ring: {
    position: 'absolute',
    width: 200, height: 200, borderRadius: 100,
    borderWidth: 2,
    borderColor: Colors.cyan + '60',
    borderTopColor: Colors.cyan,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  ringDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.cyan,
    marginTop: -5, marginLeft: -5,
    shadowColor: Colors.cyan, shadowRadius: 6, shadowOpacity: 1,
  },

  // Inner spinning ring (counter)
  ringInner: {
    position: 'absolute',
    width: 150, height: 150, borderRadius: 75,
    borderWidth: 1.5,
    borderColor: Colors.purple + '50',
    borderBottomColor: Colors.purple,
  },

  // Pulsing centre orb
  orb: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: Colors.bg1,
    borderWidth: 2, borderColor: Colors.cyan + '80',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.cyan, shadowRadius: 20, shadowOpacity: 0.8,
    elevation: 10,
  },
  orbIcon: { fontSize: 32 },

  // Stage info below orb
  stageLabel: { position: 'absolute', bottom: 48, alignItems: 'center', paddingHorizontal: 32 },
  stageName: {
    color: Colors.cyan, fontSize: 11, fontWeight: '800',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  stageMsg: { color: Colors.t2, fontSize: 11, textAlign: 'center' },

  // Frame counter pill at bottom
  framePill: {
    position: 'absolute', bottom: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.cyan + '40',
  },
  framePillText: {
    color: Colors.cyan, fontSize: 9, fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },

  // Keyframe slideshow (real AI-tracked sample frames)
  keyframeImage: {
    position: 'absolute',
    width: '100%', height: '100%',
  },
  keyframeBadge: {
    position: 'absolute', top: 14, left: 14,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.cyan + '40',
  },
  keyframeBadgeText: {
    color: Colors.cyan, fontSize: 9, fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },
  keyframeCounter: {
    position: 'absolute', bottom: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.cyan + '40',
  },

  // ── Progress bar ─────────────────────────────────────────────────────────────
  progressWrap: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 2 },
  progressBg: {
    height: 7, backgroundColor: Colors.card2,
    borderRadius: 4, overflow: 'hidden', marginBottom: 7,
  },
  progressFill: {
    height: '100%', backgroundColor: Colors.cyan, borderRadius: 4,
    overflow: 'visible', position: 'relative',
  },
  progressGlow: {
    position: 'absolute', right: -4, top: -3,
    width: 18, height: 13,
    backgroundColor: Colors.cyan, borderRadius: 9, opacity: 0.55,
  },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressMsg: { color: Colors.t2, fontSize: 12, flex: 1 },
  progressPct: { color: Colors.cyan, fontSize: 13, fontWeight: '800' },

  // ── Tickers ──────────────────────────────────────────────────────────────────
  tickerRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, gap: 8, marginVertical: 14,
  },
  tickerCell: {
    flex: 1, minWidth: '28%',
    backgroundColor: Colors.card, borderRadius: 10,
    padding: 10, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  tickerDone: { borderColor: Colors.green + '60' },
  tickerVal:  { color: Colors.cyan, fontSize: 17, fontWeight: '800' },
  tickerUnit: { color: Colors.t3, fontSize: 10, fontWeight: '400' },
  tickerLabel:{ color: Colors.t3, fontSize: 9, marginTop: 3, textAlign: 'center' },

  // ── Pipeline log ─────────────────────────────────────────────────────────────
  logCard: {
    marginHorizontal: 14, backgroundColor: Colors.card,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 12,
  },
  logHeader:  { color: Colors.t1, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  logDivider: { height: 1, backgroundColor: Colors.border, marginBottom: 10 },
  logRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  logDot:     { fontSize: 12, width: 16 },
  logBody:    { flex: 1 },
  logStage:   { color: Colors.t2, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  logMsg:     { color: Colors.t3, fontSize: 11, marginTop: 1 },
  logPct:     { color: Colors.t3, fontSize: 11 },
});
