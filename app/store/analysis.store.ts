import { create } from "zustand";
import { MetricCard, Session } from "../types";

export type AnalysisStatus = "idle"|"uploading"|"processing"|"complete"|"error";

interface ProgressEvent { stage: string; pct: number; msg: string; }

interface CurrentAnalysisPayload {
  sport: string;
  ipcClass?: string;
  classification?: string;  // alias for ipcClass
  fileName?: string;
  metrics?: string[];
  videoUri?: string;
  videoBlob?: Blob;         // pre-read blob (web only) to avoid refetching expired object URLs
  athleteId?: string;
  /** Set when this upload is fulfilling a coach's session request (see
   *  SessionRequest in pipeline/database.py) — passed through to /analyse
   *  so the backend marks the request fulfilled once the session is saved. */
  sessionRequestId?: string;
  sessionRequestMessage?: string;
  /** Unique per "Run AI Analysis" tap — lets the processing screen (a hidden
   *  tab that never unmounts) detect a new run request and start over instead
   *  of just re-showing the previous video's finished state. */
  startedAt?: number;
}

interface AnalysisState {
  status: AnalysisStatus;
  progress: number;
  currentStage: string;
  stageMessage: string;
  stages: ProgressEvent[];
  liveMetrics: { speed: number; accel: number; cadence: number; rsi: number; turnR: number; sym: number };
  currentSession: Session | null;
  /** The in-flight analysis request payload */
  currentAnalysis: CurrentAnalysisPayload | null;
  /** Completed analysis result (same as currentSession after run) */
  result: Session | null;
  setStatus: (s: AnalysisStatus) => void;
  setProgress: (p: ProgressEvent) => void;
  setLiveMetrics: (m: Partial<AnalysisState["liveMetrics"]>) => void;
  setCurrentSession: (s: Session | null) => void;
  setCurrentAnalysis: (a: CurrentAnalysisPayload | null) => void;
  setResult: (r: Session | null) => void;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  status: "idle",
  progress: 0,
  currentStage: "",
  stageMessage: "",
  stages: [],
  liveMetrics: { speed: 0, accel: 0, cadence: 0, rsi: 0, turnR: 0, sym: 0 },
  currentSession: null,
  currentAnalysis: null,
  result: null,
  setStatus: (status) => set({ status }),
  setProgress: (p) => set((s) => ({
    progress: p.pct,
    currentStage: p.stage,
    stageMessage: p.msg,
    stages: [...s.stages, p],
  })),
  setLiveMetrics: (m) => set((s) => ({ liveMetrics: { ...s.liveMetrics, ...m } })),
  setCurrentSession: (currentSession) => set({ currentSession }),
  setCurrentAnalysis: (currentAnalysis) => set({ currentAnalysis }),
  setResult: (result) => set({ result, currentSession: result }),
  reset: () => set({
    status: "idle", progress: 0, currentStage: "", stageMessage: "",
    stages: [], liveMetrics: { speed: 0, accel: 0, cadence: 0, rsi: 0, turnR: 0, sym: 0 },
    currentSession: null, currentAnalysis: null, result: null,
  }),
}));
