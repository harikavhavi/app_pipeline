# ParaSync 2.0 — Feature Extraction Pipeline
## Implementation Plan (v3 — Video-Only · Individual Scores · No Composite)

> **Stack:** Python · MediaPipe BlazePose · YOLOv8n · OpenCV · NumPy · SciPy · FastAPI
> **Mode:** Server-side offline batch · SSE progress stream
> **Output:** Individual sub-metric values + individual normalized scores → Dashboard cards
> **Key rules:**
> - ✅ Video-only: only metrics derivable from camera/pose/optical flow
> - ❌ No hardware metrics: SpO2, HR, BP, temperature, force sensors, EMG — all removed
> - ❌ No composite scores, no overall grade, no fitness judgment
> - ✅ Each sub-metric gets its own `value` + `score (0–100)` for its own dashboard card
> Team Code Blooded · NIT Rourkela

---

## 1 · Hardware-Audit of All 14 Pillars

Before anything else — a full audit of every previously defined sub-metric.

| Status | Meaning |
|---|---|
| ✅ VIDEO | Purely derivable from camera footage using pose/optical flow/object detection |
| ❌ HARDWARE | Requires a physical sensor — **removed from pipeline** |
| ⚠️ PROXY | Observable from video but is an approximation label — kept, noted clearly |

### Pillar 1 — Propulsion Power & Cadence
| Sub-metric | Status | Reason if removed |
|---|---|---|
| `rim_speed_peak` | ✅ VIDEO | Optical flow on wheel region |
| `rim_speed_avg` | ✅ VIDEO | Optical flow, session mean |
| `push_cadence` | ✅ VIDEO | FFT on wrist y-coordinate oscillation |
| `contact_arc_angle` | ✅ VIDEO | Wrist angular sweep during push phase |
| ~~push_force_proxy~~ | ❌ HARDWARE | True force requires load cell / strain gauge |

### Pillar 2 — Bilateral Push Symmetry
| Sub-metric | Status | Reason if removed |
|---|---|---|
| `symmetry_ratio` | ✅ VIDEO | L/R wrist arc amplitude comparison |
| `left_push_arc` | ✅ VIDEO | Left wrist angular sweep per push |
| `right_push_arc` | ✅ VIDEO | Right wrist angular sweep per push |
| `timing_offset` | ✅ VIDEO | Phase lag between L and R wrist peaks |
| `dominant_side` | ✅ VIDEO | Which side has larger arc (L or R) |

### Pillar 3 — Chair Maneuverability
| Sub-metric | Status | Reason if removed |
|---|---|---|
| `min_turning_radius` | ✅ VIDEO | Curvature of centroid path `R = 1/κ` |
| `avg_turning_radius` | ✅ VIDEO | Mean across detected turns |
| `angular_velocity` | ✅ VIDEO | Heading vector Δangle / Δtime |
| `braking_distance` | ✅ VIDEO | Centroid displacement: peak speed → near-zero |
| `braking_deceleration` | ✅ VIDEO | Negative acceleration peak |
| `pivot_precision` | ✅ VIDEO | Centroid return to pre-pivot position |

### Pillar 4 — Chair-Body Stability & Control
| Sub-metric | Status | Reason if removed |
|---|---|---|
| `trunk_lean_forward` | ✅ VIDEO | Shoulder→hip vector vs vertical |
| `trunk_lean_lateral` | ✅ VIDEO | Shoulder line tilt vs horizontal |
| `trunk_rotation_angle` | ✅ VIDEO | Shoulder vector vs wheelchair heading |
| `head_stability_index` | ✅ VIDEO | Nose keypoint variance relative to shoulders |
| `coordination_score` | ✅ VIDEO | Synchronicity of trunk + arm push timing |

### Pillar 5 — Reaction & Decision Speed
| Sub-metric | Status | Reason if removed |
|---|---|---|
| `reaction_time_avg` | ✅ VIDEO | Ball enters zone → first body/chair movement |
| `reaction_time_best` | ✅ VIDEO | Minimum reaction time across session |
| `movement_initiation_type` | ✅ VIDEO | Direction of first movement (forward/lateral/pivot) |
| `decision_consistency` | ✅ VIDEO | % reactions within 2× of best reaction time |

### Pillar 6 — Spatial Coverage & Positioning
| Sub-metric | Status | Reason if removed |
|---|---|---|
| `total_distance_covered` | ✅ VIDEO | Sum of centroid displacements × scale |
| `court_coverage_pct` | ✅ VIDEO | % of court area grid visited |
| `avg_speed` | ✅ VIDEO | Total distance / session duration |
| `positioning_iq` | ✅ VIDEO | % frames in optimal zone (Cricket / Table Tennis) |
| `reach_radius` | ✅ VIDEO | Max distance from base position (pose + centroid) |

### Pillar 7 — Technique Consistency
| Sub-metric | Status | Reason if removed |
|---|---|---|
| `joint_angle_cv` | ✅ VIDEO | CoV of elbow angle across reps |
| `stroke_repeatability` | ✅ VIDEO | `100 - joint_angle_cv` |
| `wrist_path_variance` | ✅ VIDEO | DTW distance across stroke reps |
| `timing_regularity` | ✅ VIDEO | % push intervals within ±10% of median |
| `release_consistency` | ✅ VIDEO | Cricket: wrist angle variance at ball release |

### Pillar 8 — Power Transfer & Shot Execution
| Sub-metric | Status | Reason if removed |
|---|---|---|
| `kinetic_chain_score` | ✅ VIDEO | trunk→shoulder→elbow→wrist sequential activation |
| `wrist_speed_at_contact` | ✅ VIDEO | Wrist keypoint velocity at ball contact frame |
| `trunk_contribution_ratio` | ✅ VIDEO | % of arm velocity from trunk rotation |
| `follow_through_arc` | ✅ VIDEO | Post-contact wrist continuation angle |
| ~~shot_power_index~~ | ❌ COMPOSITE | Was a composite of 3 sub-metrics — removed per no-composite rule |

### Pillar 9 — Performance Under Pressure
| Sub-metric | Status | Reason if removed |
|---|---|---|
| `pressure_consistency_score` | ✅ VIDEO | Pillar 7 consistency measured in high-intensity windows |
| `pressure_reaction_time` | ✅ VIDEO | Pillar 5 reaction time in high-intensity windows |
| `form_degradation_under_load` | ✅ VIDEO | Drop in consistency: low-intensity → high-intensity |

### Pillar 10 — Work-Rate & Second-Effort Intensity
| Sub-metric | Status | Reason if removed |
|---|---|---|
| `speed_bursts_per_min` | ✅ VIDEO | Speed exceeds 1.5× mean — count per minute |
| `burst_peak_speed` | ✅ VIDEO | Maximum speed across all burst events |
| `burst_duration_avg` | ✅ VIDEO | Mean duration of burst events |
| `second_effort_count` | ✅ VIDEO | Bursts within 5 sec of a previous burst |
| `second_effort_speed_ratio` | ✅ VIDEO | 2nd burst speed as % of 1st burst speed |
| `rest_to_burst_ratio` | ✅ VIDEO | Low-intensity : burst frame ratio |

### Pillar 11 — Fatigue & Recovery Profile
| Sub-metric | Status | Reason if removed |
|---|---|---|
| `fatigue_onset_time` | ✅ VIDEO | Time when speed drops below 85% of opening average |
| `velocity_drop_rate` | ✅ VIDEO | Linear regression slope of rim speed over session |
| `post_burst_recovery_time` | ✅ VIDEO | Time to baseline speed after each burst |
| `late_session_speed_index` | ✅ VIDEO | Avg speed: last 20% vs first 20% of session |
| `technique_degradation_rate` | ✅ VIDEO | Drop in stroke repeatability: first → second half |

### Pillar 12 — Injury Risk Index *(renamed — autonomic removed)*
| Sub-metric | Status | Reason if removed |
|---|---|---|
| `rsi_index` | ✅ VIDEO | `push_cadence × duration_min × shoulder_angle_std` |
| `rsi_risk_level` | ✅ VIDEO | LOW / MED / HIGH categorical from rsi_index |
| `shoulder_strain_angle` | ✅ VIDEO | Std deviation of shoulder elevation angle across pushes |
| `asymmetry_stress_score` | ✅ VIDEO | `(100 - symmetry_ratio) × (cadence/60)` |
| `overuse_flag` | ✅ VIDEO | True if RSI > 35 AND session > 20min AND tech_degradation > 15% |
| ~~bp_dynamics_proxy~~ | ❌ HARDWARE | Blood pressure requires a BP cuff/sensor |
| ~~heart_rate~~ | ❌ HARDWARE | Requires HR monitor / PPG sensor |
| ~~spo2~~ | ❌ HARDWARE | Requires pulse oximeter |

### Pillar 13 — Sustained Motion Output *(renamed from Cardiovascular — HR/VO2 removed)*
> Actual cardiovascular metrics (HR, VO2max, lactate) all need hardware. This pillar uses **motion-based output indicators** that are measurable from video and meaningful for performance tracking.

| Sub-metric | Status | Reason if removed |
|---|---|---|
| `sustained_speed_ratio` | ✅ VIDEO | Avg speed / Peak speed across session |
| `high_intensity_time_pct` | ✅ VIDEO | % session above 60% of peak speed |
| `total_distance_covered` | ✅ VIDEO | Full session centroid displacement |
| `speed_consistency_index` | ✅ VIDEO | Std dev of speed across session (lower = more consistent output) |
| ~~aerobic_endurance_score~~ | ❌ COMPOSITE | Was composite of sub-metrics — removed |
| ~~vo2max_estimate~~ | ❌ HARDWARE | Requires metabolic analyser |
| ~~heart_rate_recovery~~ | ❌ HARDWARE | Requires HR monitor |

### Pillar 14 — Late-Session Movement Quality *(renamed from Core Thermoregulation — temperature removed)*
> Core body temperature requires a thermometer or thermal camera. This pillar uses **late-session movement quality degradation** signals observable from keypoints — validated in biomechanics literature as early fatigue/stress markers.

| Sub-metric | Status | Reason if removed |
|---|---|---|
| `late_session_tremor_index` | ⚠️ PROXY | High-frequency (8–12 Hz) wrist keypoint variance — proxy for late-session fatigue |
| `movement_smoothness_decay` | ✅ VIDEO | Drop in jerk-smoothness Q1 → Q4 |
| `coordination_degradation` | ✅ VIDEO | Drop in coordination_score Q1 → Q4 |
| ~~core_temperature~~ | ❌ HARDWARE | Requires thermometer or thermal camera |
| ~~sweat_rate~~ | ❌ HARDWARE | Requires weight scale or sweat patch |

---

## 2 · Final Metric Inventory (Video-Only, Post-Audit)

**Total extractable sub-metrics: 57** across all 14 pillars.
Each gets its own `value + score` card on the dashboard. No composite. No judgment.

| Pillar | Sub-metrics (video-only) | Count |
|---|---|---|
| P1 Propulsion & Cadence | rim_speed_peak, rim_speed_avg, push_cadence, contact_arc_angle | 4 |
| P2 Bilateral Symmetry | symmetry_ratio, left_push_arc, right_push_arc, timing_offset, dominant_side | 5 |
| P3 Chair Maneuverability | min_turning_radius, avg_turning_radius, angular_velocity, braking_distance, braking_deceleration, pivot_precision | 6 |
| P4 Stability & Control | trunk_lean_forward, trunk_lean_lateral, trunk_rotation_angle, head_stability_index, coordination_score | 5 |
| P5 Reaction & Decision | reaction_time_avg, reaction_time_best, movement_initiation_type, decision_consistency | 4 |
| P6 Spatial Coverage | total_distance_covered, court_coverage_pct, avg_speed, positioning_iq, reach_radius | 5 |
| P7 Technique Consistency | joint_angle_cv, stroke_repeatability, wrist_path_variance, timing_regularity, release_consistency | 5 |
| P8 Power Transfer | kinetic_chain_score, wrist_speed_at_contact, trunk_contribution_ratio, follow_through_arc | 4 |
| P9 Pressure Performance | pressure_consistency_score, pressure_reaction_time, form_degradation_under_load | 3 |
| P10 Work-Rate | speed_bursts_per_min, burst_peak_speed, burst_duration_avg, second_effort_count, second_effort_speed_ratio, rest_to_burst_ratio | 6 |
| P11 Fatigue & Recovery | fatigue_onset_time, velocity_drop_rate, post_burst_recovery_time, late_session_speed_index, technique_degradation_rate | 5 |
| P12 Injury Risk | rsi_index, rsi_risk_level, shoulder_strain_angle, asymmetry_stress_score, overuse_flag | 5 |
| P13 Sustained Motion Output | sustained_speed_ratio, high_intensity_time_pct, total_distance_covered*, speed_consistency_index | 3 (total_distance shared with P6) |
| P14 Late-Session Movement Quality | late_session_tremor_index, movement_smoothness_decay, coordination_degradation | 3 |
| **Total** | | **~57** |

---

## 3 · Per-Sport Coverage Matrix (Video-Only Pillars)

| Pillar | Basketball | Tennis | Racing | Table Tennis | Cricket |
|---|:---:|:---:|:---:|:---:|:---:|
| P1 Propulsion & Cadence | ✅ | ✅ | ✅ | ❌ | ❌ |
| P2 Bilateral Symmetry | ✅ | ✅ | ✅ | ❌ | ❌ |
| P3 Chair Maneuverability | ✅ | ✅ | ❌ | ✅ turning only | ❌ |
| P4 Stability & Control | ✅ | ✅ | ✅ coordination | ✅ | ✅ coordination + follow-through |
| P5 Reaction & Decision | ✅ | ✅ | ✅ reaction only | ✅ | ✅ |
| P6 Spatial Coverage | ✅ | ✅ | ❌ | ✅ | ✅ positioning IQ + reach |
| P7 Technique Consistency | ✅ | ✅ | ✅ consistency only | ✅ | ✅ consistency + release |
| P8 Power Transfer | ✅ | ✅ | ✅ power transfer only | ✅ accuracy only | ✅ power only |
| P9 Pressure Performance | ✅ | ✅ | ❌ | ✅ pressure accuracy | ✅ |
| P10 Work-Rate | ✅ | ✅ work-rate only | ✅ | ❌ | ❌ |
| P11 Fatigue & Recovery | ✅ | ✅ | ✅ | ❌ | ❌ |
| P12 Injury Risk | ✅ | ✅ | ✅ RSI only | ❌ | ❌ |
| P13 Sustained Motion Output | ✅ | ✅ | ✅ | ❌ | ❌ |
| P14 Late-Session Quality | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Active Pillars** | **14** | **13** | **11** | **8** | **8** |

---

## 4 · Individual Scoring Model (Per Sub-Metric)

> **No composite. No grade. No fitness verdict.**
> Each sub-metric has its own `score` (0–100) computed independently.

```
For each sub-metric M:
  score(M) = normalize(value(M), baseline_low(M, sport, ipc_class),
                                 baseline_high(M, sport, ipc_class))
           = clamp( (value - low) / (high - low) × 100, 0, 100 )
```

For metrics where **lower is better** (e.g. `turning_radius`, `reaction_time`, `joint_angle_cv`):
```
score(M) = clamp( (high - value) / (high - low) × 100, 0, 100 )
```

`baseline_low` and `baseline_high` come from `config/ipc_baselines.json` — keyed by `sport × ipc_class × sub_metric`.

**Dashboard card shape (per sub-metric):**
```json
{
  "id":           "p01_rim_speed_peak",
  "pillar":       "Propulsion Power & Cadence",
  "label":        "Peak Rim Speed",
  "value":        3.8,
  "unit":         "m/s",
  "score":        88,
  "higher_is_better": true,
  "trend":        "+0.3",
  "trend_unit":   "m/s vs last session"
}
```

The app dashboard renders one card per sub-metric. No card references another card's score.

---

## 5 · Pipeline Architecture

```
INPUT VIDEO (MP4 / MOV / AVI)
         │
         ▼
┌─────────────────────────────────────────┐
│  STAGE 1 · Pre-Processor                │
│  • Decode frames (OpenCV VideoCapture)  │
│  • ECC video stabilization              │
│  • Camera angle detection               │
│  • Pixel→meter scale (wheel diameter)   │
│  • FPS normalize → 30fps               │
└──────────────┬──────────────────────────┘
               │
     ┌─────────┴─────────┐
     ▼                   ▼
┌──────────────┐  ┌──────────────────────────┐
│ STAGE 2A     │  │ STAGE 2B                 │
│ MediaPipe    │  │ YOLOv8n Detection        │
│ BlazePose    │  │ Classes tracked:         │
│ 33 keypoints │  │  · person (athlete)      │
│ per frame    │  │  · wheelchair_frame      │
│ 3D + visibility  │  · wheel_left / right  │
│ confidence   │  │  · ball (sport-specific) │
└──────┬───────┘  └──────────┬───────────────┘
       │                     │
       └──────────┬──────────┘
                  ▼
┌─────────────────────────────────────────┐
│  STAGE 3 · Optical Flow & Kinematics    │
│  • Farneback dense flow on wheel ROI    │
│  • ω → rim speed (v = ω × r)           │
│  • Centroid trajectory → speed, accel  │
│  • Ball trajectory → reaction trigger  │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│  STAGE 4 · 14-Pillar Feature Engine     │
│  sport_dispatcher reads sport_matrix    │
│  → runs only applicable pillar modules  │
│  → each module returns sub-metrics dict │
│  → Kalman smoothing on all time-series  │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│  STAGE 5 · Individual Scoring           │
│  For each sub-metric independently:     │
│  • Look up IPC class baseline range     │
│  • Normalize value → score 0–100        │
│  • Compute trend vs previous session    │
│  • NO aggregation. NO composite.        │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│  STAGE 6 · Feedback Generator           │
│  • Pick 3 most notable sub-metrics      │
│    (highest deviation from baseline)    │
│  • One sentence per metric              │
│  • scout_feedback (3–4 lines)           │
│  • coach_feedback (3–4 lines)           │
│  • NO fitness verdict                   │
└──────────────┬──────────────────────────┘
               ▼
        JSON → App API → Dashboard Cards
```

---

## 6 · Folder Structure

```
parasync-pipeline/
├── main.py                        ← CLI: python main.py --video x.mp4 --sport basketball --class T53
├── api.py                         ← FastAPI: POST /analyse · GET /analyse/status/{job_id}
│
├── pipeline/
│   ├── __init__.py
│   ├── preprocessor.py            ← Stage 1
│   ├── pose_detector.py           ← Stage 2A: MediaPipe BlazePose
│   ├── object_detector.py         ← Stage 2B: YOLOv8n
│   ├── optical_flow.py            ← Stage 3: rim speed + centroid kinematics
│   │
│   ├── pillars/                   ← Stage 4: one module per pillar
│   │   ├── __init__.py
│   │   ├── p01_propulsion.py
│   │   ├── p02_symmetry.py
│   │   ├── p03_maneuverability.py
│   │   ├── p04_stability.py
│   │   ├── p05_reaction.py
│   │   ├── p06_spatial.py
│   │   ├── p07_consistency.py
│   │   ├── p08_power_transfer.py
│   │   ├── p09_pressure.py
│   │   ├── p10_workrate.py
│   │   ├── p11_fatigue.py
│   │   ├── p12_injury_risk.py
│   │   ├── p13_sustained_output.py
│   │   └── p14_movement_quality.py
│   │
│   ├── sport_dispatcher.py        ← Routes to correct pillar subset per sport
│   ├── individual_scorer.py       ← Stage 5: per-sub-metric normalization (no composite)
│   └── feedback_generator.py      ← Stage 6: rule-based 3–4 line output
│
├── models/
│   ├── yolov8n.pt                 ← Base COCO weights
│   └── yolov8n_parasync.pt        ← Fine-tuned: wheelchair + wheel + ball classes
│
├── config/
│   ├── sport_matrix.json          ← Pillar applicability per sport + scope overrides
│   ├── ipc_baselines.json         ← Per-sport × per-class baseline ranges for scoring
│   ├── higher_is_better.json      ← Which sub-metrics are scored inverse (lower=better)
│   └── feedback_templates.json    ← One template per sub-metric × status level
│
├── utils/
│   ├── keypoints.py               ← BlazePose landmark constants
│   ├── geometry.py                ← angle(), distance(), curvature(), jerk()
│   ├── kalman.py                  ← 1D Kalman filter
│   ├── dtw.py                     ← Dynamic Time Warping (Pillar 7)
│   ├── fft_utils.py               ← FFT cadence extraction (Pillar 1)
│   ├── video_utils.py             ← Frame decode, FPS, resolution
│   └── scale_estimator.py         ← Pixel→meter from wheel diameter
│
├── tests/
│   ├── test_pillar_01.py
│   ├── test_pillar_05.py          ← Reaction time — most complex
│   ├── test_pillar_07.py          ← DTW consistency
│   ├── test_individual_scorer.py
│   └── sample_videos/
│
├── requirements.txt
├── Dockerfile
└── README.md
```

---

## 7 · Core Module Signatures

### `individual_scorer.py` (Stage 5)

```python
import json

baselines = json.load(open('config/ipc_baselines.json'))
higher_is_better = json.load(open('config/higher_is_better.json'))

def score_metric(metric_id: str, value: float, sport: str, ipc_class: str) -> int:
    """
    Returns a 0–100 score for a single sub-metric.
    No aggregation. Called once per sub-metric.
    """
    ref = baselines[sport][ipc_class][metric_id]
    low, high = ref['low'], ref['high']

    if higher_is_better.get(metric_id, True):
        raw = (value - low) / (high - low)
    else:
        # Lower value is better (e.g. turning_radius, reaction_time, joint_angle_cv)
        raw = (high - value) / (high - low)

    return int(max(0, min(100, raw * 100)))


def score_all(pillar_results: dict, sport: str, ipc_class: str,
              prev_session: dict = None) -> list:
    """
    Input:  pillar_results — dict of all sub-metric raw values
    Output: list of dashboard card objects (one per sub-metric)
    No composite, no aggregation.
    """
    cards = []
    for metric_id, meta in pillar_results.items():
        value = meta['value']
        s = score_metric(metric_id, value, sport, ipc_class)
        trend = None
        if prev_session and metric_id in prev_session:
            trend = round(value - prev_session[metric_id]['value'], 2)

        cards.append({
            'id':               metric_id,
            'pillar':           meta['pillar'],
            'label':            meta['label'],
            'value':            value,
            'unit':             meta['unit'],
            'score':            s,
            'higher_is_better': higher_is_better.get(metric_id, True),
            'trend':            trend,
            'trend_unit':       meta['unit'] + ' vs last session' if trend is not None else None,
        })
    return cards
```

### Each Pillar Module Signature

```python
# Example: p01_propulsion.py
def extract(pose_series: list,
            object_series: list,
            flow_series: list,
            fps: int,
            scope: str = 'full') -> dict:
    """
    Returns raw sub-metric values only.
    Scoring is done separately in individual_scorer.py.
    """
    return {
        'p01_rim_speed_peak': {
            'value': ...,
            'unit':  'm/s',
            'label': 'Peak Rim Speed',
            'pillar': 'Propulsion Power & Cadence',
        },
        'p01_rim_speed_avg': { ... },
        'p01_push_cadence':  { ... },
        'p01_contact_arc':   { ... },
    }
```

---

## 8 · `config/higher_is_better.json`

Defines which sub-metrics score inversely (lower value = better performance):

```json
{
  "p01_rim_speed_peak":          true,
  "p01_rim_speed_avg":           true,
  "p01_push_cadence":            true,
  "p01_contact_arc_angle":       true,
  "p02_symmetry_ratio":          true,
  "p02_left_push_arc":           true,
  "p02_right_push_arc":          true,
  "p02_timing_offset":           false,
  "p03_min_turning_radius":      false,
  "p03_avg_turning_radius":      false,
  "p03_angular_velocity":        true,
  "p03_braking_distance":        false,
  "p03_braking_deceleration":    true,
  "p03_pivot_precision":         true,
  "p04_trunk_lean_forward":      false,
  "p04_trunk_lean_lateral":      false,
  "p04_trunk_rotation_angle":    false,
  "p04_head_stability_index":    true,
  "p04_coordination_score":      true,
  "p05_reaction_time_avg":       false,
  "p05_reaction_time_best":      false,
  "p05_decision_consistency":    true,
  "p06_total_distance":          true,
  "p06_court_coverage_pct":      true,
  "p06_avg_speed":               true,
  "p06_positioning_iq":          true,
  "p06_reach_radius":            true,
  "p07_joint_angle_cv":          false,
  "p07_stroke_repeatability":    true,
  "p07_wrist_path_variance":     false,
  "p07_timing_regularity":       true,
  "p07_release_consistency":     true,
  "p08_kinetic_chain_score":     true,
  "p08_wrist_speed_at_contact":  true,
  "p08_trunk_contribution_ratio":true,
  "p08_follow_through_arc":      true,
  "p09_pressure_consistency":    true,
  "p09_pressure_reaction_time":  false,
  "p09_form_degradation":        false,
  "p10_speed_bursts_per_min":    true,
  "p10_burst_peak_speed":        true,
  "p10_burst_duration_avg":      true,
  "p10_second_effort_count":     true,
  "p10_second_effort_speed_ratio":true,
  "p11_fatigue_onset_time":      true,
  "p11_velocity_drop_rate":      false,
  "p11_post_burst_recovery_time":false,
  "p11_late_session_speed_index":true,
  "p11_technique_degradation":   false,
  "p12_rsi_index":               false,
  "p12_shoulder_strain_angle":   false,
  "p12_asymmetry_stress_score":  false,
  "p13_sustained_speed_ratio":   true,
  "p13_high_intensity_time_pct": true,
  "p13_speed_consistency_index": false,
  "p14_tremor_index":            false,
  "p14_smoothness_decay":        false,
  "p14_coordination_degradation":false
}
```

---

## 9 · JSON Output Schema (Dashboard-Ready)

```json
{
  "session_id": "uuid-v4",
  "athlete_id": "uuid-v4",
  "sport": "wheelchair_basketball",
  "ipc_class": "T53",

  "video_metadata": {
    "duration_sec": 247,
    "fps": 30,
    "resolution": "1280x720",
    "camera_angle": "side",
    "pixel_per_meter": 142.3,
    "frames_analysed": 7410,
    "pose_confidence_avg": 0.82
  },

  "metric_cards": [
    {
      "id":               "p01_rim_speed_peak",
      "pillar":           "Propulsion Power & Cadence",
      "label":            "Peak Rim Speed",
      "value":            4.1,
      "unit":             "m/s",
      "score":            91,
      "higher_is_better": true,
      "trend":            0.3,
      "trend_unit":       "m/s vs last session"
    },
    {
      "id":               "p01_rim_speed_avg",
      "pillar":           "Propulsion Power & Cadence",
      "label":            "Avg Rim Speed",
      "value":            3.2,
      "unit":             "m/s",
      "score":            78,
      "higher_is_better": true,
      "trend":            -0.1,
      "trend_unit":       "m/s vs last session"
    },
    {
      "id":               "p01_push_cadence",
      "pillar":           "Propulsion Power & Cadence",
      "label":            "Push Cadence",
      "value":            54,
      "unit":             "pushes/min",
      "score":            84,
      "higher_is_better": true,
      "trend":            2,
      "trend_unit":       "pushes/min vs last session"
    },
    {
      "id":               "p02_symmetry_ratio",
      "pillar":           "Bilateral Push Symmetry",
      "label":            "Push Symmetry Ratio",
      "value":            92,
      "unit":             "%",
      "score":            88,
      "higher_is_better": true,
      "trend":            1.2,
      "trend_unit":       "% vs last session"
    },
    {
      "id":               "p05_reaction_time_avg",
      "pillar":           "Reaction & Decision Speed",
      "label":            "Avg Reaction Time",
      "value":            284,
      "unit":             "ms",
      "score":            76,
      "higher_is_better": false,
      "trend":            -18,
      "trend_unit":       "ms vs last session"
    },
    {
      "id":               "p12_rsi_index",
      "pillar":           "Injury Risk Index",
      "label":            "RSI Index",
      "value":            14,
      "unit":             "index",
      "score":            86,
      "higher_is_better": false,
      "trend":            -2,
      "trend_unit":       "index vs last session"
    },
    {
      "id":               "p12_rsi_risk_level",
      "pillar":           "Injury Risk Index",
      "label":            "RSI Risk Level",
      "value":            "LOW",
      "unit":             null,
      "score":            null,
      "higher_is_better": null,
      "trend":            null,
      "trend_unit":       null
    }
  ],

  "pillars_computed": ["p01","p02","p03","p04","p05","p06","p07","p08","p09","p10","p11","p12","p13","p14"],
  "pillars_skipped":  [],

  "feedback": {
    "scout_feedback": "Peak rim speed of 4.1 m/s sits in the top 9% for T53 Basketball — exceptional propulsion output. Push symmetry at 92% shows strong bilateral drive. Reaction time averaged 284ms — fast, consistent decision-making across the session. RSI index is 14 (LOW) — no injury risk indicators from this session.",
    "coach_feedback": "Right push arc is 12° shorter than left — isolate right shoulder drive in resistance work. Technique consistency drops from 87% to 74% in the final session quarter — fatigue-paced degradation; add lactate threshold intervals. Trunk contribution to shot power is 38% — room to improve thoracic rotation drive. Late-session tremor index is low — movement quality well maintained."
  },

  "ai_log": [
    { "msg": "Peak rim speed 4.1 m/s — top 9% for T53 Basketball",         "type": "good" },
    { "msg": "Push symmetry 92% — strong bilateral drive detected",          "type": "good" },
    { "msg": "Right push arc 12° shorter than left — asymmetry noted",      "type": "warn" },
    { "msg": "Technique consistency drops 13% in final session quarter",    "type": "warn" },
    { "msg": "Reaction time 284ms avg — fast decision-making observed",     "type": "good" },
    { "msg": "RSI index 14 (LOW) — no overuse pattern detected",            "type": "good" }
  ],

  "processing_meta": {
    "pipeline_version":   "3.0.0",
    "processing_time_sec": 138,
    "total_metric_cards":  47,
    "hardware_metrics_skipped": ["spo2","heart_rate","blood_pressure","core_temperature"]
  }
}
```

---

## 10 · SSE Progress Events (App A-03 Processing Screen)

| Event | `progress` | Message shown in app |
|---|---|---|
| `decode` | 5% | "Extracting and decoding video frames" |
| `stabilize` | 12% | "Stabilizing footage — removing camera shake" |
| `pose_detection` | 30% | "Running pose estimation on athlete body" |
| `object_detection` | 45% | "Detecting wheelchair and tracking wheel mechanics" |
| `optical_flow` | 55% | "Computing rim speed and trajectory data" |
| `feature_p01_p04` | 65% | "Extracting propulsion, symmetry and stability metrics" |
| `feature_p05_p08` | 73% | "Measuring reaction speed, coverage and technique" |
| `feature_p09_p14` | 82% | "Computing pressure response, fatigue and injury signals" |
| `scoring` | 90% | "Scoring each metric against classification baseline" |
| `feedback` | 96% | "Generating scouting and coaching report" |
| `complete` | 100% | "Analysis complete" |

---

## 11 · Build Phases

| Phase | Files | What | Complexity |
|---|---|---|---|
| P1 | `preprocessor.py`, `video_utils.py`, `scale_estimator.py` | Decode, stabilize, scale | Low |
| P2 | `pose_detector.py`, `keypoints.py`, `kalman.py` | MediaPipe BlazePose wrapper | Low |
| P3 | `object_detector.py` | YOLOv8n: athlete, wheelchair, wheels, ball | Medium |
| P4 | `optical_flow.py`, `geometry.py` | Farneback rim speed + centroid kinematics | Medium |
| P5 | `p01_propulsion.py`, `fft_utils.py` | Pillar 1: rim speed + cadence FFT | Medium |
| P6 | `p02_symmetry.py` | Pillar 2: L/R push arc comparison | Low |
| P7 | `p03_maneuverability.py` | Pillar 3: turning radius, braking | Medium |
| P8 | `p04_stability.py` | Pillar 4: trunk angles, coordination | Low |
| P9 | `p05_reaction.py` | Pillar 5: ball zone → body movement timing | **High** |
| P10 | `p06_spatial.py` | Pillar 6: heatmap, distance, coverage | Low |
| P11 | `p07_consistency.py`, `dtw.py` | Pillar 7: DTW stroke comparison | **High** |
| P12 | `p08_power_transfer.py` | Pillar 8: kinetic chain sequence | Medium |
| P13 | `p09_pressure.py` | Pillar 9: high-intensity window analysis | Medium |
| P14 | `p10_workrate.py`, `p11_fatigue.py` | Pillars 10–11 | Low |
| P15 | `p12_injury_risk.py` | Pillar 12: RSI, shoulder strain | Low |
| P16 | `p13_sustained_output.py` | Pillar 13: motion output indicators | Low |
| P17 | `p14_movement_quality.py` | Pillar 14: tremor + smoothness decay | Medium |
| P18 | `sport_dispatcher.py`, `sport_matrix.json` | Route pillars per sport | Low |
| P19 | `individual_scorer.py`, `ipc_baselines.json`, `higher_is_better.json` | Per-metric scoring | Medium |
| P20 | `feedback_generator.py`, `feedback_templates.json` | 3–4 line output | Low |
| P21 | `api.py`, Dockerfile, SSE stream | FastAPI server | Medium |

---

## 12 · `requirements.txt`

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

*ParaSync 2.0 · Feature Extraction Pipeline Plan v3 · Video-Only · Individual Scores · No Composite*
*Team Code Blooded · NIT Rourkela · 2026-08-22*
