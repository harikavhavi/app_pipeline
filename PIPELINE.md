# ParaSync ML Pipeline — Technical Reference

End-to-end trace of how a wheelchair-sport training video becomes a performance report — from FastAPI upload through pose estimation, detection, tracking, feature extraction and scoring, back to the app as an SSE stream.

**At a glance:** 13 pipeline stages · 4 scoring pillars · ~28 metric cards per session · 6 sports with reference baselines · 3-tier detector fallback

---

## 1. Stack

Python 3.11 throughout. Classical CV and a pretrained pose net do the heavy lifting — no custom neural net is trained for pose; only the wheelchair/wheel detector has a training path.

| Area | Libraries |
|---|---|
| Pose | `mediapipe==0.10.14` (BlazePose, 33 landmarks) |
| Detection | `ultralytics==8.4.138` (YOLOv8n) — custom → stock → stub fallback |
| Computer vision | `opencv-python==4.10.0.84` (Hough circles, Lucas-Kanade, Farneback) |
| Signal & filtering | `numpy==1.26.4`, `scipy==1.13.0` (FFT / DTW), `filterpy==1.4.5` (Kalman) |
| Service | `fastapi==0.111.0`, `uvicorn==0.30.0`, `sse-starlette==2.1.0`, `pydantic==2.8.2` |
| Persistence | `sqlalchemy==2.0.30` over SQLite, `Pillow==10.3.0` |
| Container | `python:3.11-slim` + `ffmpeg`, `libgl1-mesa-glx`; exposes port 8000; `uvicorn api:app --workers 2` |

---

## 2. Architecture note — README ≠ code

`pipeline/README.md` documents an aspirational design (`pillars/`, `sport_dispatcher.py`, `config/ipc_baselines.json`, "57 sub-metrics across 14 pillars"). None of that exists on disk.

The pipeline actually running is `pipeline/api.py` + `pipeline/src/`, which produces **4 pillars** and **~28 metric cards**. A legacy `pipeline/pipeline/preprocessor.py` survives only for camera-angle detection.

> **Known gap:** `data/weights/yolov8n_wheelchair.pt` (the fine-tuned wheelchair/wheel detector) is not checked into the repo. Without it, ball/rim tracking is skipped entirely and detection silently falls back to a stock COCO person-detector wearing a "wheelchair" label.

---

## 3. Pipeline flow

Triggered by `POST /analyse` in `api.py`. Progress streams back to the app as Server-Sent Events, each stage tagged with the completion percentage the UI progress bar reads.

| # | Stage | % | What happens |
|---|---|---|---|
| 1 | Upload & decode | 5% | Video saved to a temp file via `tempfile.NamedTemporaryFile`; SSE stream opens. |
| 2 | Camera-angle detection | 12% | Farneback optical flow across ~16 frames at the clip midpoint classifies `side` / `top` / `angled`. |
| 3 | Pose extraction | 30% | MediaPipe BlazePose runs per frame (`model_complexity=1`) into a 33-keypoint skeleton with visibility scores; missing MediaPipe degrades to all-null keypoints rather than crashing. |
| 4 | Keyframe preview | — | 10 frames sampled across the clip, skeleton drawn on each, cached in memory and fetched separately by the UI's processing screen — kept out of the SSE payload to avoid size limits on React Native. |
| 5 | Object detection | 45% | Three-tier fallback: fine-tuned wheelchair/wheel YOLOv8 → stock YOLOv8n person-proxy → hardcoded stub boxes. First available tier wins. |
| 6 | Ball & rim tracking | 55% | Hough-circle + HSV masking finds the ball; Lucas-Kanade tracks one rim point frame-to-frame into a cumulative rotation angle. Runs only when a real wheel box exists. |
| 7 | Trajectory fusion | — | Centroid per frame → pixel-to-meter calibration from wheel diameter or chair width → Kalman filter (`filterpy`) smooths position into velocity and speed. |
| 8 | Motion & kinematics | 65% | Speed, acceleration, rim speed, turning radius, angular velocity, braking rate — outliers trimmed 5% each tail. |
| 9 | Body pose & form | 73% | Push symmetry, trunk rotation, shoulder-height difference, wrist angle range, composite posture score. |
| 10 | Timing, fatigue & risk | 82% | Cadence via FFT on the rim-angle signal, push/coast segmentation, stroke consistency via DTW, fatigue rate, repetitive-strain index and injury flags. |
| 11 | Scoring | 90% | Every feature normalized against per-sport reference constants into sub-scores, a weighted overall score, a letter grade, highlights and recommendations. |
| 12 | Feedback & persistence | 96% | Features become ~28 UI metric cards plus scout/coach text; video moves to `data/session_videos/`; full result written to SQLite. |
| 13 | Complete | 100% | SSE emits the final JSON. Any stage exception instead falls back to 10 hardcoded pillars with randomized scores, flagged `is_estimated: true` so the session still saves. |

---

## 4. Feature pillars

The four modules under `src/features/` that the scorer consumes.

**Motion & Kinematics**
- Avg / peak speed & acceleration
- Avg / peak rim speed
- Turning radius (circle-fit)
- Angular velocity, braking rate

**Body Pose & Form**
- Push symmetry (L/R arc diff)
- Trunk rotation, shoulder diff
- Wrist angle range
- Composite posture score

**Timing & Responsiveness**
- Cadence (FFT, 0.3–3.0 Hz band)
- Push/coast cycle segmentation
- Contact arc, push-to-coast ratio
- Stroke consistency (DTW)

**Fatigue & Risk**
- Fatigue rate (first vs. last window)
- Speed variance
- Repetitive-strain index & level
- Asymmetry / overrotation flags

---

## 5. App integration

`app/services/analysis.service.ts` posts the video as `FormData` and parses the raw SSE text stream by hand to drive the processing screen.

```
App (analysis.service.ts)
  → builds FormData (video, sport, ipc_class, athlete_id)
  → opens SSE connection
      ↓
api.py — POST /analyse
  → runs the 13-stage pipeline
  → streams stage/percent events
  → emits final `complete` event with full JSON result
      ↓
App
  → buildSession() maps metric_cards / feedback / ai_log
    into the app's Session type for the results screen
```

**Two resilience notes worth knowing:**
- The live-looking metrics shown *during* processing are client-side randomized placeholders on a 450ms tick, not real intermediate values.
- If the SSE fetch fails, the app falls back to a fully mocked client-side simulation of the same 13 stages rather than surfacing an error.

---

## 6. Config & storage

No JSON config layer exists despite the README's claims — thresholds live in `.env`, sport baselines are hardcoded Python.

### Environment variables

| Var | Default | Purpose |
|---|---|---|
| `WHEEL_RADIUS_CM` | 30 | Real-world wheel size used for pixel→meter calibration |
| `MODEL_WEIGHTS` | `data/weights/yolov8n_wheelchair.pt` | Custom-trained detector — not checked into the repo |
| `STOCK_WEIGHTS` | `models/yolov8n.pt` | Checked-in stock COCO weights, fallback tier |
| `YOLO_CONFIDENCE` | 0.4 | Detection confidence threshold |
| `SESSION_VIDEO_DIR` | `data/session_videos` | Where analysed source video is persisted |

### Storage

| Store | Contents |
|---|---|
| `parasync.db` | SQLite — athletes, users, coach/scout connections, messages, sessions (JSON blobs for metric_cards / feedback / ai_log + scalar summary columns) |
| `data/session_videos/` | Raw uploaded video, kept permanently, served via `GET /session/{id}/video` |
| In-memory only | Skeleton-overlay keyframe JPEGs — never persisted to disk or DB |

Sport-specific scoring baselines live in `SPORT_REFERENCES` in `src/scoring/scorer.py` for 6 sports: wheelchair_basketball, wheelchair_tennis, wheelchair_badminton, para_athletics, wheelchair_table_tennis, para_cricket.

---

## Bottom line

The pipeline is real and runs end-to-end with genuine CV, pose and scoring logic. Its ceiling right now is the missing fine-tuned wheelchair detector — without it, rim tracking never runs and detection leans on a person-shaped proxy.
