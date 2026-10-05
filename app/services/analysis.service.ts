/**
 * analysis.service.ts
 * Runs a video analysis session.
 * REAL: POSTs video to pipeline SSE endpoint → streams progress → returns result.
 * MOCK fallback: simulates stages when pipeline is offline.
 */
import { API_BASE } from "./api";
import { Session } from "../types";

const PROGRESS_STAGES = [
  { stage: "decode",           pct: 5,   msg: "Extracting and decoding video frames" },
  { stage: "stabilize",        pct: 12,  msg: "Stabilizing footage — removing camera shake" },
  { stage: "pose_detection",   pct: 30,  msg: "Running pose estimation on athlete body" },
  { stage: "object_detection", pct: 45,  msg: "Detecting wheelchair and tracking wheel mechanics" },
  { stage: "optical_flow",     pct: 55,  msg: "Computing rim speed and trajectory data" },
  { stage: "feature_p01_p04", pct: 65,  msg: "Extracting propulsion, symmetry and stability metrics" },
  { stage: "feature_p05_p08", pct: 73,  msg: "Measuring reaction speed, coverage and technique" },
  { stage: "feature_p09_p14", pct: 82,  msg: "Computing pressure response, fatigue and injury signals" },
  { stage: "scoring",          pct: 90,  msg: "Scoring each metric against classification baseline" },
  { stage: "feedback",         pct: 96,  msg: "Generating scouting and coaching report" },
  { stage: "complete",         pct: 100, msg: "Analysis complete" },
];

/** Build a Session object from a raw pipeline API result */
function buildSession(result: any): Session {
  const vm = result.video_metadata ?? {};
  return {
    id:          result.session_id ?? `sess_${Date.now()}`,
    athleteId:   result.athlete_id ?? 'unknown',
    sport:       result.sport ?? '',
    sportLabel:  result.sport?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? '',
    ipcClass:    result.ipc_class ?? '',
    date:        new Date().toISOString().split('T')[0],
    duration:    vm.duration_sec
      ? `${Math.floor(vm.duration_sec / 60)}m ${Math.round(vm.duration_sec % 60)}s`
      : '—',
    videoFile:    vm.filename,
    overallScore: 0,
    score:        0,
    metricCards:  result.metric_cards ?? [],
    feedback: {
      scout_feedback: result.feedback?.scout_feedback ?? '',
      coach_feedback: result.feedback?.coach_feedback ?? '',
    },
    aiLog: (result.ai_log ?? []).map((l: any) => ({ msg: l.msg, type: l.type ?? 'good' })),
  };
}

export const analysisService = {
  runAnalysis: async (
    payload: { videoUri: string; sport: string; ipcClass: string; athleteId: string; athleteName?: string; fileName?: string },
    onProgress: (p: { stage: string; pct: number; msg: string }) => void,
    onMetricTick: (m: any) => void,
  ): Promise<Session> => {

    // ── Try real pipeline SSE ──────────────────────────────────────────────────
    if (payload.videoUri) {
      try {
        const form = new FormData();
        const isWeb = typeof document !== 'undefined';

        if (isWeb) {
          const resp = await fetch(payload.videoUri);
          const blob = await resp.blob();
          form.append('video', blob, payload.fileName ?? 'video.mp4');
        } else {
          (form as any).append('video', {
            uri: payload.videoUri,
            name: payload.fileName ?? 'video.mp4',
            type: 'video/mp4',
          });
        }
        form.append('sport',        payload.sport);
        form.append('ipc_class',    payload.ipcClass);
        form.append('athlete_id',   payload.athleteId);
        form.append('athlete_name', payload.athleteName ?? 'Athlete');

        const response = await fetch(`${API_BASE}/analyse`, { method: 'POST', body: form });
        if (!response.ok || !response.body) throw new Error('SSE stream unavailable');

        const reader  = response.body.getReader();
        const decoder = new TextDecoder();
        let buf = '', currentEvent = '';

        // Start metric ticker
        const tickTimer = setInterval(() => {
          onMetricTick({
            speed:   (3.0 + Math.random() * 1.5).toFixed(1),
            accel:   (1.5 + Math.random() * 1.5).toFixed(1),
            cadence: Math.round(38 + Math.random() * 20),
            rsi:     Math.round(10 + Math.random() * 15),
            turnR:   (0.7 + Math.random() * 0.5).toFixed(1),
            sym:     Math.round(80 + Math.random() * 15),
          });
        }, 450);

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop() ?? '';
            for (const line of lines) {
              if (line.startsWith('event:')) { currentEvent = line.slice(6).trim(); continue; }
              if (!line.startsWith('data:')) continue;
              try {
                const payload2 = JSON.parse(line.slice(5).trim());
                const stageIdx = PROGRESS_STAGES.findIndex(s => s.stage === currentEvent);
                if (stageIdx >= 0) onProgress(PROGRESS_STAGES[stageIdx]);
                if (currentEvent === 'complete' && payload2.result) {
                  clearInterval(tickTimer);
                  return buildSession(payload2.result);
                }
              } catch (_) {}
            }
          }
        } finally {
          clearInterval(tickTimer);
        }
      } catch (err) {
        console.warn('[analysis.service] Pipeline SSE failed → mock fallback:', err);
      }
    }

    // ── Mock fallback (pipeline offline) ──────────────────────────────────────
    const DELAY = 900;
    let tickInterval: ReturnType<typeof setInterval>;
    tickInterval = setInterval(() => {
      onMetricTick({
        speed:   (3.0 + Math.random() * 1.5).toFixed(1),
        accel:   (1.5 + Math.random() * 1.5).toFixed(1),
        cadence: Math.round(38 + Math.random() * 20),
        rsi:     Math.round(10 + Math.random() * 15),
        turnR:   (0.7 + Math.random() * 0.5).toFixed(1),
        sym:     Math.round(80 + Math.random() * 15),
      });
    }, 450);
    for (const stage of PROGRESS_STAGES) {
      await new Promise(r => setTimeout(r, DELAY));
      onProgress(stage);
    }
    clearInterval(tickInterval);

    // Return a minimal empty session so the dashboard renders an empty state
    return {
      id:          `sess_${Date.now()}`,
      athleteId:   payload.athleteId,
      sport:       payload.sport,
      sportLabel:  payload.sport.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      ipcClass:    payload.ipcClass,
      date:        new Date().toISOString().split('T')[0],
      duration:    '—',
      overallScore: 0,
      score:        0,
      metricCards:  [],
      feedback:     { scout_feedback: '', coach_feedback: '' },
      aiLog:        [{ msg: 'Pipeline offline — no real metrics available', type: 'warn' }],
    };
  },
};

export const runAnalysis = analysisService.runAnalysis.bind(analysisService);
