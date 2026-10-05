/**
 * dummy.data.ts
 * Shared dummy / seed data for the ParaSync Expo app.
 * All Session objects exactly match the Session type from types/index.ts.
 * Used as fallbacks when the backend API returns empty or is unreachable.
 */
import type { Session, MetricCard } from '../types';

// ─── Metric card builders ────────────────────────────────────────────────────
function mc(id: string, pillar: string, label: string, value: number | string, unit: string | null, score: number): MetricCard {
  return { id, pillar, label, value, unit, score, higher_is_better: true, trend: null, trend_unit: null };
}

// ─── Sessions (match Session type exactly) ───────────────────────────────────
export const DUMMY_SESSIONS: Session[] = [
  {
    id: 's1',
    athleteId: 'a1',
    date: '2026-09-28',
    duration: '6:42',
    sport: 'wheelchair_basketball',
    sportLabel: 'Wheelchair Basketball',
    ipcClass: 'Class 3',
    videoFile: 'training_sep28.mp4',
    overallScore: 84,
    score: 84,
    metricCards: [
      mc('p1_max_speed',       'Propulsion', 'Max Speed',        '4.2 m/s', 'm/s', 88),
      mc('p1_push_symmetry',   'Propulsion', 'Push Symmetry',    '93%',     '%',   91),
      mc('p1_push_cadence',    'Propulsion', 'Push Cadence',     '72 rpm',  'rpm', 84),
      mc('p2_turn_radius',     'Agility',    'Turn Radius',      '1.1 m',   'm',   79),
      mc('p2_dir_change',      'Agility',    'Direction Change', '0.6 s',   's',   81),
      mc('p3_speed_drop',      'Fatigue',    'Speed Drop',       '8%',      '%',   85),
      mc('p12_rsi_risk_level', 'Fatigue',    'RSI Score',        '0.12',    '',    78),
    ],
    feedback: {
      scout_feedback: 'Strong session — propulsion metrics at elite level for Class 3. Shortlist candidate.',
      coach_feedback: 'Excellent work. Push symmetry improving week-over-week. Watch RSI — reduce load next training block.',
      athlete_feedback: 'You are pushing at 93% symmetry — world-class for your classification. Focus on recovery this week.',
    },
    aiLog: [
      { msg: 'Push symmetry at 93% — excellent bilateral balance for Class 3.', type: 'good' },
      { msg: 'Max speed consistent across all 3 court lengths.', type: 'good' },
      { msg: 'RSI score elevated — consider reducing session intensity next week.', type: 'warn' },
      { msg: 'Try 2-push crossover drill to improve direction change time.', type: 'good' },
    ],
  },
  {
    id: 's2',
    athleteId: 'a1',
    date: '2026-09-21',
    duration: '5:18',
    sport: 'wheelchair_basketball',
    sportLabel: 'Wheelchair Basketball',
    ipcClass: 'Class 3',
    videoFile: 'training_sep21.mp4',
    overallScore: 79,
    score: 79,
    metricCards: [
      mc('p1_max_speed',     'Propulsion', 'Max Speed',        '3.9 m/s', 'm/s', 81),
      mc('p1_push_symmetry', 'Propulsion', 'Push Symmetry',    '88%',     '%',   84),
      mc('p1_push_cadence',  'Propulsion', 'Push Cadence',     '68 rpm',  'rpm', 79),
      mc('p2_turn_radius',   'Agility',    'Turn Radius',      '1.3 m',   'm',   74),
      mc('p2_dir_change',    'Agility',    'Direction Change', '0.8 s',   's',   78),
      mc('p3_speed_drop',    'Fatigue',    'Speed Drop',       '12%',     '%',   74),
      mc('p12_rsi_risk_level','Fatigue',   'RSI Score',        '0.15',    '',    80),
    ],
    feedback: {
      scout_feedback: 'Good improvement trend. Cadence up 3 rpm from prior session.',
      coach_feedback: 'Good effort. Speed drop in final quarter — focus on aerobic base.',
      athlete_feedback: 'Your cadence is improving. Keep it up — target 72+ rpm next session.',
    },
    aiLog: [
      { msg: 'Improved cadence from last session.', type: 'good' },
      { msg: 'Speed drop of 12% in final quarter — monitor fatigue levels.', type: 'warn' },
    ],
  },
  {
    id: 's3',
    athleteId: 'a1',
    date: '2026-09-14',
    duration: '4:55',
    sport: 'wheelchair_basketball',
    sportLabel: 'Wheelchair Basketball',
    ipcClass: 'Class 3',
    videoFile: 'training_sep14.mp4',
    overallScore: 72,
    score: 72,
    metricCards: [
      mc('p1_max_speed',     'Propulsion', 'Max Speed',     '3.7 m/s', 'm/s', 74),
      mc('p1_push_symmetry', 'Propulsion', 'Push Symmetry', '85%',     '%',   78),
      mc('p1_push_cadence',  'Propulsion', 'Push Cadence',  '65 rpm',  'rpm', 70),
      mc('p3_speed_drop',    'Fatigue',    'Speed Drop',    '15%',     '%',   68),
      mc('p12_rsi_risk_level','Fatigue',   'RSI Score',     '0.18',    '',    72),
    ],
    feedback: {
      scout_feedback: 'Baseline session. Potential visible — needs development.',
      coach_feedback: 'First benchmark session. Areas to improve: cadence and endurance.',
      athlete_feedback: 'Great first analysis! Work on increasing your push cadence by 5-8 rpm.',
    },
    aiLog: [
      { msg: 'Increase push cadence by 5-8 rpm to improve speed.', type: 'good' },
    ],
  },
];

// ─── Athletes ────────────────────────────────────────────────────────────────
export const DUMMY_ATHLETES = [
  { id: 'a1', name: 'Arjun Mehta',   sport: 'wheelchair_basketball', ipc_class: 'Class 3', state: 'Maharashtra', latestScore: 84, sessionCount: 12, trend: 'up'   },
  { id: 'a2', name: 'Priya Sharma',  sport: 'wheelchair_tennis',     ipc_class: 'Class 1', state: 'Delhi',       latestScore: 76, sessionCount: 8,  trend: 'up'   },
  { id: 'a3', name: 'Rohit Das',     sport: 'para_athletics',        ipc_class: 'T54',     state: 'West Bengal', latestScore: 91, sessionCount: 17, trend: 'up'   },
  { id: 'a4', name: 'Kavya Nair',    sport: 'wheelchair_badminton',  ipc_class: 'WH1',     state: 'Kerala',      latestScore: 68, sessionCount: 5,  trend: 'down' },
  { id: 'a5', name: 'Siddharth Rao', sport: 'wheelchair_basketball', ipc_class: 'Class 2', state: 'Karnataka',   latestScore: 79, sessionCount: 10, trend: 'up'   },
  { id: 'a6', name: 'Meena Patel',   sport: 'para_athletics',        ipc_class: 'T52',     state: 'Gujarat',     latestScore: 88, sessionCount: 14, trend: 'up'   },
];

// ─── Score trend ─────────────────────────────────────────────────────────────
export const DUMMY_SCORE_TREND = [
  { date: 'Sep 1',  score: 71 },
  { date: 'Sep 8',  score: 74 },
  { date: 'Sep 14', score: 72 },
  { date: 'Sep 21', score: 79 },
  { date: 'Sep 28', score: 84 },
];

// ─── Video sessions ──────────────────────────────────────────────────────────
export const DUMMY_VIDEO_SESSIONS = [
  {
    id: 'vs1', title: 'Propulsion Drills Review',
    coachId: 'c1', coachName: 'Coach Ramesh Kumar',
    athleteId: 'a1', athleteName: 'Arjun Mehta',
    scheduledAt: '2026-10-05T10:00:00',
    createdAt: '2026-10-01T09:00:00',
    status: 'accepted' as const,
    meetLink: 'https://meet.google.com/abc-defg-hij',
    notes: 'Focus on push symmetry and crossover drills',
  },
  {
    id: 'vs2', title: 'Sprint Form Analysis',
    coachId: 'c1', coachName: 'Coach Ramesh Kumar',
    athleteId: 'a1', athleteName: 'Arjun Mehta',
    scheduledAt: '2026-09-30T14:00:00',
    createdAt: '2026-09-28T10:00:00',
    status: 'completed' as const,
    meetLink: 'https://meet.google.com/xyz-abcd-efg',
    recordingUrl: 'https://example.com/recordings/sprint_sep30.mp4',
    notes: 'Recorded session — review push mechanics at 0:42 mark',
  },
  {
    id: 'vs3', title: 'Fatigue Management Session',
    coachId: 'c1', coachName: 'Coach Ramesh Kumar',
    athleteId: 'a1', athleteName: 'Arjun Mehta',
    scheduledAt: '2026-10-10T11:00:00',
    createdAt: '2026-10-02T08:00:00',
    status: 'pending' as const,
    notes: 'Reviewing RSI management and load reduction strategies',
  },
];

// ─── Smartwatch metrics ──────────────────────────────────────────────────────
export const DUMMY_WATCH_METRICS = {
  heartRate: 72,
  hrv: 48,
  spo2: 98,
  stressScore: 28,
  steps: 4200,
  activeMinutes: 38,
  calories: 310,
  sleepHours: 7.4,
  restingHR: 62,
  hrvTrend: [42, 45, 43, 48, 51, 48, 52],
  connected: true,
};

// ─── Scout/coach log entries ─────────────────────────────────────────────────
export const DUMMY_LOG_ENTRIES = [
  { id: 'l1', tag: 'strength',    text: 'Outstanding propulsion during the Sep 28 session — Class 3 elite tier. Push symmetry at 93%.', createdAt: '2026-09-28', authorName: 'Scout Vijay' },
  { id: 'l2', tag: 'concern',     text: 'RSI score spiking. Recommend reduced load week and smartwatch HRV monitoring before next upload.', createdAt: '2026-09-28', authorName: 'Scout Vijay' },
  { id: 'l3', tag: 'improvement', text: 'Push cadence improved by 6 rpm over the last 3 sessions. Consistent positive trend.', createdAt: '2026-09-21', authorName: 'Scout Vijay' },
  { id: 'l4', tag: 'milestone',   text: 'First session above 80 overall score. Significant performance breakthrough.', createdAt: '2026-09-14', authorName: 'Scout Vijay' },
  { id: 'l5', tag: 'observation', text: 'Strong mental focus but needs more cooldown time post-session.', createdAt: '2026-09-07', authorName: 'Scout Vijay' },
];

// ─── Training plans ──────────────────────────────────────────────────────────
export const DUMMY_TRAINING = [
  { id: 't1', title: 'Propulsion Interval Set',  description: '5×200m sprints with 90s rest. Maintain push symmetry above 90%.', targetPillar: 'Propulsion', dueDate: '2026-10-07', status: 'in_progress' as const, coachName: 'Coach Ramesh Kumar' },
  { id: 't2', title: 'Agility Circuit',           description: '10-cone slalom, 3 sets. Aim sub-0.6s direction change.', targetPillar: 'Agility',    dueDate: '2026-10-04', status: 'assigned'    as const, coachName: 'Coach Ramesh Kumar' },
  { id: 't3', title: 'Recovery Session',          description: '20-min low-intensity roll + stretching. Monitor HRV via smartwatch.', targetPillar: 'Fatigue',    dueDate: '2026-10-03', status: 'completed'   as const, coachName: 'Coach Ramesh Kumar' },
];

// ─── Coach roster ─────────────────────────────────────────────────────────────
export const DUMMY_ROSTER = [
  { id: 'a1', name: 'Arjun Mehta',   sport: 'wheelchair_basketball', ipc_class: 'Class 3', latestScore: 84, sessionCount: 12, status: 'active'   },
  { id: 'a3', name: 'Rohit Das',     sport: 'para_athletics',        ipc_class: 'T54',     latestScore: 91, sessionCount: 17, status: 'active'   },
  { id: 'a5', name: 'Siddharth Rao', sport: 'wheelchair_basketball', ipc_class: 'Class 2', latestScore: 79, sessionCount: 10, status: 'active'   },
  { id: 'a4', name: 'Kavya Nair',    sport: 'wheelchair_badminton',  ipc_class: 'WH1',     latestScore: 68, sessionCount: 5,  status: 'inactive' },
];

// ─── Connection requests ──────────────────────────────────────────────────────
export const DUMMY_REQUESTS = [
  { id: 'r1', fromId: 'a4', fromName: 'Kavya Nair',  sport: 'wheelchair_badminton', ipc_class: 'WH1',     state: 'Kerala',     requestedAt: '2026-10-01', status: 'pending' },
  { id: 'r2', fromId: 'a7', fromName: 'Vijay Kumar', sport: 'wheelchair_tennis',    ipc_class: 'Class 2', state: 'Tamil Nadu', requestedAt: '2026-10-02', status: 'pending' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function sportLabel(sport: string): string {
  return (sport ?? '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function scoreColor(score: number): string {
  if (score >= 85) return '#22c55e';
  if (score >= 70) return '#00d4ff';
  if (score >= 55) return '#eab308';
  return '#ef4444';
}
