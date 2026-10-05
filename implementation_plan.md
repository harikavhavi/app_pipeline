# ParaSync 2.0 — Implementation Plan

> **Tech Stack:** React Native + Expo | **Target:** All 5 roles | **Data:** Mock + swappable API layer
> **Output folder:** `C:\Users\harik\Downloads\ParaSync 2.0\`
> Team Code Blooded · NIT Rourkela

---

## Background

ParaSync is a mobile-first adaptive Computer Vision platform for para-athletes.
The existing prototype is a single `index.html` + `style.css` + `app.js` vanilla web app.

**This plan migrates it to a proper React Native + Expo mobile app** with:
- 5 distinct user roles, each with a completely different UX flow
- 38 screens across all roles
- Mock data everywhere, wired to clean API service functions that can be swapped with a real backend later
- Adaptive biomechanics algorithm hook point ready for the team's algorithm paste-in

---

## Open Questions

> [!IMPORTANT]
> **Before executing, confirm these 3 items:**

1. **Expo flavor** — Should this use **Expo Router** (file-system based routing, recommended for 38 screens) or the older **React Navigation** stack? → *Recommending Expo Router (SDK 52+)*
2. **Target device** — Android only, iOS only, or both? (affects some Expo SDK choices)
3. **Expo Go or custom dev client** — The AI analysis screen uses heavy animation; if you want Camera access (live record), we'd need a custom dev build. Video file upload works fine in Expo Go.

> [!NOTE]
> These don't block creating the plan — I'll default to **Expo Router + cross-platform + Expo Go compatible** (Camera for recording deferred to Phase 6). Confirm before executing if you want different defaults.

---

## Proposed Changes

### Project Bootstrap

#### [NEW] `C:\Users\harik\Downloads\ParaSync 2.0\` ← root

Initialised via:
```bash
npx create-expo-app@latest ./ --template blank-typescript
```

Then add dependencies:
```bash
npx expo install expo-router expo-linear-gradient expo-font @expo-google-fonts/inter @expo-google-fonts/outfit expo-status-bar react-native-safe-area-context react-native-screens expo-av react-native-svg expo-document-picker expo-sharing expo-haptics
npm install zustand @react-native-async-storage/async-storage
```

---

### Folder Structure

```
ParaSync 2.0/
├── app/                         ← Expo Router file-based routing
│   ├── _layout.tsx              ← Root layout (fonts, safe area, role router)
│   ├── index.tsx                ← Splash screen → redirect to auth
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── role-select.tsx      ← S-01 Role Selection (5 cards)
│   │   ├── signup/
│   │   │   ├── athlete.tsx      ← S-02a Athlete sign-up form
│   │   │   ├── coach.tsx        ← S-02b Coach sign-up form
│   │   │   ├── scout.tsx        ← S-02c Scout sign-up form
│   │   │   └── federation.tsx   ← S-02d Federation admin sign-up
│   │   ├── login.tsx            ← S-03 Login
│   │   └── forgot-password.tsx  ← S-04
│   │
│   ├── (athlete)/               ← Athlete tab group
│   │   ├── _layout.tsx          ← Athlete bottom tabs (Home|Analyse|Dashboard|Scout|Profile)
│   │   ├── home.tsx             ← A-01 Athlete Home
│   │   ├── upload.tsx           ← A-02 Upload & Analyse
│   │   ├── processing.tsx       ← A-03 AI Processing
│   │   ├── dashboard.tsx        ← A-04 Session Dashboard
│   │   ├── profile.tsx          ← A-05 My Profile
│   │   ├── history.tsx          ← A-06 Performance History
│   │   ├── videos.tsx           ← A-07 Video History
│   │   ├── scout-network.tsx    ← A-08 Scout Network
│   │   ├── scout-activity.tsx   ← A-09 Scout Activity Log
│   │   ├── progress.tsx         ← A-10 Progress & Radar Chart
│   │   ├── safety.tsx           ← A-11 Injury & Safety Report
│   │   ├── my-coach.tsx         ← A-12 Linked Coach View
│   │   └── notifications.tsx    ← A-13 Notifications
│   │
│   ├── (coach)/                 ← Coach tab group
│   │   ├── _layout.tsx          ← Coach bottom tabs (Home|Roster|Upload|Analytics|Settings)
│   │   ├── home.tsx             ← B-01 Coach Home
│   │   ├── roster.tsx           ← B-02 My Roster
│   │   ├── athlete/[id].tsx     ← B-03 Athlete Detail View (dynamic)
│   │   ├── upload.tsx           ← B-04 Upload for Athlete
│   │   ├── compare.tsx          ← B-05 Session Comparison
│   │   ├── drills.tsx           ← B-06 Drill Planner
│   │   ├── analytics.tsx        ← B-07 Group Analytics
│   │   ├── scout-inbox.tsx      ← B-09 Scout Inbox
│   │   ├── events.tsx           ← B-10 Event Calendar
│   │   └── profile.tsx          ← B-08 Coach Profile
│   │
│   ├── (scout)/                 ← Scout tab group
│   │   ├── _layout.tsx          ← Scout bottom tabs (Home|Browse|Shortlist|Messages|Profile)
│   │   ├── home.tsx             ← C-01 Scout Home Feed
│   │   ├── browse.tsx           ← C-02 Athlete Browse + Filters
│   │   ├── athlete/[id].tsx     ← C-03 Athlete Public Card
│   │   ├── shortlist.tsx        ← C-04 My Shortlist / Watchlist
│   │   ├── messages.tsx         ← C-05 Contact & Messaging
│   │   ├── reports.tsx          ← C-06 My Reports
│   │   ├── analytics.tsx        ← C-08 Scout Analytics Dashboard
│   │   └── profile.tsx          ← C-07 Scout Profile
│   │
│   ├── (federation)/            ← Federation admin tab group
│   │   ├── _layout.tsx          ← Federation tabs (Overview|Registry|Events|Admin)
│   │   ├── dashboard.tsx        ← D-01 Admin Dashboard
│   │   ├── registry.tsx         ← D-02 Athlete Registry
│   │   ├── events.tsx           ← D-03 Event Management
│   │   ├── analytics.tsx        ← D-04 Analytics Overview
│   │   └── settings.tsx         ← D-05 Admin Settings
│   │
│   └── (guest)/                 ← Guest flow (no tabs, stack)
│       ├── _layout.tsx
│       ├── landing.tsx          ← E-01 Guest Landing
│       ├── showcase.tsx         ← E-02 Public Athlete Showcase
│       ├── athlete/[id].tsx     ← E-03 Athlete Public Profile (read-only)
│       └── signup-wall.tsx      ← E-04 Sign Up CTA Wall
│
├── components/                  ← Shared reusable components
│   ├── ui/
│   │   ├── AthleteCard.tsx
│   │   ├── SessionCard.tsx
│   │   ├── MetricChip.tsx
│   │   ├── ScoreRing.tsx
│   │   ├── SafetyBadge.tsx
│   │   ├── RoleChip.tsx
│   │   ├── VideoThumb.tsx
│   │   ├── ScoutCard.tsx
│   │   ├── Toast.tsx
│   │   ├── BottomNav.tsx        ← (Expo Router handles this via _layout tabs)
│   │   ├── AILogEntry.tsx
│   │   └── FilterBar.tsx
│   ├── charts/
│   │   ├── PerformanceChart.tsx ← Canvas → react-native-svg line chart
│   │   ├── RadarChart.tsx       ← Progress radar for A-10
│   │   └── BarMetric.tsx        ← Animated fill bars
│   ├── layout/
│   │   ├── Screen.tsx           ← Wrapper with SafeArea + bg
│   │   ├── Topbar.tsx           ← Back + title + action button
│   │   ├── OrbBackground.tsx    ← Animated orb gradient layer
│   │   └── GridBackground.tsx   ← Animated dot grid
│   └── auth/
│       ├── RoleCard.tsx         ← Individual role selection card
│       ├── FieldInput.tsx       ← Styled text input
│       └── FieldSelect.tsx      ← Picker / dropdown
│
├── services/                    ← API layer (mock now → real later)
│   ├── api.ts                   ← Base API config (axios/fetch base URL)
│   ├── auth.service.ts          ← login(), signup(), logout()
│   ├── athlete.service.ts       ← getSessions(), getProfile(), uploadVideo()
│   ├── analysis.service.ts      ← runAnalysis(), getSessionResult()
│   ├── scout.service.ts         ← browseAthletes(), connect(), shortlist()
│   ├── coach.service.ts         ← getRoster(), compareSession(), assignDrill()
│   └── federation.service.ts   ← getRegistry(), publishEvent()
│
├── store/                       ← Zustand global state
│   ├── auth.store.ts            ← userRole, userName, userId, isLoggedIn
│   ├── athlete.store.ts         ← sessions[], profile, scoutActivity
│   ├── analysis.store.ts        ← currentAnalysis, liveMetrics, timers
│   └── scout.store.ts           ← shortlist[], connections[], browseFilters
│
├── data/                        ← Mock data (replaces real API until algorithm is integrated)
│   ├── mock-athletes.ts         ← 20 sample athlete profiles
│   ├── mock-sessions.ts         ← 50 sample sessions with full metrics
│   ├── mock-scouts.ts           ← Scout/federation list
│   ├── mock-drills.ts           ← Drill library
│   └── sport-metrics.ts         ← SPORT_METRICS config (ported from app.js)
│
├── constants/
│   ├── colors.ts                ← Design tokens (all CSS vars → TS constants)
│   ├── typography.ts            ← Font sizes, weights
│   ├── sports.ts                ← Sport list + IPC classification list
│   └── roles.ts                 ← Role metadata (label, accent, monogram)
│
├── hooks/
│   ├── useAnalysis.ts           ← Analysis sequence logic (ported from app.js)
│   ├── useScoutActivity.ts
│   ├── usePerformanceChart.ts
│   └── useRole.ts               ← Returns current role + theme accent
│
├── utils/
│   ├── initials.ts              ← Name → "AS" (ported from app.js)
│   ├── clamp.ts
│   ├── greeting.ts              ← Time-based greeting
│   └── formatMetric.ts          ← Number formatting helpers
│
├── assets/
│   └── fonts/ (handled by expo-google-fonts)
│
├── app.json                     ← Expo config
├── tsconfig.json
├── babel.config.js
└── package.json
```

---

### File-by-File Changes

---

#### PHASE 1 — Project Bootstrap & Design System

##### [NEW] `constants/colors.ts`
Port all CSS variables to TypeScript:
```ts
export const Colors = {
  cyan:    '#00d4ff',
  blue:    '#3b82f6',
  purple:  '#a855f7',
  orange:  '#f97316',
  red:     '#ef4444',
  green:   '#22c55e',
  bg:      '#000000',
  bg1:     '#080810',
  bg2:     '#0f0f1a',
  card:    '#0e0e1c',
  card2:   '#141428',
  border:  'rgba(255,255,255,0.07)',
  t2:      'rgba(255,255,255,0.55)',
  t3:      'rgba(255,255,255,0.30)',
};

export const RoleAccent: Record<string, string> = {
  athlete:    Colors.cyan,
  coach:      Colors.blue,
  scout:      Colors.purple,
  federation: Colors.orange,
  guest:      Colors.t2,
};
```

##### [NEW] `constants/sports.ts`
```ts
export const SPORTS = ['Wheelchair Basketball', 'Para-Athletics', ...];
export const IPC_CLASSES = ['T51','T52','T53','T54','F40','F42','F44','F57','S1','S14','B1','WC1'...];
```

##### [NEW] `components/layout/OrbBackground.tsx`
Animated gradient orbs using `Animated` API — replicates CSS `orbDrift` keyframe.

##### [NEW] `components/layout/Screen.tsx`
```tsx
// Wraps every screen with SafeAreaView + black bg + optional OrbBackground
<SafeAreaView style={{ flex:1, backgroundColor: Colors.bg }}>
  {hasOrbs && <OrbBackground />}
  {children}
</SafeAreaView>
```

##### [NEW] `components/layout/Topbar.tsx`
Back arrow + center title + optional right action. Replicates `.topbar` from CSS.

---

#### PHASE 2 — Auth Screens

##### [NEW] `app/index.tsx`
Splash screen — logo animation + "Get Started" → `role-select`.
Replicates `s-splash` exactly. Uses `Animated.timing` for `fadeUp` + `dotBounce`.

##### [NEW] `app/(auth)/role-select.tsx`
- 4 role cards in a 2×2 grid + 1 full-width "Continue as Guest" ghost button
- Role cards: `RoleCard` component with monogram, name, desc, cyan glow on select
- State: `useAuthStore().setRole(role)`
- "Continue →" routes to `signup/[role]` or directly to guest landing

##### [NEW] `app/(auth)/signup/athlete.tsx`
Full athlete registration form — Name, Email, Phone, Password, Sport (multi-select), IPC Classification, State, DOB, Disability Type, discoverability toggle.

##### [NEW] `app/(auth)/signup/coach.tsx`
Coach form — Name, Email, Password, Sport Specialization, Years Experience, Federation (optional), Certification upload.

##### [NEW] `app/(auth)/signup/scout.tsx`
Scout form — Name, Email, Password, Organization, Role dropdown, Sports covered, Level, credential upload. Shows "Verification Pending" toast on submit.

##### [NEW] `app/(auth)/signup/federation.tsx`
Federation form — Org Name, Contact, Email, Federation Type, Sports, Reg Number. Routes to "Application Submitted" confirmation.

##### [NEW] `app/(auth)/login.tsx`
Email + password → reads role from stored account → routes to `/(athlete)`, `/(coach)`, `/(scout)`, `/(federation)`, or `/(guest)`.

---

#### PHASE 3 — Athlete Role (14 screens)

##### [NEW] `app/(athlete)/_layout.tsx`
Expo Router Tabs with 5 tabs:
```
Home | Analyse | Dashboard | Scout | Profile
```
Tab bar styled with `Colors.bg1` bg, `Colors.cyan` active tint.

##### [NEW] `app/(athlete)/home.tsx` — **A-01**
- Time-based greeting
- 3-stat scout summary strip (Views | Connections | Match Rate)
- "Analyse New Video" CTA card
- 4 metric chips grid (last session)
- Recent sessions list
- Scout activity snapshot

##### [NEW] `app/(athlete)/upload.tsx` — **A-02**
- `expo-document-picker` for video file selection
- Drop zone visual with floating icon animation
- Athlete info auto-populated from store
- Sport + classification selectors
- Metrics toggles
- "Run AI Analysis" → navigates to `processing.tsx`

##### [NEW] `app/(athlete)/processing.tsx` — **A-03**
- Spinning SVG ring + PS logo
- Step list with `done` / `active` / pending states
- Animated progress bar
- 6-ticker grid (live metric flicker via `useAnalysis` hook)
- On complete → navigate to `dashboard.tsx`

> **Algorithm hook point:** `useAnalysis.ts` calls `analysis.service.ts → runAnalysis()`.
> Currently returns mock data after simulated delay.
> When the algorithm is ready: replace `analysis.service.ts` implementation only — no screen changes needed.

##### [NEW] `app/(athlete)/dashboard.tsx` — **A-04**
- Athlete hero (avatar, name, sport, score ring)
- Scout visibility toggle (ON/OFF)
- Biomechanics card (Rim Speed, Acceleration, Push Cadence)
- Mobility card (Turn Radius, Angular Velocity, Braking)
- Symmetry & Posture card
- Sport-Specific card (dynamic by sport)
- Injury & Safety card
- Performance Trend chart (`PerformanceChart` component)
- AI Analysis Log
- "Connect to Scout Network" button
- Share button → `expo-sharing`

##### [NEW] `app/(athlete)/profile.tsx` — **A-05**
- Animated avatar ring (RN `Animated.timing` rotation)
- Name, sport, classification, location
- Verified badges (Scout Ready, Top 100, Verified)
- Edit Profile / Share Profile buttons
- 4-stat grid (Sessions, Avg Score, Best Score, Sports)
- Scout engagement block (views, connections, match rate)
- Personal Bests list
- Injury Status summary
- Session History (last 4 + View All)

##### [NEW] `app/(athlete)/history.tsx` — **A-06**
Full chronological session list. Tap → navigate to `dashboard.tsx` with that session's data loaded.

##### [NEW] `app/(athlete)/videos.tsx` — **A-07**
Video gallery. Each card shows thumbnail (filename as placeholder until real video backend), sport, date, score, duration. Actions: View Analysis | Share | Delete.

##### [NEW] `app/(athlete)/scout-network.tsx` — **A-08**
Adapted from `s-scout` v1. Shows scout org cards with Connect button + Connected state. Stats strip. Verified box at bottom.

##### [NEW] `app/(athlete)/scout-activity.tsx` — **A-09**
Timeline of scout activity (views, connections, shortlists). Each entry: scout name, org, action, timestamp, action button (Connect / Accept / Decline).

##### [NEW] `app/(athlete)/progress.tsx` — **A-10**
Radar chart (react-native-svg) of 6 core metrics vs personal best. Trend line charts per metric over time.

##### [NEW] `app/(athlete)/safety.tsx` — **A-11**
RSI history, fatigue trend, safe warm-up suggestions generated per sport.

##### [NEW] `app/(athlete)/my-coach.tsx` — **A-12**
Read-only view of linked coach: name, org, assigned drills, messages.

##### [NEW] `app/(athlete)/notifications.tsx` — **A-13**
Scout views, connection requests, coach feedback, event invites — unified feed.

---

#### PHASE 4 — Coach Role (12 screens)

##### [NEW] `app/(coach)/_layout.tsx`
5 tabs: Home | Roster | Upload | Analytics | Settings. Accent: `Colors.blue`.

##### [NEW] `app/(coach)/home.tsx` — **B-01**
- Alert strip for RSI/cadence warnings
- Roster quick-view (top 3 athletes + score)
- Upcoming event
- Group stats this week

##### [NEW] `app/(coach)/roster.tsx` — **B-02**
Full athlete list. Each row: avatar, name, sport, latest score, RSI badge. Tap → `athlete/[id]`.

##### [NEW] `app/(coach)/athlete/[id].tsx` — **B-03**
Deep view: all sessions, trends, videos, injury status, drill assignments. "Upload Session" button.

##### [NEW] `app/(coach)/upload.tsx` — **B-04**
Same as athlete upload but with athlete selector (from roster) at the top.

##### [NEW] `app/(coach)/compare.tsx` — **B-05**
Two dropdown pickers (athlete + session date). Side-by-side metric comparison table with delta percentages. Overlay chart.

##### [NEW] `app/(coach)/drills.tsx` — **B-06**
Assign drills from a library (`mock-drills.ts`) to athletes. Show assigned drills + status.

##### [NEW] `app/(coach)/analytics.tsx` — **B-07**
Group-level charts: avg score trend, RSI heatmap across roster, sport participation breakdown.

##### [NEW] `app/(coach)/profile.tsx` — **B-08**
Coach profile: credentials, federation, sport specialization, experience, edit button.

##### [NEW] `app/(coach)/scout-inbox.tsx` — **B-09**
Scouts who contacted athletes in the roster. Reply on their behalf.

##### [NEW] `app/(coach)/events.tsx` — **B-10**
Calendar list of selection trials/camps. RSVP per athlete. Add event.

---

#### PHASE 5 — Scout Role (9 screens)

##### [NEW] `app/(scout)/_layout.tsx`
5 tabs: Home | Browse | Shortlist | Messages | Profile. Accent: `Colors.purple`.

##### [NEW] `app/(scout)/home.tsx` — **C-01**
Top athletes this week (curated from mock data). Activity summary strip.

##### [NEW] `app/(scout)/browse.tsx` — **C-02**
Search bar + filter chips (Sport, Classification, State, Rating, Verified, Age, Sort). Athlete card grid/list toggle.

##### [NEW] `app/(scout)/athlete/[id].tsx` — **C-03**
Read-only athlete card. Scout action row: Shortlist | Connect | Download Report.

##### [NEW] `app/(scout)/shortlist.tsx` — **C-04**
Saved athletes. Per-athlete notes. Remove from shortlist. Export as PDF.

##### [NEW] `app/(scout)/messages.tsx` — **C-05**
Connection requests sent. Status (pending/accepted/declined). Message thread per athlete.

##### [NEW] `app/(scout)/reports.tsx` — **C-06**
Export athlete PDF reports. Share via `expo-sharing`.

##### [NEW] `app/(scout)/analytics.tsx` — **C-08**
Top performers by region/sport. Classification breakdown charts.

##### [NEW] `app/(scout)/profile.tsx` — **C-07`
Scout profile + verified badge + credential status.

---

#### PHASE 6 — Federation Admin Role (5 screens)

##### [NEW] `app/(federation)/_layout.tsx`
4 tabs: Overview | Registry | Events | Admin. Accent: `Colors.orange`.

##### [NEW] `app/(federation)/dashboard.tsx` — **D-01**
KPI cards: Total athletes, new registrations, events, connections. Quick actions.

##### [NEW] `app/(federation)/registry.tsx` — **D-02**
Athletes under this federation. Verify/flag per athlete.

##### [NEW] `app/(federation)/events.tsx` — **D-03**
Publish trials/camps. Track RSVPs. Publish results.

##### [NEW] `app/(federation)/analytics.tsx` — **D-04**
State-wise athlete density. Sport participation trends.

##### [NEW] `app/(federation)/settings.tsx` — **D-05**
Federation profile. Manage scout accounts.

---

#### PHASE 7 — Guest Flow (4 screens)

##### [NEW] `app/(guest)/_layout.tsx`
Stack navigator (no tabs). No auth required.

##### [NEW] `app/(guest)/landing.tsx` — **E-01**
Hero + "Browse Athletes" + "See How It Works" + sign-up CTAs.

##### [NEW] `app/(guest)/showcase.tsx` — **E-02**
Public athlete gallery. Only opted-in athletes shown. After 5 views → soft sign-up wall.

##### [NEW] `app/(guest)/athlete/[id].tsx` — **E-03**
Read-only athlete card (stripped — no connect, no shortlist). "Join ParaSync to connect" banner.

##### [NEW] `app/(guest)/signup-wall.tsx` — **E-04**
"You've explored 5 athlete profiles. Sign up to connect." → Athlete / Scout / Coach CTA.

---

#### PHASE 8 — Services & State

##### [NEW] `services/analysis.service.ts`

```ts
// MOCK implementation — replace body with real API call when algorithm is ready
export async function runAnalysis(payload: AnalysisPayload): Promise<AnalysisResult> {
  await simulateDelay(9500); // matches current animation time
  return generateMockResult(payload.sport, payload.classification);
}

// REAL implementation (swap in when backend is ready):
// export async function runAnalysis(payload) {
//   const res = await api.post('/analyse', payload);
//   return res.data;
// }
```

##### [NEW] `store/auth.store.ts`

```ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  role: 'athlete' | 'coach' | 'scout' | 'federation' | 'guest' | null;
  userId: string | null;
  userName: string | null;
  isLoggedIn: boolean;
  setRole: (role: string) => void;
  login: (user: User) => void;
  logout: () => void;
}
```

---

## Design System Mapping (v1 CSS → React Native StyleSheet)

| CSS concept | React Native equivalent |
|---|---|
| `position: fixed; inset: 0` | `StyleSheet.absoluteFillObject` |
| `screen.active { opacity: 1 }` | `Animated.timing` opacity + Expo Router transitions |
| `translateX slide` | `Animated.spring` or Expo Router `animation: "slide_from_right"` |
| `blur(60px)` orbs | `react-native-blur` or SVG radial gradient fallback |
| `backdrop-filter: blur` | `expo-blur` `BlurView` |
| CSS variables | `constants/colors.ts` + `useRole()` hook for accent swap |
| `@keyframes orbDrift` | `Animated.loop` + `Animated.sequence` |
| Canvas perf chart | `react-native-svg` `Polyline` / `Path` |
| `font-family: Outfit 900` | `@expo-google-fonts/outfit` |
| `font-family: Inter` | `@expo-google-fonts/inter` |
| `scrollbar-width: none` | `showsVerticalScrollIndicator={false}` |
| `max-width: 430px` | Handled by device naturally |

---

## Verification Plan

### Automated
```bash
# Type checking
npx tsc --noEmit

# Run on device
npx expo start
```

### Manual — Per Role
| Check | Method |
|---|---|
| Splash → Role Select → Sign Up (all 4 roles) | Expo Go on Android |
| Athlete: Upload → Processing → Dashboard | Tap through flow |
| Athlete: Profile shows scout activity | Check mock data renders |
| Coach: Roster → Athlete Detail → Compare Sessions | Tab to tab |
| Scout: Browse with filters → Shortlist | Filter state persists |
| Federation Admin: Registry + Events | Tab renders |
| Guest: Showcase → 5 views → Sign Up wall | Count tracking works |
| All screens: Dark theme preserved | Visual check |
| All screens: No white flash between routes | Transition check |
| Score ring animation on dashboard | 1.4s ease animation plays |
| Live metric tickers on processing screen | Flicker at 350–650ms |

### Expo Go QR
After `npx expo start`, scan QR on Android phone to test on real hardware.

---

## Build Sequence (Execution Order)

```
Phase 1  →  Bootstrap + Design System (colors, fonts, layout components)
Phase 2  →  Auth screens (splash, role-select, all 4 sign-ups, login)
Phase 3  →  Athlete flow (all 14 screens — core product)
Phase 4  →  Coach flow (12 screens)
Phase 5  →  Scout flow (9 screens)
Phase 6  →  Federation Admin (5 screens)
Phase 7  →  Guest flow (4 screens)
Phase 8  →  Services + Zustand stores wired up across all roles
Phase 9  →  Algorithm integration hook (swap mock in analysis.service.ts)
```

Estimated file count: **~95 TypeScript/TSX files**

---

*ParaSync 2.0 Implementation Plan · Team Code Blooded · NIT Rourkela · 2026-08-22*
