# ParaSync 2.0 — Feature Extraction Pipeline

> **Team Code Blooded · NIT Rourkela · Samsung Solve For Tomorrow 2026 — Top 100**

A Python computer-vision pipeline that analyses wheelchair sports videos and produces **57 individual sub-metric scores** across 14 biomechanical pillars — no hardware sensors, no composite grades.

---

## Stack

| Component | Technology |
|---|---|
| Pose Estimation | MediaPipe BlazePose FULL (33 keypoints, 3D) |
| Object Detection | YOLOv8n (wheelchair + wheel + ball) |
| Optical Flow | OpenCV Farneback |
| Math | NumPy · SciPy |
| API Server | FastAPI + SSE streaming |
| Scoring | Per-metric normalization vs IPC baseline |

---

## Quick Start

### 1. Install dependencies

```bash
cd pipeline
pip install -r requirements.txt
```

Optional: set `GEMINI_API_KEY` in `.env` (free key at https://aistudio.google.com/apikey) to get LLM-generated scout/coach feedback per session instead of the rule-based fallback — see `src/llm/gemini_client.py`.

### 2. Run CLI analysis

```bash
python main.py \
  --video sample.mp4 \
  --sport wheelchair_basketball \
  --class T53 \
  --verbose
```

### 3. Run API server

```bash
uvicorn api:app --host 0.0.0.0 --port 8000
```

### 4. Run tests

```bash
pytest tests/ -v
```

### 5. Docker

```bash
docker build -t parasync-pipeline .
docker run -p 8000:8000 parasync-pipeline
```

---

## Supported Sports & Classes

| Sport | Active Pillars | IPC Classes |
|---|---|---|
| Wheelchair Basketball | 14 | T51, T52, T53, T54 |
| Wheelchair Tennis | 13 | T3, T4 |
| Wheelchair Racing | 11 | T51, T54 |
| Wheelchair Table Tennis | 8 | TT3, TT5 |
| Wheelchair Cricket | 8 | T3, T4 |

---

## The 14 Pillars (57 Video-Only Sub-Metrics)

| # | Pillar | Sub-metrics | Count |
|---|---|---|---|
| P1 | Propulsion Power & Cadence | rim_speed_peak, rim_speed_avg, push_cadence, contact_arc_angle | 4 |
| P2 | Bilateral Push Symmetry | symmetry_ratio, left_push_arc, right_push_arc, timing_offset, dominant_side | 5 |
| P3 | Chair Maneuverability | min_turning_radius, avg_turning_radius, angular_velocity, braking_distance, braking_deceleration, pivot_precision | 6 |
| P4 | Chair-Body Stability | trunk_lean_forward, trunk_lean_lateral, trunk_rotation_angle, head_stability_index, coordination_score | 5 |
| P5 | Reaction & Decision Speed | reaction_time_avg, reaction_time_best, movement_initiation_type, decision_consistency | 4 |
| P6 | Spatial Coverage | total_distance_covered, court_coverage_pct, avg_speed, positioning_iq, reach_radius | 5 |
| P7 | Technique Consistency | joint_angle_cv, stroke_repeatability, wrist_path_variance, timing_regularity, release_consistency | 5 |
| P8 | Power Transfer | kinetic_chain_score, wrist_speed_at_contact, trunk_contribution_ratio, follow_through_arc | 4 |
| P9 | Performance Under Pressure | pressure_consistency_score, pressure_reaction_time, form_degradation_under_load | 3 |
| P10 | Work-Rate & Second Effort | speed_bursts_per_min, burst_peak_speed, burst_duration_avg, second_effort_count, second_effort_speed_ratio | 5 |
| P11 | Fatigue & Recovery | fatigue_onset_time, velocity_drop_rate, post_burst_recovery_time, late_session_speed_index, technique_degradation_rate | 5 |
| P12 | Injury Risk Index | rsi_index, rsi_risk_level, shoulder_strain_angle, asymmetry_stress_score, overuse_flag | 5 |
| P13 | Sustained Motion Output | sustained_speed_ratio, high_intensity_time_pct, speed_consistency_index | 3 |
| P14 | Late-Session Movement Quality | late_session_tremor_index, movement_smoothness_decay, coordination_degradation | 3 |

**Removed:** SpO2, heart rate, blood pressure, core temperature, force sensors — all hardware-only.

---

## Scoring Model

Each sub-metric scored independently (0–100). No composite. No grade.

```python
# higher_is_better (e.g. rim_speed, symmetry):
score = clamp((value - baseline_low) / (baseline_high - baseline_low) × 100, 0, 100)

# lower_is_better (e.g. reaction_time, turning_radius):
score = clamp((baseline_high - value) / (baseline_high - baseline_low) × 100, 0, 100)
```

Baselines defined per `sport × ipc_class × sub_metric` in `config/ipc_baselines.json`.

---

## API Reference

### `POST /analyse`

**Form fields:**
| Field | Type | Required | Description |
|---|---|---|---|
| `video` | file | ✅ | MP4/MOV/AVI video file |
| `sport` | string | ✅ | e.g. `wheelchair_basketball` |
| `ipc_class` | string | ✅ | e.g. `T53` |
| `athlete_id` | string | ❌ | Athlete UUID |
| `session_id` | string | ❌ | Auto-generated if omitted |

**Response:** SSE stream → final JSON result on `complete` event.

### SSE Progress Events

| Event | Progress | Message |
|---|---|---|
| `decode` | 5% | Extracting video frames |
| `stabilize` | 12% | Stabilizing footage |
| `pose_detection` | 30% | Running pose estimation |
| `object_detection` | 45% | Detecting wheelchair mechanics |
| `optical_flow` | 55% | Computing rim speed |
| `feature_p01_p04` | 65% | Extracting biomechanics metrics |
| `feature_p05_p08` | 73% | Measuring reaction and technique |
| `feature_p09_p14` | 82% | Computing fatigue and injury signals |
| `scoring` | 90% | Scoring metrics against IPC baseline |
| `feedback` | 96% | Generating coaching report |
| `complete` | 100% | Analysis complete (includes full JSON) |

---

## Project Structure

```
pipeline/
├── main.py                    ← CLI entry
├── api.py                     ← FastAPI + SSE
├── pipeline/
│   ├── preprocessor.py        ← Stage 1: decode, stabilize
│   ├── pose_detector.py       ← Stage 2A: BlazePose
│   ├── object_detector.py     ← Stage 2B: YOLOv8n
│   ├── optical_flow.py        ← Stage 3: rim speed + kinematics
│   ├── pillars/               ← Stage 4: p01–p14
│   ├── sport_dispatcher.py    ← Routes by sport
│   ├── individual_scorer.py   ← Stage 5: 0–100 per metric
│   └── feedback_generator.py  ← Stage 6: text output
├── config/
│   ├── sport_matrix.json      ← Pillar applicability per sport
│   ├── ipc_baselines.json     ← Per-class scoring ranges
│   ├── higher_is_better.json  ← Scoring direction per metric
│   └── feedback_templates.json
├── utils/
│   ├── keypoints.py · geometry.py · kalman.py
│   ├── dtw.py · fft_utils.py
│   ├── video_utils.py · scale_estimator.py
├── models/                    ← YOLOv8n weights (see models/README.md)
├── tests/                     ← pytest test suite
├── requirements.txt
└── Dockerfile
```

---

*ParaSync 2.0 · Team Code Blooded · NIT Rourkela · 2026*
