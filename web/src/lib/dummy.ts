/**
 * dummy.ts — Shared dummy data for ParaSync web platform.
 * Used across scout dashboard, coach dashboard, athlete profiles, etc.
 * Provides realistic-looking para-athlete data for demos.
 */

export const DUMMY_ATHLETES = [
  { id: "a1", name: "Arjun Mehta",     sport: "wheelchair_basketball", ipc_class: "Class 3", state: "Maharashtra", latestScore: 84, sessionCount: 12, trend: "up"   },
  { id: "a2", name: "Priya Sharma",    sport: "wheelchair_tennis",     ipc_class: "Class 1", state: "Delhi",       latestScore: 76, sessionCount: 8,  trend: "up"   },
  { id: "a3", name: "Rohit Das",       sport: "para_athletics",        ipc_class: "T54",     state: "West Bengal", latestScore: 91, sessionCount: 17, trend: "up"   },
  { id: "a4", name: "Kavya Nair",      sport: "wheelchair_badminton",  ipc_class: "WH1",     state: "Kerala",      latestScore: 68, sessionCount: 5,  trend: "down" },
  { id: "a5", name: "Siddharth Rao",   sport: "wheelchair_basketball", ipc_class: "Class 2", state: "Karnataka",   latestScore: 79, sessionCount: 10, trend: "up"   },
  { id: "a6", name: "Meena Patel",     sport: "para_athletics",        ipc_class: "T52",     state: "Gujarat",     latestScore: 88, sessionCount: 14, trend: "up"   },
  { id: "a7", name: "Vijay Kumar",     sport: "wheelchair_tennis",     ipc_class: "Class 2", state: "Tamil Nadu",  latestScore: 72, sessionCount: 6,  trend: "flat" },
  { id: "a8", name: "Anjali Singh",    sport: "wheelchair_basketball", ipc_class: "Class 4", state: "Uttar Pradesh",latestScore: 81, sessionCount: 9,  trend: "up"   },
];

export const DUMMY_SESSIONS = [
  {
    id: "s1", athleteId: "a1", date: "2026-09-28", sport: "wheelchair_basketball", ipc_class: "Class 3",
    overallScore: 84, duration: "6:42",
    pillars: [
      { name: "Propulsion", score: 88, metrics: [{ label: "Max Speed", value: "4.2 m/s", score: 88 }, { label: "Push Symmetry", value: "93%", score: 91 }, { label: "Push Cadence", value: "72 rpm", score: 84 }] },
      { name: "Agility",    score: 79, metrics: [{ label: "Turn Radius", value: "1.1 m",  score: 79 }, { label: "Direction Change", value: "0.6 s", score: 81 }] },
      { name: "Fatigue",    score: 82, metrics: [{ label: "Speed Drop", value: "8%",  score: 85 }, { label: "RSI Score", value: "0.12", score: 78 }] },
    ],
    aiLog: [
      { type: "strength",  msg: "Push symmetry at 93% — excellent bilateral balance for Class 3." },
      { type: "strength",  msg: "Max speed consistent across all 3 court lengths." },
      { type: "warn",      msg: "RSI score elevated — consider reducing session intensity next week." },
      { type: "tip",       msg: "Try 2-push crossover drill to improve direction change time." },
    ],
  },
  {
    id: "s2", athleteId: "a1", date: "2026-09-21", sport: "wheelchair_basketball", ipc_class: "Class 3",
    overallScore: 79, duration: "5:18",
    pillars: [
      { name: "Propulsion", score: 81, metrics: [{ label: "Max Speed", value: "3.9 m/s", score: 81 }, { label: "Push Symmetry", value: "88%", score: 84 }, { label: "Push Cadence", value: "68 rpm", score: 79 }] },
      { name: "Agility",    score: 76, metrics: [{ label: "Turn Radius", value: "1.3 m",  score: 74 }, { label: "Direction Change", value: "0.8 s", score: 78 }] },
      { name: "Fatigue",    score: 77, metrics: [{ label: "Speed Drop", value: "12%",  score: 74 }, { label: "RSI Score", value: "0.15", score: 80 }] },
    ],
    aiLog: [
      { type: "strength",  msg: "Improved cadence from last session." },
      { type: "warn",      msg: "Speed drop of 12% in final quarter — monitor fatigue levels." },
    ],
  },
  {
    id: "s3", athleteId: "a3", date: "2026-09-30", sport: "para_athletics", ipc_class: "T54",
    overallScore: 91, duration: "4:30",
    pillars: [
      { name: "Propulsion", score: 94, metrics: [{ label: "Max Speed", value: "5.1 m/s", score: 95 }, { label: "Push Symmetry", value: "97%", score: 96 }, { label: "Push Cadence", value: "88 rpm", score: 91 }] },
      { name: "Fatigue",    score: 88, metrics: [{ label: "Speed Drop", value: "4%",  score: 91 }, { label: "RSI Score", value: "0.07", score: 85 }] },
    ],
    aiLog: [
      { type: "strength",  msg: "Elite-level push symmetry — among top 5% for T54 class." },
      { type: "strength",  msg: "Minimal fatigue across entire distance." },
      { type: "tip",       msg: "Focus on start-phase acceleration for 100m events." },
    ],
  },
];

export const DUMMY_SCORE_TREND = [
  { date: "Sep 1",  score: 71 },
  { date: "Sep 8",  score: 74 },
  { date: "Sep 14", score: 72 },
  { date: "Sep 21", score: 79 },
  { date: "Sep 28", score: 84 },
];

export const DUMMY_VIDEO_SESSIONS = [
  { id: "vs1", coachName: "Coach Ramesh", date: "2026-10-05 10:00", status: "accepted",  meetLink: "https://meet.google.com/abc-defg-hij", title: "Propulsion Drills Review" },
  { id: "vs2", coachName: "Coach Ramesh", date: "2026-09-30 14:00", status: "completed", recordingUrl: "https://example.com/recording1", title: "Sprint Form Analysis" },
  { id: "vs3", coachName: "Coach Ramesh", date: "2026-10-10 11:00", status: "pending",   title: "Fatigue Management" },
];

export const DUMMY_WATCH_METRICS = {
  heartRate: 72,
  hrv: 48,
  spo2: 98,
  stressScore: 28,
  steps: 4200,
  activeMinutes: 38,
  calories: 310,
};

export const DUMMY_LOG_ENTRIES = [
  { id: "l1", tag: "strength",    text: "Outstanding propulsion during the Sep 28 session — Class 3 elite tier.", createdAt: "2026-09-28" },
  { id: "l2", tag: "concern",     text: "RSI score spiking — recommend a reduced load week.", createdAt: "2026-09-28" },
  { id: "l3", tag: "improvement", text: "Push cadence improved by 6 rpm over last 3 sessions.", createdAt: "2026-09-21" },
  { id: "l4", tag: "milestone",   text: "First session with overall score above 80. Significant progress.", createdAt: "2026-09-14" },
  { id: "l5", tag: "observation", text: "Athlete shows strong mental focus but needs more cooldown time.", createdAt: "2026-09-07" },
];

export const DUMMY_REQUESTS = [
  { id: "r1", name: "Kavya Nair",    sport: "wheelchair_badminton", ipc_class: "WH1", state: "Kerala",    status: "pending" },
  { id: "r2", name: "Vijay Kumar",   sport: "wheelchair_tennis",    ipc_class: "Class 2", state: "Tamil Nadu", status: "pending" },
];

export const DUMMY_TRAINING = [
  { id: "t1", title: "Propulsion Interval Set", description: "5×200m sprints with 90s rest. Focus on maintaining push symmetry above 90%.", targetPillar: "Propulsion", dueDate: "2026-10-07", status: "in_progress" },
  { id: "t2", title: "Agility Circuit",          description: "10-cone slalom course, 3 sets. Aim for sub-0.6s direction change.", targetPillar: "Agility",    dueDate: "2026-10-04", status: "assigned" },
  { id: "t3", title: "Recovery Session",         description: "Low-intensity 20-min roll + stretching. Monitor HRV via smartwatch.", targetPillar: "Fatigue",    dueDate: "2026-10-03", status: "completed" },
];

/** Sport display name helper */
export function sportLabel(sport: string): string {
  return sport.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
