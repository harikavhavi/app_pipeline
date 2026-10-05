# ParaSync 2.0 — Master Implementation Plan

> **Team Code Blooded · NIT Rourkela · Samsung Solve For Tomorrow 2026 — Top 100**

---

## 0 · System Overview

ParaSync 2.0 is **two repositories working as one product:**

```
┌──────────────────────────────────┐        ┌───────────────────────────────────┐
│   REPO 1: parasync-v2            │        │   REPO 2: parasync-pipeline       │
│   React Native + Expo            │        │   Python · FastAPI · CV Server    │
│                                  │        │                                   │
│   5 user roles · 38 screens      │◄──────►│   14 biomechanics pillars         │
│   Athlete / Coach / Scout /      │  JSON  │   57 video-only sub-metrics       │
│   Federation / Guest             │  API   │   MediaPipe + YOLOv8n + OpenCV    │
│                                  │        │                                   │
│   C:\Users\harik\Downloads\      │        │   C:\Users\harik\Downloads\       │
│   parasync-v2\                   │        │   parasync-pipeline\              │
└──────────────────────────────────┘        └───────────────────────────────────┘
```

**Rules across both repos:**
- ✅ Video-only metrics — no SpO2, HR, BP, temperature, force sensors
- ❌ No composite scores — every sub-metric gets its own individual score
- ❌ No fitness judgment — we display values, not verdicts
- ✅ Mock data first — API layer structured so real backend swaps in without screen changes

---

## 1 · Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Mobile App | React Native + Expo (SDK 52+) | Cross-platform mobile, real device testing via Expo Go |
| Routing | Expo Router (file-based) | Best for 38 screens across 5 role groups |
| State | Zustand + AsyncStorage | Lightweight, no boilerplate, persists role/session |
| Charts | react-native-svg | Native SVG for performance charts + radar chart |
| Fonts | @expo-google-fonts/inter + outfit | Matches existing v1 design exactly |
| CV Server | Python 3.11 + FastAPI | Async HTTP + SSE progress streaming |
| Pose Estimation | MediaPipe BlazePose (FULL) | 33 3D keypoints, CPU-friendly, handles wheelchair occlusion |
| Object Detection | YOLOv8n | Detects athlete, wheelchair frame, wheels, ball per sport |
| Optical Flow | OpenCV Farneback | Wheel rotation → rim speed (v = ω × r) |
| Math | NumPy + SciPy | Angles, FFT, DTW, Kalman, regression |
| Progress Stream | SSE (sse-starlette) | Real-time progress events to the A-03 processing screen |

---

## 2 · How the Two Repos Connect

```
Athlete on App
     │
     ▼
A-02 Upload screen
  expo-document-picker selects video file
     │
     ▼ POST /analyse (multipart: video + sport + ipc_class + athlete_id)
     │
parasync-pipeline FastAPI server
  ├── Stage 1: Decode + Stabilize + Scale
  ├── Stage 2A: MediaPipe BlazePose → 33 keypoints/frame
  ├── Stage 2B: YOLOv8n → wheelchair + wheel + ball
  ├── Stage 3: Optical Flow → rim speed + kinematics
  ├── Stage 4: 14-Pillar Feature Engine (sport-dispatched)
  ├── Stage 5: Individual Scorer → score per sub-metric
  └── Stage 6: Feedback Generator → 3–4 line text
     │
     ▼ SSE events → A-03 Processing Screen (live progress bar + ticker)
     │
     ▼ Final JSON → analysis.service.ts stores result
     │
     ▼
A-04 Dashboard Screen
  Renders metric_cards[] → one card per sub-metric
```

**API contract:**
```ts
// services/analysis.service.ts  (in parasync-v2)
// MOCK: returns simulated result after delay
// REAL: uncomment to call actual pipeline server
export async function runAnalysis(payload: AnalysisPayload): Promise<AnalysisResult> {
  // --- MOCK (current) ---
  await simulateDelay(9500);
  return generateMockResult(payload.sport, payload.classification);

  // --- REAL (swap when pipeline is ready) ---
  // const res = await api.post('/analyse', payload, { responseType: 'stream' });
  // return streamSSEToStore(res, useAnalysisStore);
}
```

---

## 3 · User Roles & Their Distinct Flows

| Role | Accent | Tabs | Core Action |
|---|---|---|---|
| **Athlete** | `#00d4ff` Cyan | Home · Analyse · Dashboard · Scout · Profile | Upload video → see individual metric cards |
| **Coach** | `#3b82f6` Blue | Home · Roster · Upload · Analytics · Settings | Monitor squad, compare sessions, assign drills |
| **Scout** | `#a855f7` Purple | Home · Browse · Shortlist · Messages · Profile | Find verified athletes, filter by metrics, connect |
| **Federation** | `#f97316` Orange | Overview · Registry · Events · Admin | Manage athlete registry, publish events |
| **Guest** | `rgba(255,255,255,0.55)` | (stack, no tabs) | Browse public athletes → soft sign-up wall |

---

## 4 · REPO 1 — Mobile App (`parasync-v2`)

### 4.1 Folder Structure

```
parasync-v2/
├── app/
│   ├── _layout.tsx                    ← Root layout (fonts, safe area, role router)
│   ├── index.tsx                      ← Splash → role-select
│   │
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── role-select.tsx            ← S-01: 4 role cards (2×2) + Guest ghost button
│   │   ├── login.tsx                  ← S-03: Email + password → role-specific home
│   │   ├── forgot-password.tsx        ← S-04
│   │   └── signup/
│   │       ├── athlete.tsx            ← S-02a: Name, Sport, IPC Class, DOB, discoverability toggle
│   │       ├── coach.tsx              ← S-02b: Specialization, Federation, Certification upload
│   │       ├── scout.tsx              ← S-02c: Org, Level, Sports covered, credential upload
│   │       └── federation.tsx         ← S-02d: Org Name, Reg Number → "Application Submitted"
│   │
│   ├── (athlete)/                     ← Cyan accent
│   │   ├── _layout.tsx                ← Tabs: Home | Analyse | Dashboard | Scout | Profile
│   │   ├── home.tsx                   ← A-01: Greeting + scout stats + CTA + recent sessions
│   │   ├── upload.tsx                 ← A-02: Video picker + sport/class selectors + "Run Analysis"
│   │   ├── processing.tsx             ← A-03: Spinner + step list + SSE progress + live metric tickers
│   │   ├── dashboard.tsx              ← A-04: metric_cards[] grid (pillar groups) + AI log + share
│   │   ├── profile.tsx                ← A-05: Avatar + badges + 4-stat grid + session history
│   │   ├── history.tsx                ← A-06: Chronological session list → tap opens dashboard
│   │   ├── videos.tsx                 ← A-07: Video gallery + View Analysis / Share / Delete
│   │   ├── scout-network.tsx          ← A-08: Scout org cards + Connect button
│   │   ├── scout-activity.tsx         ← A-09: Timeline of scout views/connections
│   │   ├── progress.tsx               ← A-10: Radar chart + per-pillar trend lines
│   │   ├── safety.tsx                 ← A-11: RSI history + fatigue trend + warm-up suggestions
│   │   ├── my-coach.tsx               ← A-12: Linked coach + drills + messages
│   │   └── notifications.tsx          ← A-13: Unified feed (scout views, coach feedback, events)
│   │
│   ├── (coach)/                       ← Blue accent
│   │   ├── _layout.tsx                ← Tabs: Home | Roster | Upload | Analytics | Settings
│   │   ├── home.tsx                   ← B-01: RSI alert strip + roster quick-view + events
│   │   ├── roster.tsx                 ← B-02: Athlete list → tap opens athlete/[id]
│   │   ├── athlete/[id].tsx           ← B-03: Full athlete view + all sessions + drill assign
│   │   ├── upload.tsx                 ← B-04: Athlete selector + same upload flow as A-02
│   │   ├── compare.tsx                ← B-05: Two session pickers + metric delta table + chart
│   │   ├── drills.tsx                 ← B-06: Drill library assign + status per athlete
│   │   ├── analytics.tsx              ← B-07: Group avg trend + RSI heatmap + sport breakdown
│   │   ├── profile.tsx                ← B-08: Coach credentials + federation + edit
│   │   ├── scout-inbox.tsx            ← B-09: Scouts who contacted roster athletes
│   │   └── events.tsx                 ← B-10: Selection trials calendar + RSVP per athlete
│   │
│   ├── (scout)/                       ← Purple accent
│   │   ├── _layout.tsx                ← Tabs: Home | Browse | Shortlist | Messages | Profile
│   │   ├── home.tsx                   ← C-01: Top athletes this week + activity summary
│   │   ├── browse.tsx                 ← C-02: Search + filter chips (Sport/Class/State/Verified)
│   │   ├── athlete/[id].tsx           ← C-03: Athlete metric cards (read-only) + Shortlist/Connect
│   │   ├── shortlist.tsx              ← C-04: Saved athletes + notes + export PDF
│   │   ├── messages.tsx               ← C-05: Connection threads (pending/accepted/declined)
│   │   ├── reports.tsx                ← C-06: Export athlete PDF via expo-sharing
│   │   ├── analytics.tsx              ← C-07: Top performers by region/sport + class breakdown
│   │   └── profile.tsx                ← C-08: Scout profile + verified badge + credential status
│   │
│   ├── (federation)/                  ← Orange accent
│   │   ├── _layout.tsx                ← Tabs: Overview | Registry | Events | Admin
│   │   ├── dashboard.tsx              ← D-01: KPI cards (total athletes, events, connections)
│   │   ├── registry.tsx               ← D-02: Athletes under federation + verify/flag
│   │   ├── events.tsx                 ← D-03: Publish trials/camps + track RSVPs
│   │   ├── analytics.tsx              ← D-04: State-wise density + sport participation trends
│   │   └── settings.tsx               ← D-05: Federation profile + manage scout accounts
│   │
│   └── (guest)/                       ← Stack (no tabs)
│       ├── _layout.tsx
│       ├── landing.tsx                ← E-01: Hero + Browse Athletes + Sign Up CTAs
│       ├── showcase.tsx               ← E-02: Public gallery (opted-in) → 5 views → wall
│       ├── athlete/[id].tsx           ← E-03: Read-only profile + "Join to connect" banner
│       └── signup-wall.tsx            ← E-04: "Explored 5 profiles → sign up" CTA
│
├── components/
│   ├── ui/
│   │   ├── MetricCard.tsx             ← CORE: renders one dashboard metric card
│   │   │                                 props: { id, pillar, label, value, unit, score,
│   │   │                                          higher_is_better, trend, trend_unit }
│   │   ├── PillarSection.tsx          ← Groups MetricCards under one pillar header
│   │   ├── AthleteCard.tsx            ← Scout browse / coach roster list item
│   │   ├── SessionCard.tsx            ← History / home recent session row
│   │   ├── ScoreRing.tsx              ← Animated circular fill ring (per-metric score display)
│   │   ├── SafetyBadge.tsx            ← RSI risk level: LOW/MED/HIGH with color coding
│   │   ├── RoleChip.tsx               ← Sport + IPC class badge
│   │   ├── VideoThumb.tsx             ← Video gallery card
│   │   ├── ScoutCard.tsx              ← Scout org card for athlete scout-network screen
│   │   ├── AILogEntry.tsx             ← Single ai_log[] item with type (good/warn)
│   │   ├── FilterBar.tsx              ← Scout browse horizontal filter chips
│   │   └── Toast.tsx                  ← Global toast notification
│   ├── charts/
│   │   ├── PerformanceChart.tsx       ← react-native-svg line chart (metric over sessions)
│   │   ├── RadarChart.tsx             ← 6-axis radar for A-10 progress view
│   │   └── BarMetric.tsx              ← Animated horizontal fill bar (per sub-metric score)
│   ├── layout/
│   │   ├── Screen.tsx                 ← SafeAreaView + bg + optional orb layer
│   │   ├── Topbar.tsx                 ← Back arrow + title + right action
│   │   ├── OrbBackground.tsx          ← Animated gradient orbs (replicates CSS orbDrift)
│   │   └── GridBackground.tsx         ← Animated dot grid (splash/auth screens)
│   └── auth/
│       ├── RoleCard.tsx               ← Role selection card (monogram + name + desc + glow)
│       ├── FieldInput.tsx             ← Styled text input with label
│       └── FieldSelect.tsx            ← Picker / dropdown component
│
├── services/                          ← API layer (mock → real without screen changes)
│   ├── api.ts                         ← Base URL + axios instance
│   ├── auth.service.ts                ← login(), signup(), logout()
│   ├── athlete.service.ts             ← getSessions(), getProfile(), uploadVideo()
│   ├── analysis.service.ts            ← runAnalysis() ← ALGORITHM HOOK POINT
│   ├── scout.service.ts               ← browseAthletes(), connect(), shortlist()
│   ├── coach.service.ts               ← getRoster(), compareSession(), assignDrill()
│   └── federation.service.ts          ← getRegistry(), publishEvent()
│
├── store/                             ← Zustand stores
│   ├── auth.store.ts                  ← role, userId, userName, isLoggedIn
│   ├── athlete.store.ts               ← sessions[], profile, scoutActivity
│   ├── analysis.store.ts              ← currentSession, metricCards[], liveMetrics
│   └── scout.store.ts                 ← shortlist[], connections[], browseFilters
│
├── data/                              ← Mock data (replaced by API responses in production)
│   ├── mock-athletes.ts               ← 20 athlete profiles
│   ├── mock-sessions.ts               ← 50 sessions with full metric_cards[]
│   ├── mock-scouts.ts                 ← Scout + federation list
│   ├── mock-drills.ts                 ← Drill library
│   └── sport-metrics.ts               ← SPORT_METRICS config (pillar labels per sport)
│
├── constants/
│   ├── colors.ts                      ← All design tokens (ported from v1 CSS variables)
│   ├── typography.ts                  ← Font sizes, weights
│   ├── sports.ts                      ← 5 sports + IPC classification codes
│   └── roles.ts                       ← Role metadata: label, accent, monogram
│
├── hooks/
│   ├── useAnalysis.ts                 ← SSE listener + analysis store updater
│   ├── useScoutActivity.ts
│   ├── usePerformanceChart.ts
│   └── useRole.ts                     ← Returns current role + theme accent color
│
├── utils/
│   ├── initials.ts                    ← "Arjun Singh" → "AS"
│   ├── clamp.ts
│   ├── greeting.ts                    ← Time-based greeting
│   └── formatMetric.ts                ← 3.8000 → "3.8 m/s"
│
├── app.json
├── tsconfig.json
├── babel.config.js
└── package.json
```

### 4.2 Key App Screens

#### A-04 Dashboard — The Core Screen

This is where all 57 metric cards are rendered. Structure:

```
Athlete Hero Card (name, sport, IPC class, avatar)
Scout Visibility Toggle

─── Propulsion Power & Cadence ──────────────
  [Peak Rim Speed]   [Avg Rim Speed]   [Push Cadence]   [Contact Arc]

─── Bilateral Push Symmetry ─────────────────
  [Symmetry Ratio]   [Left Arc]   [Right Arc]   [Timing Offset]

─── Chair Maneuverability ───────────────────
  [Min Turning Radius]   [Angular Velocity]   [Braking Distance]   ...

─── (continued for all active pillars per sport) ────────

AI Analysis Log (ai_log[] items)
Scout/Coach Feedback cards (expandable)
Share Session button
```

Each `MetricCard` renders:
- Metric label
- Raw value + unit (e.g. `3.8 m/s`)
- `ScoreRing` — animated fill ring showing score 0–100
- `BarMetric` — horizontal fill bar, colored by score range
- Trend arrow + delta vs last session

#### A-03 Processing — SSE Live Updates

```tsx
// useAnalysis.ts listens to SSE from pipeline server
const progressEvents = [
  { stage: 'decode',           pct: 5,   msg: 'Extracting video frames' },
  { stage: 'stabilize',        pct: 12,  msg: 'Stabilizing footage' },
  { stage: 'pose_detection',   pct: 30,  msg: 'Running pose estimation' },
  { stage: 'object_detection', pct: 45,  msg: 'Tracking wheelchair mechanics' },
  { stage: 'optical_flow',     pct: 55,  msg: 'Computing rim speed' },
  { stage: 'feature_p01_p04', pct: 65,  msg: 'Extracting biomechanics metrics' },
  { stage: 'feature_p05_p08', pct: 73,  msg: 'Measuring reaction and technique' },
  { stage: 'feature_p09_p14', pct: 82,  msg: 'Computing fatigue and injury signals' },
  { stage: 'scoring',          pct: 90,  msg: 'Scoring metrics against IPC baseline' },
  { stage: 'feedback',         pct: 96,  msg: 'Generating coaching report' },
  { stage: 'complete',         pct: 100, msg: 'Analysis complete' },
];
```

### 4.3 Design System Mapping (v1 CSS → React Native)

| CSS concept | React Native equivalent |
|---|---|
| `position: fixed; inset: 0` | `StyleSheet.absoluteFillObject` |
| `screen.active` opacity | `Animated.timing` + Expo Router transitions |
| `translateX` slide | `Animated.spring` / Expo Router `animation: "slide_from_right"` |
| `backdrop-filter: blur` | `expo-blur` `BlurView` |
| CSS variables | `constants/colors.ts` + `useRole()` hook for accent swap |
| `@keyframes orbDrift` | `Animated.loop` + `Animated.sequence` |
| Canvas perf chart | `react-native-svg` `Polyline` / `Path` |
| `font-family: Outfit 900` | `@expo-google-fonts/outfit` |
| `scrollbar-width: none` | `showsVerticalScrollIndicator={false}` |

### 4.4 App Dependencies

```bash
npx expo install expo-router expo-linear-gradient expo-font \
  @expo-google-fonts/inter @expo-google-fonts/outfit \
  expo-status-bar react-native-safe-area-context react-native-screens \
  expo-av react-native-svg expo-document-picker expo-sharing \
  expo-haptics expo-blur

npm install zustand @react-native-async-storage/async-storage
```

---

## 5 · REPO 2 — CV Pipeline (`parasync-pipeline`)

### 5.1 The 14-Pillar Framework

**57 video-only sub-metrics** across 14 pillars. No hardware dependencies. No composite scores.

| # | Pillar | Sub-metrics | Count |
|---|---|---|---|
| P1 | Propulsion Power & Cadence | rim_speed_peak, rim_speed_avg, push_cadence, contact_arc_angle | 4 |
| P2 | Bilateral Push Symmetry | symmetry_ratio, left_push_arc, right_push_arc, timing_offset, dominant_side | 5 |
| P3 | Chair Maneuverability | min_turning_radius, avg_turning_radius, angular_velocity, braking_distance, braking_deceleration, pivot_precision | 6 |
| P4 | Chair-Body Stability & Control | trunk_lean_forward, trunk_lean_lateral, trunk_rotation_angle, head_stability_index, coordination_score | 5 |
| P5 | Reaction & Decision Speed | reaction_time_avg, reaction_time_best, movement_initiation_type, decision_consistency | 4 |
| P6 | Spatial Coverage & Positioning | total_distance_covered, court_coverage_pct, avg_speed, positioning_iq, reach_radius | 5 |
| P7 | Technique Consistency | joint_angle_cv, stroke_repeatability, wrist_path_variance, timing_regularity, release_consistency | 5 |
| P8 | Power Transfer & Shot Execution | kinetic_chain_score, wrist_speed_at_contact, trunk_contribution_ratio, follow_through_arc | 4 |
| P9 | Performance Under Pressure | pressure_consistency_score, pressure_reaction_time, form_degradation_under_load | 3 |
| P10 | Work-Rate & Second-Effort | speed_bursts_per_min, burst_peak_speed, burst_duration_avg, second_effort_count, second_effort_speed_ratio, rest_to_burst_ratio | 6 |
| P11 | Fatigue & Recovery Profile | fatigue_onset_time, velocity_drop_rate, post_burst_recovery_time, late_session_speed_index, technique_degradation_rate | 5 |
| P12 | Injury Risk Index | rsi_index, rsi_risk_level, shoulder_strain_angle, asymmetry_stress_score, overuse_flag | 5 |
| P13 | Sustained Motion Output | sustained_speed_ratio, high_intensity_time_pct, speed_consistency_index | 3 |
| P14 | Late-Session Movement Quality | late_session_tremor_index, movement_smoothness_decay, coordination_degradation | 3 |

**Removed (hardware-only):** SpO2, heart rate, blood pressure, VO2max, core temperature, sweat rate, force sensors.

### 5.2 Per-Sport Coverage Matrix

| Pillar | Basketball | Tennis | Racing | Table Tennis | Cricket |
|---|:---:|:---:|:---:|:---:|:---:|
| P1 Propulsion | ✅ | ✅ | ✅ | ❌ | ❌ |
| P2 Symmetry | ✅ | ✅ | ✅ | ❌ | ❌ |
| P3 Maneuverability | ✅ | ✅ | ❌ | ✅ turning | ❌ |
| P4 Stability | ✅ | ✅ | ✅ coord | ✅ | ✅ coord+follow-through |
| P5 Reaction | ✅ | ✅ | ✅ reaction | ✅ | ✅ |
| P6 Spatial | ✅ | ✅ | ❌ | ✅ | ✅ IQ+reach |
| P7 Consistency | ✅ | ✅ | ✅ | ✅ | ✅ +release |
| P8 Power | ✅ | ✅ | ✅ transfer | ✅ accuracy | ✅ power |
| P9 Pressure | ✅ | ✅ | ❌ | ✅ | ✅ |
| P10 Work-Rate | ✅ | ✅ work only | ✅ | ❌ | ❌ |
| P11 Fatigue | ✅ | ✅ | ✅ | ❌ | ❌ |
| P12 Injury Risk | ✅ | ✅ | ✅ RSI | ❌ | ❌ |
| P13 Motion Output | ✅ | ✅ | ✅ | ❌ | ❌ |
| P14 Late-Session | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Active** | **14** | **13** | **11** | **8** | **8** |

### 5.3 Folder Structure

```
parasync-pipeline/
├── main.py                        ← CLI entry point
├── api.py                         ← FastAPI: POST /analyse + SSE progress
│
├── pipeline/
│   ├── preprocessor.py            ← Stage 1: decode, stabilize, scale, angle detection
│   ├── pose_detector.py           ← Stage 2A: MediaPipe BlazePose (33 keypoints, 3D)
│   ├── object_detector.py         ← Stage 2B: YOLOv8n (athlete, wheelchair, wheel, ball)
│   ├── optical_flow.py            ← Stage 3: Farneback → rim speed + centroid kinematics
│   │
│   ├── pillars/
│   │   ├── p01_propulsion.py      ← FFT cadence + optical flow rim speed
│   │   ├── p02_symmetry.py        ← L/R wrist arc amplitude comparison
│   │   ├── p03_maneuverability.py ← Centroid curvature + braking detection
│   │   ├── p04_stability.py       ← Trunk angles + head variance + coordination
│   │   ├── p05_reaction.py        ← Ball zone detection → first body movement timing
│   │   ├── p06_spatial.py         ← Heatmap grid + distance + positioning IQ
│   │   ├── p07_consistency.py     ← DTW wrist paths + joint angle CoV
│   │   ├── p08_power_transfer.py  ← Kinetic chain sequence + wrist speed at contact
│   │   ├── p09_pressure.py        ← P7 + P5 rerun on high-intensity windows
│   │   ├── p10_workrate.py        ← Burst detection + second-effort counting
│   │   ├── p11_fatigue.py         ← Velocity regression + recovery time + tech degradation
│   │   ├── p12_injury_risk.py     ← RSI index + shoulder strain + asymmetry stress
│   │   ├── p13_sustained_output.py← Speed maintenance ratio + high-intensity time %
│   │   └── p14_movement_quality.py← Tremor index + jerk smoothness decay (Q1 vs Q4)
│   │
│   ├── sport_dispatcher.py        ← Reads sport_matrix.json → runs correct pillar subset
│   ├── individual_scorer.py       ← Per-metric normalize vs IPC baseline (no composite)
│   └── feedback_generator.py      ← Rule-based 3–4 line scout + coach feedback
│
├── models/
│   ├── yolov8n.pt                 ← COCO pretrained base
│   └── yolov8n_parasync.pt        ← Fine-tuned: wheelchair, wheel, ball per sport
│
├── config/
│   ├── sport_matrix.json          ← Pillar applicability + scope overrides per sport
│   ├── ipc_baselines.json         ← Per sport × class × sub-metric: {low, high}
│   ├── higher_is_better.json      ← Scoring direction per sub-metric
│   └── feedback_templates.json    ← Rule templates per sub-metric × status level
│
├── utils/
│   ├── keypoints.py               ← BlazePose landmark index constants
│   ├── geometry.py                ← angle(), distance(), curvature(), jerk()
│   ├── kalman.py                  ← 1D Kalman filter for time-series smoothing
│   ├── dtw.py                     ← Dynamic Time Warping (Pillar 7)
│   ├── fft_utils.py               ← FFT helpers (Pillar 1 cadence)
│   ├── video_utils.py             ← Frame decode, FPS, resolution normalization
│   └── scale_estimator.py         ← Pixel→meter using standard 24" wheel (0.61m)
│
├── tests/
│   ├── test_pillar_01.py
│   ├── test_pillar_05.py          ← Reaction time (most complex)
│   ├── test_pillar_07.py          ← DTW consistency
│   └── test_individual_scorer.py
│
├── requirements.txt
├── Dockerfile
└── README.md
```

### 5.4 Individual Scoring Model

> No composite. No grade. No fitness verdict. Each sub-metric scored independently.

```python
# individual_scorer.py
def score_metric(metric_id, value, sport, ipc_class):
    ref = baselines[sport][ipc_class][metric_id]
    low, high = ref['low'], ref['high']
    if higher_is_better[metric_id]:
        raw = (value - low) / (high - low)
    else:                              # lower = better (reaction_time, turning_radius, etc.)
        raw = (high - value) / (high - low)
    return int(clamp(raw * 100, 0, 100))
```

### 5.5 JSON Output Schema (consumed by App)

```json
{
  "session_id": "uuid-v4",
  "athlete_id": "uuid-v4",
  "sport":      "wheelchair_basketball",
  "ipc_class":  "T53",

  "video_metadata": {
    "duration_sec": 247, "fps": 30,
    "camera_angle": "side", "pixel_per_meter": 142.3,
    "frames_analysed": 7410, "pose_confidence_avg": 0.82
  },

  "metric_cards": [
    {
      "id": "p01_rim_speed_peak", "pillar": "Propulsion Power & Cadence",
      "label": "Peak Rim Speed",  "value": 4.1, "unit": "m/s",
      "score": 91, "higher_is_better": true,
      "trend": 0.3, "trend_unit": "m/s vs last session"
    },
    {
      "id": "p05_reaction_time_avg", "pillar": "Reaction & Decision Speed",
      "label": "Avg Reaction Time", "value": 284, "unit": "ms",
      "score": 76, "higher_is_better": false,
      "trend": -18, "trend_unit": "ms vs last session"
    }
    // ... all 57 cards
  ],

  "feedback": {
    "scout_feedback": "Peak rim speed of 4.1 m/s sits in the top 9% for T53 Basketball. Push symmetry at 92% shows strong bilateral drive. Reaction time averaged 284ms — fast, consistent decision-making. RSI index 14 (LOW) — no injury indicators from this session.",
    "coach_feedback": "Right push arc is 12° shorter than left — isolate right shoulder drive. Technique drops 13% in the final quarter — add lactate threshold intervals. Trunk contribution to shot power is 38% — improve thoracic rotation. Late-session tremor low — movement quality maintained."
  },

  "ai_log": [
    { "msg": "Peak rim speed 4.1 m/s — top 9% for T53 Basketball", "type": "good" },
    { "msg": "Right push arc 12° shorter than left — asymmetry noted", "type": "warn" },
    { "msg": "Technique drops 13% in final quarter",               "type": "warn" },
    { "msg": "RSI index 14 (LOW) — no overuse pattern detected",   "type": "good" }
  ],

  "processing_meta": {
    "pipeline_version": "3.0.0",
    "processing_time_sec": 138,
    "total_metric_cards": 47,
    "hardware_metrics_skipped": ["spo2","heart_rate","blood_pressure","core_temperature"]
  }
}
```

### 5.6 Pipeline Requirements

```
mediapipe==0.10.14
ultralytics==8.2.0
opencv-python==4.10.0.84
numpy==1.26.4
scipy==1.13.0
fastapi==0.111.0
uvicorn==0.30.0
python-multipart==0.0.9
sse-starlette==2.1.0
Pillow==10.3.0
```

---

## 6 · Unified Build Sequence

### Repo 1 — Mobile App (`parasync-v2`)

| Phase | What | Files | Screens |
|---|---|---|---|
| **A1** | Bootstrap + Design System | `constants/`, `components/layout/` | — |
| **A2** | Auth Screens | `app/(auth)/` + `components/auth/` | S-01 → S-04 |
| **A3** | Athlete Flow | `app/(athlete)/` + `store/athlete.store.ts` | A-01 → A-13 |
| **A4** | Coach Flow | `app/(coach)/` + `store/coach.store.ts` | B-01 → B-10 |
| **A5** | Scout Flow | `app/(scout)/` + `store/scout.store.ts` | C-01 → C-08 |
| **A6** | Federation Flow | `app/(federation)/` | D-01 → D-05 |
| **A7** | Guest Flow | `app/(guest)/` | E-01 → E-04 |
| **A8** | Services + State Wiring | `services/`, `data/` | — |

### Repo 2 — CV Pipeline (`parasync-pipeline`)

| Phase | What | Files | Pillars |
|---|---|---|---|
| **P1** | Video Pre-Processing | `preprocessor.py`, `video_utils.py`, `scale_estimator.py` | — |
| **P2** | Pose Estimation | `pose_detector.py`, `keypoints.py`, `kalman.py` | — |
| **P3** | Object Detection | `object_detector.py` + YOLOv8n setup | — |
| **P4** | Optical Flow | `optical_flow.py`, `geometry.py` | — |
| **P5** | Pillars 1–4 | `p01` – `p04` + `fft_utils.py` | P1 P2 P3 P4 |
| **P6** | Pillars 5–8 | `p05` – `p08` + `dtw.py` | P5 P6 P7 P8 |
| **P7** | Pillars 9–14 | `p09` – `p14` | P9–P14 |
| **P8** | Sport Dispatch + Config | `sport_dispatcher.py`, `sport_matrix.json` | all |
| **P9** | Individual Scoring | `individual_scorer.py`, `ipc_baselines.json`, `higher_is_better.json` | — |
| **P10** | Feedback Generator | `feedback_generator.py`, `feedback_templates.json` | — |
| **P11** | API Server | `api.py`, `Dockerfile`, SSE stream | — |

### Integration Phase (connects both repos)

| Phase | What |
|---|---|
| **INT-1** | Replace `analysis.service.ts` mock with real SSE call to pipeline `/analyse` |
| **INT-2** | Wire `useAnalysis.ts` to parse SSE progress events → update processing screen |
| **INT-3** | Confirm `metric_cards[]` shape from pipeline matches `MetricCard` component props exactly |
| **INT-4** | Test full flow: Athlete uploads video → pipeline processes → dashboard renders all cards |

---

## 7 · Verification Plan

### App (`parasync-v2`)
```bash
npx tsc --noEmit          # TypeScript checks
npx expo start            # Scan QR on Android device via Expo Go
```

| Check | Method |
|---|---|
| Splash → Role Select → Sign Up (all 4 roles) | Expo Go on Android |
| Athlete: Upload → Processing (mock) → Dashboard renders metric cards | Tap through |
| Coach: Roster → Athlete Detail → Compare Sessions | Tab to tab |
| Scout: Browse with filter → Shortlist persists | Filter state check |
| Guest: 5 profile views → Sign Up wall appears | Count tracking |
| All screens: Dark theme, no white flash between routes | Visual check |
| Metric card score rings animate correctly | 1.4s ease on mount |
| Processing screen: live tickers flicker during mock analysis | 350–650ms |

### Pipeline (`parasync-pipeline`)
```bash
python main.py --video sample.mp4 --sport wheelchair_basketball --class T53
pytest tests/
```

| Check | What |
|---|---|
| `test_pillar_01.py` | Rim speed + cadence FFT returns plausible values |
| `test_pillar_05.py` | Reaction time measured correctly from ball → movement |
| `test_pillar_07.py` | DTW distance consistent across identical stroke reps |
| `test_individual_scorer.py` | Score = 100 at baseline high, 0 at baseline low |
| Full JSON output | All 57 cards present, no null values for active sport |

---

## 8 · File Count Summary

| Repo | Files | Notes |
|---|---|---|
| `parasync-v2` | ~95 TSX/TS files | 38 screens + components + services + stores |
| `parasync-pipeline` | ~35 Python files | 14 pillar modules + utils + API + config |
| **Total** | **~130 files** | |

---

*ParaSync 2.0 · Master Implementation Plan · Merged*
*Team Code Blooded · NIT Rourkela · 2026-08-22*
