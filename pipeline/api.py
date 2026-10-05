"""
FastAPI server — POST /analyse + SSE progress streaming.
"""
import asyncio
import random
import sys
import uuid
import time
import json as _json
from typing import Optional, List

# Windows consoles default to cp1252, which can't encode the emoji used in
# a few log lines below — reconfigure stdout so those don't crash mid-stream.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from contextlib import asynccontextmanager

from fastapi import FastAPI, File, Form, UploadFile, HTTPException, Depends
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session as DBSession

from database import (
    init_db, get_db, SessionLocal,
    upsert_athlete, save_session,
    get_sessions_for_athlete, get_session_by_id, get_all_athletes,
    create_user, get_user_by_email, verify_password,
    connect_athlete_coach, get_coaches_for_athlete,
    connect_athlete_scout, get_scouts_for_athlete,
    respond_to_coach_connection, respond_to_scout_connection,
    get_pending_coach_requests, get_pending_scout_requests,
    get_athletes_for_coach, get_athletes_for_scout,
    send_message, get_thread_messages, is_connection_accepted,
    record_athlete_view,
    create_training_assignment, get_training_for_coach,
    get_training_for_athlete, update_training_status, delete_training_assignment,
    add_to_watchlist, remove_from_watchlist, get_watchlist_athlete_ids,
    create_scout_note, get_scout_notes, delete_scout_note, set_ipc_verified,
    notify_new_session, get_notifications_for_user, get_unread_notification_count,
    mark_notification_read, mark_all_notifications_read,
    create_session_request, get_session_requests_for_athlete,
    get_session_requests_for_coach, update_session_request_status, fulfill_session_request,
)

try:
    from sse_starlette.sse import EventSourceResponse
    _SSE_AVAILABLE = True
except ImportError:
    _SSE_AVAILABLE = False

import tempfile
import os

from dotenv import load_dotenv
load_dotenv()

try:
    from pipeline.preprocessor import detect_camera_angle
    from utils.video_utils import resize_frame
    from src.pose.blazepose import extract_pose_frames
    from src.detection.stub_detector import detect_frames_stub
    from src.detection.yolo_detector import detect_frames as yolo_detect_frames
    from src.detection.stock_person_detector import detect_frames as stock_person_detect_frames
    from src.ball_tracking.hough_tracker import track_rim_angle
    from src.tracking.centroid_tracker import compute_centroids
    from src.tracking.kalman_smoother import smooth_trajectory
    from src.features.motion_kinematics import extract_motion_kinematics
    from src.features.body_pose_form import extract_body_pose_form
    from src.features.timing_responsiveness import extract_timing_responsiveness
    from src.features.fatigue_risk import extract_fatigue_risk
    from src.scoring.scorer import compute_score
    from src.pipeline.schemas import AthleteMetadata, ExtractedFeatures, RimAngle
    from src.pipeline.adapter import build_metric_cards, build_feedback
    from src.llm.gemini_client import generate_feedback as generate_llm_feedback
    from src.llm.gemini_client import parse_athlete_query, heuristic_parse_query
    _PIPELINE_AVAILABLE = True
except Exception as _pipeline_import_err:  # noqa: BLE001
    print(f"[WARN] ML pipeline imports unavailable ({_pipeline_import_err}). "
          "Auth/DB routes will still work; /analyse will return 503.")
    _PIPELINE_AVAILABLE = False
    # Stub out names so the module-level code below doesn't crash
    def detect_camera_angle(*a, **kw): return "front"
    def resize_frame(*a, **kw): return None
    def extract_pose_frames(*a, **kw): return []
    def detect_frames_stub(*a, **kw): return []
    def yolo_detect_frames(*a, **kw): return []
    def stock_person_detect_frames(*a, **kw): return []
    def track_rim_angle(*a, **kw): return None
    def compute_centroids(*a, **kw): return []
    def smooth_trajectory(*a, **kw): return []
    def extract_motion_kinematics(*a, **kw): return {}
    def extract_body_pose_form(*a, **kw): return {}
    def extract_timing_responsiveness(*a, **kw): return {}
    def extract_fatigue_risk(*a, **kw): return {}
    def compute_score(*a, **kw): return 0
    def build_metric_cards(*a, **kw): return []
    def build_feedback(*a, **kw): return {}
    def generate_llm_feedback(*a, **kw): return ""
    def parse_athlete_query(*a, **kw): return {}
    def heuristic_parse_query(*a, **kw): return {}
    class AthleteMetadata: pass
    class ExtractedFeatures: pass
    class RimAngle: pass


WHEEL_RADIUS_CM  = float(os.environ.get("WHEEL_RADIUS_CM", 30))
MODEL_WEIGHTS    = os.environ.get("MODEL_WEIGHTS", "data/weights/yolov8n_wheelchair.pt")
YOLO_CONFIDENCE  = float(os.environ.get("YOLO_CONFIDENCE", 0.4))
# Where analysed videos are kept so connected scouts/coaches can watch them
# back later — previously every uploaded video was deleted right after
# processing, so nothing was ever available to replay.
SESSION_VIDEO_DIR = os.environ.get("SESSION_VIDEO_DIR", "data/session_videos")
# Stock COCO-pretrained weights, used as an interim "person" detection proxy
# for wheelchair position when no custom-trained MODEL_WEIGHTS exists yet —
# see src/detection/stock_person_detector.py for what this does and doesn't fix.
STOCK_WEIGHTS    = os.environ.get("STOCK_WEIGHTS", "models/yolov8n.pt")

# Skeleton-preview keyframes (base64 JPEGs), keyed by session_id, held only
# long enough for the processing screen to fetch them once. Kept out of the
# SSE stream itself (see _run_pipeline_sse) — a few hundred KB of base64
# inlined into one SSE `data:` line was unreliable over React Native's fetch
# streaming on native devices, so the stream only carries a small "ready"
# notice and the frontend pulls the images via GET /session/{id}/keyframes.
_keyframe_cache: dict = {}


def _select_detector(video_path: str, progress_cb=None):
    """Pick the best available detector: custom-trained > stock person > static stub."""
    if os.path.exists(MODEL_WEIGHTS):
        return yolo_detect_frames(video_path, MODEL_WEIGHTS, confidence=YOLO_CONFIDENCE)
    if os.path.exists(STOCK_WEIGHTS):
        return stock_person_detect_frames(video_path, STOCK_WEIGHTS, confidence=YOLO_CONFIDENCE)
    return detect_frames_stub(video_path)


def _avg_wheel_pixel_diameter(detection_frames) -> float:
    widths = [b.x2 - b.x1 for f in detection_frames for b in f.boxes if b.class_name == "wheel"]
    return float(sum(widths) / len(widths)) if widths else 0.0


# Typical overall width (athlete + wheelchair frame, side-on) in cm — used only
# as a fallback scale reference when no "wheel" box exists (e.g. the stock
# person-detector proxy, which has no wheel class). This ties the pixel->meter
# scale to what's actually in THIS video instead of a flat guessed constant.
_ATHLETE_CHAIR_WIDTH_CM = 70.0


_FRAMING_TIPS = [
    "Position the camera 3-5 meters to the side of the athlete, not head-on.",
    "Keep the full body and wheelchair in frame for the entire session.",
    "Mount the camera on a tripod or stable surface rather than handholding it.",
    "Film in good, even lighting — avoid strong backlight from windows or the sun.",
]


def _framing_feedback(pose_confidence_avg: Optional[float]) -> Optional[dict]:
    """
    Turn the pipeline's existing pose_confidence_avg (average fraction of the
    33 BlazePose keypoints detected per frame, across the whole video
    including frames where the athlete wasn't visible at all) into an
    actionable "was this footage usable" message — no new CV computation,
    just thresholding a number we already compute for every session.
    """
    if pose_confidence_avg is None:
        return None
    if pose_confidence_avg < 0.15:
        return {
            "quality": "poor",
            "message": "The athlete was barely visible in this footage, so most metrics couldn't be computed reliably.",
            "tips": _FRAMING_TIPS,
        }
    if pose_confidence_avg < 0.4:
        return {
            "quality": "partial",
            "message": "The athlete was only clearly visible part of the time — some metrics may be less accurate.",
            "tips": _FRAMING_TIPS[:2],
        }
    return {"quality": "good", "message": None, "tips": []}


def _build_feedback_with_llm(score_result, metric_cards: list, athlete) -> dict:
    """Rule-based feedback (src/pipeline/adapter.py) is always computed first
    as the guaranteed fallback and source of ai_log; a successful Gemini call
    then overrides the narrative scout_feedback/coach_feedback/athlete_feedback
    text. generate_llm_feedback() never raises, so this can't turn a working
    analysis into a failed one even if Gemini/network is down."""
    feedback_data = build_feedback(score_result)
    llm_feedback = generate_llm_feedback(score_result, metric_cards, athlete)
    if llm_feedback:
        feedback_data["scout_feedback"] = llm_feedback["scout_feedback"]
        feedback_data["coach_feedback"] = llm_feedback["coach_feedback"]
        feedback_data["athlete_feedback"] = llm_feedback["athlete_feedback"]
    return feedback_data


def _avg_chair_pixel_width(detection_frames) -> float:
    widths = [b.x2 - b.x1 for f in detection_frames for b in f.boxes if b.class_name == "wheelchair"]
    return float(sum(widths) / len(widths)) if widths else 0.0


def _estimate_pixels_per_meter(detection_frames) -> float:
    """Best available pixel->meter scale: real wheel diameter > detected chair
    width (approximate) > a nominal 100 px/m guess as a last resort."""
    avg_wheel_px = _avg_wheel_pixel_diameter(detection_frames)
    if avg_wheel_px:
        return avg_wheel_px / (2 * WHEEL_RADIUS_CM / 100)
    avg_chair_px = _avg_chair_pixel_width(detection_frames)
    if avg_chair_px:
        return avg_chair_px / (_ATHLETE_CHAIR_WIDTH_CM / 100)
    return 100.0


def _run_analysis(video_path: str, sport: str, ipc_class: str, athlete_name: str,
                   progress_cb=None, orig_filename: str = "") -> tuple:
    """
    Runs the full new pipeline (pose -> detection -> ball/rim tracking ->
    trajectory -> features -> scoring) and returns
    (metric_cards, feedback_dict, video_metadata, extracted_features, score_result).
    progress_cb(stage_key) is called after each stage completes (optional).
    """
    import cv2

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 1280
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 720
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    cap.release()

    camera_angle = _detect_camera_angle_safe(video_path)

    pose_frames = extract_pose_frames(video_path)
    if progress_cb: progress_cb("pose_detection")

    detection_frames = _select_detector(video_path)
    if progress_cb: progress_cb("object_detection")

    if os.path.exists(MODEL_WEIGHTS):
        cap = cv2.VideoCapture(video_path)
        raw_frames, timestamps = [], []
        idx = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            raw_frames.append(frame)
            timestamps.append(idx / fps)
            idx += 1
        cap.release()

        track_rim_angle_result = track_rim_angle(detection_frames, raw_frames, timestamps)
        del raw_frames
    else:
        # Stock/stub detector never produces a "wheel" box, so rim angle
        # would be None for every frame anyway — skip the 4th full decode.
        timestamps = [f.timestamp_sec for f in detection_frames]
        track_rim_angle_result = [
            RimAngle(frame_idx=f.frame_idx, timestamp_sec=f.timestamp_sec, angle_deg=None)
            for f in detection_frames
        ]
    if progress_cb: progress_cb("optical_flow")

    centroids = compute_centroids(detection_frames)
    pixels_per_meter = _estimate_pixels_per_meter(detection_frames)
    trajectory = smooth_trajectory(centroids, fps, pixels_per_meter)

    motion_features = extract_motion_kinematics(trajectory, track_rim_angle_result, WHEEL_RADIUS_CM, pixels_per_meter)
    if progress_cb: progress_cb("feature_p01_p04")

    pose_features = extract_body_pose_form(pose_frames, frame_width, frame_height)
    timing_features = extract_timing_responsiveness(track_rim_angle_result)
    if progress_cb: progress_cb("feature_p05_p08")

    fatigue_features = extract_fatigue_risk(
        trajectory, pose_frames, pose_features.push_symmetry_pct, pose_features.trunk_rotation_deg,
        cadence_hz=timing_features.cadence_hz, wrist_angle_range_deg=pose_features.wrist_angle_range_deg,
    )
    if progress_cb: progress_cb("feature_p09_p14")

    session_duration = timestamps[-1] if timestamps else 0.0
    features = ExtractedFeatures(
        motion=motion_features, pose=pose_features, timing=timing_features, fatigue=fatigue_features,
        session_duration_sec=session_duration, total_frames_processed=len(pose_frames),
        wheel_radius_cm=WHEEL_RADIUS_CM,
    )

    athlete = AthleteMetadata(name=athlete_name or "Athlete", sport=sport, disability_class=ipc_class)
    score_result = compute_score(features, athlete)
    if progress_cb: progress_cb("scoring")

    metric_cards = build_metric_cards(features, sport)
    feedback_data = _build_feedback_with_llm(score_result, metric_cards, athlete)
    if progress_cb: progress_cb("feedback")

    pose_confidence_avg = None
    if pose_frames:
        counts = [sum(1 for v in f.keypoints.values() if v is not None) for f in pose_frames]
        pose_confidence_avg = round((sum(counts) / len(counts)) / 33, 3)

    video_metadata = {
        "filename":            orig_filename or None,
        "duration_sec":        session_duration,
        "fps":                 fps,
        "resolution":          f"{frame_width}x{frame_height}",
        "camera_angle":        camera_angle,
        "pixel_per_meter":     pixels_per_meter,
        "frames_analysed":     total_frames,
        "pose_confidence_avg": pose_confidence_avg,
        "framing_feedback":    _framing_feedback(pose_confidence_avg),
    }

    return metric_cards, feedback_data, video_metadata, features, score_result


def _detect_camera_angle_safe(video_path: str) -> Optional[str]:
    """
    Best-effort camera-angle heuristic. The angle only needs ~16 frames around
    the middle of the clip (optical flow direction), so this seeks straight to
    that window instead of decoding+resizing the whole video via Preprocessor —
    on a multi-minute clip that full decode was the single slowest stage for
    no benefit (its output was thrown away except for these few frames).
    """
    import cv2
    try:
        cap = cv2.VideoCapture(video_path)
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
        window = 16
        start = max(0, total // 2 - window // 2)
        cap.set(cv2.CAP_PROP_POS_FRAMES, start)

        frames = []
        for _ in range(window):
            ret, frame = cap.read()
            if not ret:
                break
            frames.append(resize_frame(frame, 720))
        cap.release()

        if len(frames) < 10:
            return None
        return detect_camera_angle(frames)
    except Exception as exc:
        print(f"[Pipeline] camera-angle detection skipped: {exc}")
        return None


KEYFRAME_COUNT = 10


def _build_keyframes(video_path: str, pose_frames: list) -> list:
    """
    Sample a handful of frames spread across the clip and draw the already-
    computed pose skeleton on each, so the app can show "how the AI is
    tracking your movement" during processing. Reuses pose_frames from the
    real pose-estimation pass — no extra model inference here, just seeking
    to ~10 frame indices and a cheap JPEG encode, so this stays fast even on
    longer videos.
    """
    import cv2
    import base64
    from src.pose.skeleton_draw import draw_skeleton

    if not pose_frames:
        return []
    try:
        n = len(pose_frames)
        count = min(KEYFRAME_COUNT, n)
        indices = sorted({round(i * (n - 1) / max(count - 1, 1)) for i in range(count)})

        cap = cv2.VideoCapture(video_path)
        out = []
        for idx in indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ret, frame = cap.read()
            if not ret:
                continue
            frame = resize_frame(frame, 480)
            annotated = draw_skeleton(frame, pose_frames[idx])
            ok, buf = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 70])
            if not ok:
                continue
            b64 = base64.b64encode(buf.tobytes()).decode("ascii")
            out.append({
                "timestamp": pose_frames[idx].timestamp_sec,
                "image": f"data:image/jpeg;base64,{b64}",
            })
        cap.release()
        return out
    except Exception as exc:
        print(f"[Pipeline] keyframe generation skipped: {exc}")
        return []


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create SQLite tables if they don't exist yet."""
    init_db()
    os.makedirs(SESSION_VIDEO_DIR, exist_ok=True)
    print("[ParaSync] Database initialised — parasync.db ready.")
    yield


app = FastAPI(title="ParaSync Pipeline API", version="4.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "version": "4.0.0",
        "model_loaded": os.path.exists(MODEL_WEIGHTS),
        "detector": "custom" if os.path.exists(MODEL_WEIGHTS)
                    else "stock_person" if os.path.exists(STOCK_WEIGHTS)
                    else "stub",
    }


# ─── Auth endpoints ────────────────────────────────────────────────────────────
# Prototype-grade: no email format / password-strength validation is enforced,
# but every account is a real row in the users table (salted+hashed password).

class SignupBody(BaseModel):
    name: str
    email: str
    password: str
    role: str   # athlete | coach | scout | federation
    phone: Optional[str] = None
    sport: Optional[str] = None
    ipc_class: Optional[str] = None
    extra: Optional[dict] = None


class LoginBody(BaseModel):
    email: str
    password: str


@app.post("/signup")
def signup(body: SignupBody, db: DBSession = Depends(get_db)):
    if not body.name or not body.email or not body.password or not body.role:
        raise HTTPException(status_code=400, detail="name, email, password and role are required")
    if get_user_by_email(db, body.email):
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    user = create_user(
        db, name=body.name, email=body.email, password=body.password, role=body.role,
        phone=body.phone, sport=body.sport, ipc_class=body.ipc_class, extra=body.extra,
    )

    # Athletes also get an Athlete row (same id) so the analysis pipeline,
    # which keys everything off athlete_id, immediately recognises them.
    if body.role == "athlete":
        extra = body.extra or {}
        upsert_athlete(db, user.id, body.sport or "wheelchair_basketball",
                       body.ipc_class or "TBD", name=body.name,
                       state=extra.get("state"), city=extra.get("city"))
        db.commit()

    return user.to_dict()


@app.post("/login")
def login(body: LoginBody, db: DBSession = Depends(get_db)):
    if not body.email or not body.password:
        raise HTTPException(status_code=400, detail="email and password are required")
    user = get_user_by_email(db, body.email)
    if not user or not verify_password(body.password, user.password_hash, user.password_salt):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return user.to_dict()


# ─── Athlete endpoints ────────────────────────────────────────────────────────

def _latest_session_score(db: DBSession, athlete_id: str) -> Optional[float]:
    """Mean of the latest session's per-metric scores — same definition as the
    web frontend's avgScore() helper (lib/api.ts), computed server-side here
    so the Discovery list/filter doesn't need one round-trip per athlete."""
    sessions = get_sessions_for_athlete(db, athlete_id, limit=1)
    if not sessions:
        return None
    scores = [c.get("score") for c in sessions[0].metric_cards if c.get("score") is not None]
    return round(sum(scores) / len(scores), 1) if scores else None


def _filtered_athletes(
    db: DBSession, sport: Optional[str] = None, ipc_class: Optional[str] = None,
    state: Optional[str] = None, min_score: Optional[float] = None,
    discoverable_only: bool = False, name_search: Optional[str] = None,
) -> List[dict]:
    """Shared by GET /athletes (Discovery page filters) and POST /scouts/{id}/chat
    (the chatbot translates a natural-language query into these same params)."""
    athletes = get_all_athletes(db, sport=sport, ipc_class=ipc_class, state=state)
    out = []
    for a in athletes:
        if discoverable_only and not a.discoverable:
            continue
        if name_search and name_search.lower() not in a.name.lower():
            continue
        d = a.to_dict()
        d["latest_score"] = _latest_session_score(db, a.id)
        if min_score is not None and (d["latest_score"] is None or d["latest_score"] < min_score):
            continue
        out.append(d)
    return out


@app.get("/athletes")
def list_athletes(
    sport: Optional[str] = None,
    ipc_class: Optional[str] = None,
    state: Optional[str] = None,
    min_score: Optional[float] = None,
    discoverable_only: bool = False,
    db: DBSession = Depends(get_db),
):
    """
    Return registered athletes (lightweight — no metric cards), optionally
    filtered by sport / ipc_class / state / latest-session min_score — powers
    the scout Discovery page. `discoverable_only` is opt-in (the federation
    oversight view and the existing mobile browse screen both intentionally
    see every athlete regardless of their discoverable flag; only the new
    scout Discovery page passes discoverable_only=true).
    """
    out = _filtered_athletes(db, sport=sport, ipc_class=ipc_class, state=state,
                              min_score=min_score, discoverable_only=discoverable_only)
    return {"athletes": out}


class ChatQueryBody(BaseModel):
    query: str


@app.post("/scouts/{scout_id}/chat")
def scout_chat_discover(scout_id: str, body: ChatQueryBody, db: DBSession = Depends(get_db)):
    """
    Natural-language athlete search for the scout chatbot. Translates the
    query into the same sport/ipc_class/state/min_score/name_search params
    Discovery filters on (via Gemini), rather than doing full conversational
    RAG — the "chatbot" is a language front-end onto the existing filtered
    /athletes search, not a separate system.
    """
    query = body.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="query is required")

    known_states = sorted({a.state for a in get_all_athletes(db) if a.state})
    filters = parse_athlete_query(query, known_states)
    used_gemini = filters is not None
    if filters is None:
        # No Gemini key configured, or the call failed — fall back to a
        # regex/keyword parser (sport names, IPC class codes, known states,
        # "scoring above N") rather than a bare name search, which would
        # return nothing useful for a query like "basketball players".
        filters = heuristic_parse_query(query, known_states)

    athletes = _filtered_athletes(
        db, sport=filters.get("sport"), ipc_class=filters.get("ipc_class"),
        state=filters.get("state"), min_score=filters.get("min_score"),
        discoverable_only=True, name_search=filters.get("name_search"),
    )

    if not filters:
        reply = f"I couldn't find specific filters in that query — showing all {len(athletes)} discoverable athletes."
    else:
        described = ", ".join(f"{k.replace('_', ' ')}: {v}" for k, v in filters.items())
        reply = f"Found {len(athletes)} athlete(s) matching {described}."
        if not used_gemini:
            reply += " (AI query understanding isn't configured — using keyword matching.)"

    return {"reply": reply, "filters": filters, "athletes": athletes}


@app.get("/athletes/{athlete_id}")
def get_athlete(athlete_id: str, db: DBSession = Depends(get_db)):
    from database import Athlete as AthleteModel
    athlete = db.query(AthleteModel).filter(AthleteModel.id == athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")
    return athlete.to_dict()


@app.post("/athletes/{athlete_id}/view")
def record_view(athlete_id: str, db: DBSession = Depends(get_db)):
    """
    Bump this athlete's profile view counter — called by the scout/coach
    athlete-detail screen each time it's opened. Powers the "Scout Views"
    stat on the athlete's home screen.
    """
    count = record_athlete_view(db, athlete_id)
    if count is None:
        raise HTTPException(status_code=404, detail="Athlete not found")
    return {"athlete_id": athlete_id, "view_count": count}


# ─── Scout endpoints ──────────────────────────────────────────────────────────

def _scout_dict(u, status: Optional[str] = None) -> dict:
    d = u.to_dict()
    out = {
        "id": d["id"],
        "name": d["name"],
        "org": d.get("org") or "",
        "role": d.get("scoutRole") or "Talent Scout",
        "sports": [d["sport"]] if d.get("sport") else [],
        "level": d.get("level") or "",
        "verified": True,
        "athletes": 0,
    }
    if status is not None:
        out["status"] = status
    return out


def _athlete_summary_dict(a, requested_at=None) -> dict:
    out = {
        "id": a.id, "name": a.name, "sport": a.sport, "ipc_class": a.ipc_class,
    }
    if requested_at is not None:
        out["requested_at"] = requested_at.isoformat()
    return out


class ConnectionResponseBody(BaseModel):
    status: str   # "accepted" | "declined"


class SendMessageBody(BaseModel):
    thread_type: str      # "scout" | "coach"
    athlete_id: str
    counterpart_id: str
    sender_id: str
    body: str


@app.get("/scouts")
def list_scouts(db: DBSession = Depends(get_db)):
    """Return all registered scout accounts, shaped for the athlete-facing Scout Network."""
    from database import User as UserModel
    scouts = (
        db.query(UserModel)
          .filter(UserModel.role == "scout")
          .order_by(UserModel.created_at.desc())
          .all()
    )
    return {"scouts": [_scout_dict(s) for s in scouts]}


@app.post("/athletes/{athlete_id}/scouts/{scout_id}")
def connect_scout(athlete_id: str, scout_id: str, db: DBSession = Depends(get_db)):
    """Athlete sends a connection request to a scout — starts out "pending" until the scout responds."""
    from database import User as UserModel, Athlete as AthleteModel
    athlete = db.query(AthleteModel).filter(AthleteModel.id == athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")
    scout = db.query(UserModel).filter(UserModel.id == scout_id, UserModel.role == "scout").first()
    if not scout:
        raise HTTPException(status_code=404, detail="Scout not found")
    link = connect_athlete_scout(db, athlete_id, scout_id)
    return {"status": link.status, "athlete_id": athlete_id, "scout_id": scout_id}


@app.patch("/athletes/{athlete_id}/scouts/{scout_id}")
def respond_scout_request(athlete_id: str, scout_id: str, body: ConnectionResponseBody, db: DBSession = Depends(get_db)):
    """Scout accepts/declines a pending request from an athlete."""
    if body.status not in ("accepted", "declined"):
        raise HTTPException(status_code=400, detail="status must be 'accepted' or 'declined'")
    link = respond_to_scout_connection(db, athlete_id, scout_id, body.status)
    if not link:
        raise HTTPException(status_code=404, detail="No connection request found")
    return {"status": link.status, "athlete_id": athlete_id, "scout_id": scout_id}


@app.get("/athletes/{athlete_id}/scouts")
def list_athlete_scouts(athlete_id: str, db: DBSession = Depends(get_db)):
    """Return every scout this athlete has a connection with (any status)."""
    rows = get_scouts_for_athlete(db, athlete_id)
    return {"scouts": [_scout_dict(r["user"], r["status"]) for r in rows]}


@app.get("/scouts/{scout_id}/requests")
def scout_pending_requests(scout_id: str, db: DBSession = Depends(get_db)):
    """Pending connection requests waiting on this scout to respond."""
    rows = get_pending_scout_requests(db, scout_id)
    return {"requests": [_athlete_summary_dict(r["athlete"], r["requested_at"]) for r in rows]}


@app.get("/scouts/{scout_id}/athletes")
def scout_connected_athletes(scout_id: str, db: DBSession = Depends(get_db)):
    """Athletes with an accepted connection to this scout — powers the scout's Messages list."""
    athletes = get_athletes_for_scout(db, scout_id)
    return {"athletes": [_athlete_summary_dict(a) for a in athletes]}


# ─── Coach endpoints ──────────────────────────────────────────────────────────

def _coach_dict(u, status: Optional[str] = None) -> dict:
    d = u.to_dict()
    out = {
        "id":            d["id"],
        "name":          d["name"],
        "federation":    d.get("federation") or "",
        "sport":         d.get("sport") or "",
        "experience":    d.get("experience") or "",
        "certification": d.get("certification") or "",
    }
    if status is not None:
        out["status"] = status
    return out


@app.get("/coaches")
def list_coaches(db: DBSession = Depends(get_db)):
    """Return all registered coach accounts, for the athlete-facing Coach Network."""
    from database import User as UserModel
    coaches = (
        db.query(UserModel)
          .filter(UserModel.role == "coach")
          .order_by(UserModel.created_at.desc())
          .all()
    )
    return {"coaches": [_coach_dict(c) for c in coaches]}


@app.post("/athletes/{athlete_id}/coaches/{coach_id}")
def connect_coach(athlete_id: str, coach_id: str, db: DBSession = Depends(get_db)):
    """Athlete sends a connection request to a coach — starts out "pending" until the coach responds."""
    from database import User as UserModel, Athlete as AthleteModel
    athlete = db.query(AthleteModel).filter(AthleteModel.id == athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")
    coach = db.query(UserModel).filter(UserModel.id == coach_id, UserModel.role == "coach").first()
    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found")
    link = connect_athlete_coach(db, athlete_id, coach_id)
    return {"status": link.status, "athlete_id": athlete_id, "coach_id": coach_id}


@app.patch("/athletes/{athlete_id}/coaches/{coach_id}")
def respond_coach_request(athlete_id: str, coach_id: str, body: ConnectionResponseBody, db: DBSession = Depends(get_db)):
    """Coach accepts/declines a pending request from an athlete."""
    if body.status not in ("accepted", "declined"):
        raise HTTPException(status_code=400, detail="status must be 'accepted' or 'declined'")
    link = respond_to_coach_connection(db, athlete_id, coach_id, body.status)
    if not link:
        raise HTTPException(status_code=404, detail="No connection request found")
    return {"status": link.status, "athlete_id": athlete_id, "coach_id": coach_id}


@app.get("/athletes/{athlete_id}/coaches")
def list_athlete_coaches(athlete_id: str, db: DBSession = Depends(get_db)):
    """Return every coach this athlete has a connection with (any status)."""
    rows = get_coaches_for_athlete(db, athlete_id)
    return {"coaches": [_coach_dict(r["user"], r["status"]) for r in rows]}


@app.get("/coaches/{coach_id}/requests")
def coach_pending_requests(coach_id: str, db: DBSession = Depends(get_db)):
    """Pending connection requests waiting on this coach to respond."""
    rows = get_pending_coach_requests(db, coach_id)
    return {"requests": [_athlete_summary_dict(r["athlete"], r["requested_at"]) for r in rows]}


@app.get("/coaches/{coach_id}/athletes")
def coach_connected_athletes(coach_id: str, db: DBSession = Depends(get_db)):
    """Athletes with an accepted connection to this coach — powers the coach's Messages list."""
    athletes = get_athletes_for_coach(db, coach_id)
    return {"athletes": [_athlete_summary_dict(a) for a in athletes]}


# ─── Training assignment endpoints ─────────────────────────────────────────────

class CreateTrainingBody(BaseModel):
    title: str
    description: Optional[str] = None
    target_pillar: Optional[str] = None
    due_date: Optional[str] = None


class UpdateTrainingStatusBody(BaseModel):
    status: str


@app.post("/coaches/{coach_id}/athletes/{athlete_id}/training")
def create_training(coach_id: str, athlete_id: str, body: CreateTrainingBody, db: DBSession = Depends(get_db)):
    """A coach assigns a training task to one of their connected athletes."""
    if not body.title.strip():
        raise HTTPException(status_code=400, detail="title is required")
    if not is_connection_accepted(db, "coach", athlete_id, coach_id):
        raise HTTPException(status_code=403, detail="You must be connected with this athlete first")
    assignment = create_training_assignment(
        db, coach_id, athlete_id, body.title.strip(),
        description=body.description, target_pillar=body.target_pillar, due_date=body.due_date,
    )
    return assignment.to_dict()


@app.get("/coaches/{coach_id}/training")
def list_coach_training(coach_id: str, db: DBSession = Depends(get_db)):
    """Every training assignment this coach has created, across all their athletes."""
    assignments = get_training_for_coach(db, coach_id)
    return {"assignments": [a.to_dict() for a in assignments]}


@app.get("/athletes/{athlete_id}/training")
def list_athlete_training(athlete_id: str, db: DBSession = Depends(get_db)):
    """Every training assignment for one athlete — used by both the coach's
    per-athlete view (web) and the athlete's task list (mobile app)."""
    assignments = get_training_for_athlete(db, athlete_id)
    return {"assignments": [a.to_dict() for a in assignments]}


@app.patch("/training/{assignment_id}")
def patch_training_status(assignment_id: str, body: UpdateTrainingStatusBody, db: DBSession = Depends(get_db)):
    """Update a training assignment's status — the athlete marks in_progress/completed
    in the mobile app; a coach can also use this to reopen or close one out."""
    assignment = update_training_status(db, assignment_id, body.status)
    if not assignment:
        raise HTTPException(status_code=400, detail="Assignment not found or invalid status")
    return assignment.to_dict()


@app.delete("/training/{assignment_id}")
def remove_training(assignment_id: str, db: DBSession = Depends(get_db)):
    """A coach cancels/removes a training assignment they created."""
    if not delete_training_assignment(db, assignment_id):
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {"deleted": True}


# ─── Session request endpoints ─────────────────────────────────────────────────
# A coach asking a connected athlete to film and upload a new session. Marked
# fulfilled automatically from /analyse (see fulfill_session_request's call
# site below) when the athlete's upload references the request's id.

class CreateSessionRequestBody(BaseModel):
    message: Optional[str] = None


class UpdateSessionRequestBody(BaseModel):
    status: str


@app.post("/coaches/{coach_id}/athletes/{athlete_id}/session-requests")
def create_session_request_endpoint(coach_id: str, athlete_id: str, body: CreateSessionRequestBody, db: DBSession = Depends(get_db)):
    if not is_connection_accepted(db, "coach", athlete_id, coach_id):
        raise HTTPException(status_code=403, detail="You must be connected with this athlete first")
    req = create_session_request(db, coach_id, athlete_id, message=body.message)
    return req.to_dict()


@app.get("/athletes/{athlete_id}/session-requests")
def list_athlete_session_requests(athlete_id: str, status: Optional[str] = None, db: DBSession = Depends(get_db)):
    requests = get_session_requests_for_athlete(db, athlete_id, status=status)
    return {"requests": [r.to_dict() for r in requests]}


@app.get("/coaches/{coach_id}/session-requests")
def list_coach_session_requests(coach_id: str, db: DBSession = Depends(get_db)):
    requests = get_session_requests_for_coach(db, coach_id)
    return {"requests": [r.to_dict() for r in requests]}


@app.patch("/session-requests/{request_id}")
def update_session_request(request_id: str, body: UpdateSessionRequestBody, db: DBSession = Depends(get_db)):
    """The athlete declines a request (fulfillment happens automatically via
    /analyse, not through this endpoint)."""
    req = update_session_request_status(db, request_id, body.status)
    if not req:
        raise HTTPException(status_code=400, detail="Request not found or invalid status")
    return req.to_dict()


# ─── Watchlist endpoints ────────────────────────────────────────────────────────
# Lighter-weight than a connection request — no athlete-side approval needed,
# so a scout can shortlist any discoverable athlete just to keep an eye on them.

@app.post("/scouts/{scout_id}/watchlist/{athlete_id}")
def watchlist_add(scout_id: str, athlete_id: str, db: DBSession = Depends(get_db)):
    add_to_watchlist(db, scout_id, athlete_id)
    return {"watchlisted": True}


@app.delete("/scouts/{scout_id}/watchlist/{athlete_id}")
def watchlist_remove(scout_id: str, athlete_id: str, db: DBSession = Depends(get_db)):
    remove_from_watchlist(db, scout_id, athlete_id)
    return {"watchlisted": False}


@app.get("/scouts/{scout_id}/watchlist")
def watchlist_list(scout_id: str, db: DBSession = Depends(get_db)):
    ids = set(get_watchlist_athlete_ids(db, scout_id))
    athletes = [a for a in get_all_athletes(db) if a.id in ids]
    out = [a.to_dict() for a in athletes]
    for d in out:
        d["latest_score"] = _latest_session_score(db, d["id"])
    return {"athletes": out}


# ─── Scout notes endpoints ──────────────────────────────────────────────────────
# Private per-scout evaluation notes on an athlete — never visible to the
# athlete or other scouts.

class ScoutNoteBody(BaseModel):
    text: str


@app.post("/scouts/{scout_id}/athletes/{athlete_id}/notes")
def add_scout_note(scout_id: str, athlete_id: str, body: ScoutNoteBody, db: DBSession = Depends(get_db)):
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="text is required")
    note = create_scout_note(db, scout_id, athlete_id, body.text.strip())
    return note.to_dict()


@app.get("/scouts/{scout_id}/athletes/{athlete_id}/notes")
def list_scout_notes(scout_id: str, athlete_id: str, db: DBSession = Depends(get_db)):
    notes = get_scout_notes(db, scout_id, athlete_id)
    return {"notes": [n.to_dict() for n in notes]}


@app.delete("/scouts/{scout_id}/notes/{note_id}")
def remove_scout_note(scout_id: str, note_id: str, db: DBSession = Depends(get_db)):
    if not delete_scout_note(db, note_id, scout_id):
        raise HTTPException(status_code=404, detail="Note not found")
    return {"deleted": True}


# ─── Federation verification endpoint ──────────────────────────────────────────

class VerifyBody(BaseModel):
    verified: bool


@app.patch("/athletes/{athlete_id}/verify")
def verify_athlete(athlete_id: str, body: VerifyBody, db: DBSession = Depends(get_db)):
    """A federation account marks an athlete's IPC classification as
    verified/unverified — distinct from the athlete's self-reported class."""
    athlete = set_ipc_verified(db, athlete_id, body.verified)
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")
    return athlete.to_dict()


# ─── Notifications ──────────────────────────────────────────────────────────────
# In-app only (no email/push) — fired once, when a connected athlete uploads
# a new session (see notify_new_session in database.py, called from
# _save_to_db_direct right after save_session).

@app.get("/users/{user_id}/notifications")
def list_notifications(user_id: str, db: DBSession = Depends(get_db)):
    notifications = get_notifications_for_user(db, user_id)
    unread = get_unread_notification_count(db, user_id)
    return {"notifications": [n.to_dict() for n in notifications], "unread_count": unread}


@app.patch("/notifications/{notification_id}")
def read_notification(notification_id: str, user_id: str, db: DBSession = Depends(get_db)):
    n = mark_notification_read(db, notification_id, user_id)
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    return n.to_dict()


@app.post("/users/{user_id}/notifications/read-all")
def read_all_notifications(user_id: str, db: DBSession = Depends(get_db)):
    count = mark_all_notifications_read(db, user_id)
    return {"marked_read": count}


# ─── Percentile benchmarking ────────────────────────────────────────────────────

@app.get("/athletes/{athlete_id}/percentiles")
def athlete_percentiles(athlete_id: str, db: DBSession = Depends(get_db)):
    """
    For each metric in this athlete's latest session, what percentile do they
    rank at among every OTHER athlete of the same sport + ipc_class (using
    each peer's own latest session)? More useful to a scout comparing
    prospects than the single hand-set "elite reference" constant the 0-100
    score is normalized against (see src/scoring/scorer.py SPORT_REFERENCES).
    """
    from database import Athlete as AthleteModel
    athlete = db.query(AthleteModel).filter(AthleteModel.id == athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    my_sessions = get_sessions_for_athlete(db, athlete_id, limit=1)
    if not my_sessions:
        return {"percentiles": []}
    my_cards = {c["id"]: c for c in my_sessions[0].metric_cards if c.get("value") is not None and isinstance(c.get("value"), (int, float))}

    peers = [
        a for a in get_all_athletes(db, sport=athlete.sport, ipc_class=athlete.ipc_class)
        if a.id != athlete_id
    ]
    peer_values: dict = {mid: [] for mid in my_cards}
    for peer in peers:
        peer_sessions = get_sessions_for_athlete(db, peer.id, limit=1)
        if not peer_sessions:
            continue
        for c in peer_sessions[0].metric_cards:
            if c["id"] in peer_values and isinstance(c.get("value"), (int, float)):
                peer_values[c["id"]].append(c["value"])

    out = []
    for mid, card in my_cards.items():
        values = peer_values.get(mid, [])
        if len(values) < 3:   # too few peers for a meaningful percentile
            continue
        higher_is_better = card.get("higher_is_better")
        if higher_is_better is None:
            continue
        my_val = card["value"]
        better_count = sum(1 for v in values if (v < my_val if higher_is_better else v > my_val))
        percentile = round(better_count / len(values) * 100)
        out.append({
            "id": mid, "pillar": card.get("pillar"), "label": card.get("label"),
            "percentile": percentile, "peer_count": len(values) + 1,
        })
    out.sort(key=lambda x: x["percentile"], reverse=True)
    return {"percentiles": out}


# ─── Messaging endpoints ────────────────────────────────────────────────────────

@app.post("/messages")
def post_message(body: SendMessageBody, db: DBSession = Depends(get_db)):
    """Send a chat message. Only allowed once the underlying connection is accepted."""
    if body.thread_type not in ("scout", "coach"):
        raise HTTPException(status_code=400, detail="thread_type must be 'scout' or 'coach'")
    if not body.body.strip():
        raise HTTPException(status_code=400, detail="Message body cannot be empty")
    if not is_connection_accepted(db, body.thread_type, body.athlete_id, body.counterpart_id):
        raise HTTPException(status_code=403, detail="This connection hasn't been accepted yet")
    msg = send_message(db, body.thread_type, body.athlete_id, body.counterpart_id, body.sender_id, body.body.strip())
    return msg.to_dict()


@app.get("/messages")
def get_messages(thread_type: str, athlete_id: str, counterpart_id: str, db: DBSession = Depends(get_db)):
    """Fetch a chat thread's full history, oldest first. Polled by the chat screen."""
    if thread_type not in ("scout", "coach"):
        raise HTTPException(status_code=400, detail="thread_type must be 'scout' or 'coach'")
    messages = get_thread_messages(db, thread_type, athlete_id, counterpart_id)
    return {"messages": [m.to_dict() for m in messages]}


# ─── Session endpoints ────────────────────────────────────────────────────────

@app.get("/sessions/{athlete_id}")
def list_sessions(
    athlete_id: str,
    limit: int = 20,
    db: DBSession = Depends(get_db),
):
    """
    Return session history for an athlete (newest first).
    Metric cards are included for the dashboard to read.
    """
    sessions = get_sessions_for_athlete(db, athlete_id, limit=limit)
    return {
        "athlete_id": athlete_id,
        "count":      len(sessions),
        "sessions":   [s.to_dict(include_cards=True) for s in sessions],
    }


@app.get("/session/{session_id}")
def get_session_detail(session_id: str, db: DBSession = Depends(get_db)):
    """Return one session with full metric_cards JSON."""
    sess = get_session_by_id(db, session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    return sess.to_dict(include_cards=True)


@app.get("/session/{session_id}/video")
def get_session_video(session_id: str, db: DBSession = Depends(get_db)):
    """
    Stream back the video for one analysed session, so a connected scout/coach
    can watch it (not just see the metrics). Only sessions analysed after
    video persistence was added have a stored file — older ones 404 here,
    which the frontend treats as "video not available" rather than an error.
    No auth check here — this app has no request-level auth anywhere else
    either (every endpoint trusts client-supplied IDs); "who can watch this"
    is enforced only in the UI layer, same as the rest of the app.
    """
    sess = get_session_by_id(db, session_id)
    if not sess or not sess.video_stored_filename:
        raise HTTPException(status_code=404, detail="No video stored for this session")
    path = os.path.join(SESSION_VIDEO_DIR, sess.video_stored_filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Video file missing on disk")
    ext = os.path.splitext(path)[1].lower()
    media_type = {".mp4": "video/mp4", ".mov": "video/quicktime", ".avi": "video/x-msvideo"}.get(ext, "video/mp4")
    return FileResponse(path, media_type=media_type)


@app.get("/session/{session_id}/keyframes")
def get_session_keyframes(session_id: str):
    """
    One-shot fetch of the pose-tracked preview frames generated during this
    session's analysis (see _build_keyframes) — popped from the in-memory
    cache once read, since these only matter to the processing screen that's
    still open live. Returns an empty list once already consumed, or if the
    session never produced any (e.g. pose estimation found nobody in frame).
    """
    return {"frames": _keyframe_cache.pop(session_id, [])}


@app.get("/athletes/{athlete_id}/metrics/summary")
def get_metrics_summary(athlete_id: str, db: DBSession = Depends(get_db)):
    """
    Aggregate every metric across all of this athlete's sessions:
    average score and best score per metric, plus career-level headline numbers.
    `score` is already 0-100 normalized with higher-always-better (see src/pipeline/adapter.py),
    so aggregation is a plain mean/max over that field.
    """
    sessions = get_sessions_for_athlete(db, athlete_id, limit=1000)

    by_metric: dict = {}
    all_scores: list = []
    for sess in sessions:
        for card in sess.metric_cards:
            score = card.get("score")
            if score is None:
                continue
            all_scores.append(score)
            mid = card["id"]
            entry = by_metric.setdefault(mid, {
                "id": mid, "pillar": card.get("pillar", ""), "label": card.get("label", mid),
                "unit": card.get("unit"), "scores": [], "best_value": None, "best_score": -1,
            })
            entry["scores"].append(score)
            if score > entry["best_score"]:
                entry["best_score"] = score
                entry["best_value"] = card.get("value")

    metrics = []
    for entry in by_metric.values():
        scores = entry.pop("scores")
        entry["avg_score"] = round(sum(scores) / len(scores), 1)
        metrics.append(entry)
    metrics.sort(key=lambda m: (m["pillar"], m["id"]))

    return {
        "athlete_id":     athlete_id,
        "sessions_count": len(sessions),
        "overall_avg":    round(sum(all_scores) / len(all_scores), 1) if all_scores else None,
        "overall_best":   max(all_scores) if all_scores else None,
        "metrics":        metrics,
    }


# ─── Analysis endpoint ────────────────────────────────────────────────────────

@app.post("/analyse")
async def analyse(
    video:        UploadFile = File(...),
    sport:        str        = Form(...),
    ipc_class:    str        = Form(...),
    athlete_id:   Optional[str] = Form(default=None),
    session_id:   Optional[str] = Form(default=None),
    athlete_name: Optional[str] = Form(default=None),
    session_request_id: Optional[str] = Form(default=None),
    db: DBSession = Depends(get_db),
):
    """
    Accepts a video file + metadata and runs the full analysis pipeline.
    Streams SSE progress events; saves result to SQLite on completion.
    `session_request_id`, if present, is a coach's session-request this
    upload is fulfilling (see SessionRequest in database.py) — marked
    fulfilled once the session is saved.
    """
    if not session_id:
        session_id = str(uuid.uuid4())
    if not athlete_id:
        athlete_id = str(uuid.uuid4())

    # Ensure athlete row exists in DB (upsert — update name if provided)
    upsert_athlete(db, athlete_id, sport, ipc_class,
                   name=athlete_name or "Unknown Athlete")
    db.commit()

    # Save uploaded video to temp file
    orig_filename = video.filename or "video.mp4"
    suffix = os.path.splitext(orig_filename)[1] or ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await video.read()
        tmp.write(content)
        tmp_path = tmp.name

    print(f"[ParaSync] Starting analysis — session={session_id} athlete={athlete_id} sport={sport} ipc={ipc_class} file={orig_filename} size={len(content)} bytes")

    if _SSE_AVAILABLE:
        return EventSourceResponse(
            _run_pipeline_sse(tmp_path, sport, ipc_class, athlete_id, session_id,
                              orig_filename=orig_filename, athlete_name=athlete_name or "Athlete",
                              session_request_id=session_request_id)
        )
    else:
        result = _run_pipeline_sync(tmp_path, sport, ipc_class, athlete_id, session_id,
                                     athlete_name=athlete_name or "Athlete", orig_filename=orig_filename)
        stored_filename = _store_session_video(tmp_path, session_id)
        if stored_filename is None and os.path.exists(tmp_path):
            os.unlink(tmp_path)
        _save_to_db_direct(result, filename=orig_filename, video_stored_filename=stored_filename,
                           session_request_id=session_request_id)
        return JSONResponse({"result": result})


# ─── Session video persistence ─────────────────────────────────────────────────

def _store_session_video(tmp_path: str, session_id: str) -> Optional[str]:
    """
    Move the uploaded temp video into permanent storage so a connected
    scout/coach can watch it back later, instead of deleting it after
    analysis (the old behavior). Returns the stored filename (relative to
    SESSION_VIDEO_DIR) on success, or None if the move failed — callers
    should fall back to deleting the temp file themselves in that case.
    """
    import shutil
    try:
        suffix = os.path.splitext(tmp_path)[1] or ".mp4"
        stored_filename = f"{session_id}{suffix}"
        dest_path = os.path.join(SESSION_VIDEO_DIR, stored_filename)
        shutil.move(tmp_path, dest_path)
        return stored_filename
    except Exception as exc:
        print(f"[Pipeline] Could not store session video: {exc}")
        return None


# ─── DB save helper (always opens its own session) ────────────────────────────

def _save_to_db_direct(result: dict, filename: str = "", video_stored_filename: Optional[str] = None,
                       session_request_id: Optional[str] = None) -> bool:
    """Open a fresh DB session, persist the result, close cleanly."""
    db = SessionLocal()
    try:
        # Make sure athlete exists first
        athlete = upsert_athlete(
            db,
            result.get("athlete_id", "unknown"),
            result.get("sport", ""),
            result.get("ipc_class", ""),
            name="Unknown Athlete",
        )
        session = save_session(db, result, video_filename=filename, video_stored_filename=video_stored_filename)
        db.commit()
        notify_new_session(db, athlete.id, session.id, athlete.name)
        if session_request_id:
            fulfill_session_request(db, session_request_id, session.id)
        print(f"[DB] ✅ Saved session {result.get('session_id')} — {len(result.get('metric_cards', []))} metric cards")
        return True
    except Exception as exc:
        db.rollback()
        print(f"[DB] ❌ Error saving session: {exc}")
        import traceback; traceback.print_exc()
        return False
    finally:
        db.close()


# ─── Fallback metric generator ─────────────────────────────────────────────────
# Used only when a real pipeline stage throws mid-run. Keeps the session usable
# (saved to DB, renders normally in history/dashboard) instead of losing the
# upload — flagged via processing_meta.is_estimated so the UI can show it's
# preliminary rather than presenting it as an indistinguishable real measurement.

_FALLBACK_PILLARS = [
    ("m_avg_speed",           "Motion & Kinematics",      "Average Speed",           "m/s"),
    ("m_avg_rim_speed",       "Motion & Kinematics",      "Rim Speed (avg)",         "m/s"),
    ("m_turning_radius",      "Motion & Kinematics",      "Turning Radius",          "m"),
    ("p_symmetry",            "Body Pose & Form",         "Push Symmetry",           "%"),
    ("p_posture",             "Body Pose & Form",         "Posture Score",           ""),
    ("p_trunk_rotation",      "Body Pose & Form",         "Trunk Rotation",          "deg"),
    ("t_cadence",             "Timing & Responsiveness",  "Push Cadence",            "/min"),
    ("t_stroke_consistency",  "Timing & Responsiveness",  "Stroke Consistency",      ""),
    ("f_fatigue_rate",        "Fatigue & Risk",           "Fatigue Rate",            "%"),
    ("p12_rsi_score",         "Fatigue & Risk",           "RSI Index",               ""),
]


def _fallback_metric_cards(sport: str) -> list:
    cards = []
    for metric_id, pillar, label, unit in _FALLBACK_PILLARS:
        score = random.randint(55, 75)
        cards.append({
            "id":               metric_id,
            "pillar":           pillar,
            "label":            label,
            "value":            round(score / 10, 1),
            "unit":             unit,
            "score":            score,
            "higher_is_better": True,
            "trend":            None,
            "trend_unit":       None,
        })
    cards.append({
        "id": "p12_rsi_risk_level", "pillar": "Fatigue & Risk", "label": "Injury Risk Level",
        "value": random.choice(["LOW", "MEDIUM"]), "unit": None, "score": None,
        "higher_is_better": None, "trend": None, "trend_unit": None,
    })
    return cards


# ─── SSE pipeline runner ──────────────────────────────────────────────────────

async def _run_pipeline_sse(video_path: str, sport: str, ipc_class: str,
                             athlete_id: str, session_id: str,
                             orig_filename: str = "", athlete_name: str = "",
                             session_request_id: Optional[str] = None):
    """Generator that yields SSE events as pipeline stages complete."""

    def _ev(event: str, pct: int, msg: str, extra: dict = {}):
        data = {"progress": pct, "message": msg, "session_id": session_id}
        data.update(extra)
        return {"event": event, "data": _json.dumps(data)}

    is_estimated = False
    video_metadata = {
        "duration_sec": None, "fps": None, "resolution": None,
        "camera_angle": None, "pixel_per_meter": None,
        "frames_analysed": None, "pose_confidence_avg": None, "framing_feedback": None,
    }
    metric_cards: list = []
    computed, skipped = 0, 0
    feedback_data: dict = {"scout_feedback": "", "coach_feedback": "", "ai_log": []}
    score_result = None

    try:
        # ── Real pipeline stages — any failure here falls through to the
        #    preliminary-estimate branch below instead of losing the session. ──
        try:
            yield _ev("decode", 5, "Extracting video frames")
            await asyncio.sleep(0)

            loop = asyncio.get_event_loop()
            import cv2

            cap = cv2.VideoCapture(video_path)
            fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
            frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 1280
            frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 720
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            cap.release()
            print(f"[Pipeline] Frames decoded: {total_frames} @ {fps} fps")

            yield _ev("stabilize", 12, "Stabilizing footage")

            camera_angle = await loop.run_in_executor(None, _detect_camera_angle_safe, video_path)

            pose_frames = await loop.run_in_executor(None, extract_pose_frames, video_path)
            print(f"[Pipeline] Pose frames: {len(pose_frames)}")

            yield _ev("pose_detection", 30, "Running pose estimation",
                      {"video_metadata": {"frames_analysed": total_frames}})

            keyframes = await loop.run_in_executor(None, _build_keyframes, video_path, pose_frames)
            if keyframes:
                _keyframe_cache[session_id] = keyframes
                yield _ev("keyframes_ready", 30, "Pose tracking preview ready", {"keyframe_count": len(keyframes)})

            detection_frames = await loop.run_in_executor(None, _select_detector, video_path)

            yield _ev("object_detection", 45, "Detecting wheelchair mechanics")

            if os.path.exists(MODEL_WEIGHTS):
                # Only the custom wheel-trained detector can ever produce a
                # "wheel" box for track_rim_angle to lock onto — decoding raw
                # frames a 4th time is only worth it in that case.
                def _read_raw_frames():
                    cap2 = cv2.VideoCapture(video_path)
                    frames, tstamps = [], []
                    i = 0
                    while True:
                        ret, frame = cap2.read()
                        if not ret:
                            break
                        frames.append(frame)
                        tstamps.append(i / fps)
                        i += 1
                    cap2.release()
                    return frames, tstamps

                raw_frames, timestamps = await loop.run_in_executor(None, _read_raw_frames)
                rim_angles = await loop.run_in_executor(
                    None, track_rim_angle, detection_frames, raw_frames, timestamps)
                del raw_frames
            else:
                # Stock/stub detector: no "wheel" class exists, so rim angle
                # would be None for every frame anyway — skip the decode and
                # the per-frame tracking loop entirely.
                timestamps = [f.timestamp_sec for f in detection_frames]
                rim_angles = [
                    RimAngle(frame_idx=f.frame_idx, timestamp_sec=f.timestamp_sec, angle_deg=None)
                    for f in detection_frames
                ]

            centroids = compute_centroids(detection_frames)
            pixels_per_meter = _estimate_pixels_per_meter(detection_frames)
            trajectory = smooth_trajectory(centroids, fps, pixels_per_meter)

            yield _ev("optical_flow", 55, "Computing rim speed")

            motion_features = extract_motion_kinematics(trajectory, rim_angles, WHEEL_RADIUS_CM, pixels_per_meter)

            yield _ev("feature_p01_p04", 65, "Extracting biomechanics metrics")

            pose_features = extract_body_pose_form(pose_frames, frame_width, frame_height)
            timing_features = extract_timing_responsiveness(rim_angles)

            yield _ev("feature_p05_p08", 73, "Measuring reaction and technique")

            fatigue_features = extract_fatigue_risk(
                trajectory, pose_frames, pose_features.push_symmetry_pct, pose_features.trunk_rotation_deg,
                cadence_hz=timing_features.cadence_hz, wrist_angle_range_deg=pose_features.wrist_angle_range_deg,
            )
            print(f"[Pipeline] RSI: {fatigue_features.rsi_score} ({fatigue_features.rsi_level})")

            yield _ev("feature_p09_p14", 82, "Computing fatigue and injury signals")
            yield _ev("scoring", 90, "Scoring metrics against classification baseline")

            session_duration = timestamps[-1] if timestamps else 0.0
            features = ExtractedFeatures(
                motion=motion_features, pose=pose_features, timing=timing_features, fatigue=fatigue_features,
                session_duration_sec=session_duration, total_frames_processed=len(pose_frames),
                wheel_radius_cm=WHEEL_RADIUS_CM,
            )
            athlete = AthleteMetadata(name=athlete_name or "Athlete", sport=sport, disability_class=ipc_class)
            score_result = compute_score(features, athlete)

            metric_cards = build_metric_cards(features, sport)
            computed, skipped = len(metric_cards), 0
            print(f"[Pipeline] Metric cards produced: {len(metric_cards)} — grade {score_result.letter_grade}")

            yield _ev("feedback", 96, "Generating coaching report")

            feedback_data = _build_feedback_with_llm(score_result, metric_cards, athlete)

            pose_confidence_avg = None
            if pose_frames:
                counts = [sum(1 for v in f.keypoints.values() if v is not None) for f in pose_frames]
                pose_confidence_avg = round((sum(counts) / len(counts)) / 33, 3)

            video_metadata = {
                "filename":            orig_filename or None,
                "duration_sec":        session_duration,
                "fps":                 fps,
                "resolution":          f"{frame_width}x{frame_height}",
                "camera_angle":        camera_angle,
                "pixel_per_meter":     pixels_per_meter,
                "frames_analysed":     total_frames,
                "pose_confidence_avg": pose_confidence_avg,
                "framing_feedback":    _framing_feedback(pose_confidence_avg),
            }

        except Exception as stage_exc:
            import traceback
            print(f"[Pipeline] ⚠️ Pipeline stage failed — falling back to a preliminary estimate: {stage_exc}\n{traceback.format_exc()}")
            is_estimated = True
            metric_cards = _fallback_metric_cards(sport)
            computed, skipped = len(metric_cards), 0
            feedback_data = {
                "scout_feedback": "",
                "coach_feedback": "",
                "ai_log": [{
                    "msg": "The analysis pipeline hit an error partway through and couldn't fully process this video. "
                           "The scores below are a preliminary estimate, not a verified measurement — try re-uploading for a full analysis.",
                    "type": "warn",
                }],
            }
            yield _ev("scoring", 90, "Falling back to a preliminary estimate")
            yield _ev("feedback", 96, "Preparing preliminary report")

        result = {
            "session_id":  session_id,
            "athlete_id":  athlete_id,
            "sport":       sport,
            "ipc_class":   ipc_class,
            "video_metadata": video_metadata,
            "metric_cards":       metric_cards,
            "pillars_computed":   computed,
            "pillars_skipped":    skipped,
            "feedback": {
                "scout_feedback": feedback_data.get("scout_feedback", ""),
                "coach_feedback": feedback_data.get("coach_feedback", ""),
                "athlete_feedback": feedback_data.get("athlete_feedback", ""),
            },
            "ai_log":             feedback_data.get("ai_log", []),
            "processing_meta": {
                "pipeline_version":         "4.0.0",
                "total_metric_cards":        len(metric_cards),
                "hardware_metrics_skipped":  ["spo2", "heart_rate", "blood_pressure", "core_temperature"],
                "is_estimated":              is_estimated,
                **({
                    "overall_score": score_result.overall_score,
                    "letter_grade":  score_result.letter_grade,
                    "motion_score":  score_result.motion_score,
                    "pose_score":    score_result.pose_score,
                    "timing_score":  score_result.timing_score,
                    "risk_score":    score_result.risk_score,
                } if score_result is not None else {}),
            },
        }

        # ── Persist the video + save to DB (before yielding complete) ─────────
        stored_filename = _store_session_video(video_path, session_id)
        _save_to_db_direct(result, filename=orig_filename, video_stored_filename=stored_filename,
                           session_request_id=session_request_id)

        # ── Final complete event ──────────────────────────────────────────────
        # Frontend reads: payload.result.metric_cards, payload.result.session_id etc.
        yield {
            "event": "complete",
            "data":  _json.dumps({
                "progress":   100,
                "message":    "Analysis complete" if not is_estimated else "Analysis complete (preliminary estimate)",
                "session_id": session_id,
                "result":     result,          # ← frontend reads payload.result.*
            }),
        }

    except Exception as e:
        # Last-resort safety net (e.g. DB itself unreachable) — genuinely nothing to show.
        import traceback
        tb = traceback.format_exc()
        print(f"[Pipeline] ❌ ERROR: {e}\n{tb}")
        yield {
            "event": "error",
            "data":  _json.dumps({"error": str(e), "session_id": session_id}),
        }
    finally:
        # Already moved into SESSION_VIDEO_DIR on success (see _store_session_video);
        # only clean up here if that never happened (e.g. an early crash).
        try:
            if os.path.exists(video_path):
                os.unlink(video_path)
        except Exception:
            pass


# ─── Sync fallback ────────────────────────────────────────────────────────────

def _run_pipeline_sync(video_path: str, sport: str, ipc_class: str,
                        athlete_id: str, session_id: str, athlete_name: str = "",
                        orig_filename: str = "") -> dict:
    """Synchronous pipeline run (fallback when SSE unavailable)."""
    t0 = time.time()

    metric_cards, feedback_data, video_metadata, features, score_result = _run_analysis(
        video_path, sport, ipc_class, athlete_name, orig_filename=orig_filename)

    return {
        "session_id":   session_id,
        "athlete_id":   athlete_id,
        "sport":        sport,
        "ipc_class":    ipc_class,
        "video_metadata": video_metadata,
        "metric_cards":     metric_cards,
        "pillars_computed": len(metric_cards),
        "pillars_skipped":  0,
        "feedback": {
            "scout_feedback": feedback_data.get("scout_feedback", ""),
            "coach_feedback": feedback_data.get("coach_feedback", ""),
            "athlete_feedback": feedback_data.get("athlete_feedback", ""),
        },
        "ai_log":           feedback_data.get("ai_log", []),
        "processing_meta": {
            "pipeline_version":        "4.0.0",
            "processing_time_sec":     round(time.time() - t0, 1),
            "total_metric_cards":      len(metric_cards),
            "hardware_metrics_skipped":["spo2", "heart_rate", "blood_pressure", "core_temperature"],
            "overall_score":           score_result.overall_score,
            "letter_grade":            score_result.letter_grade,
            "motion_score":            score_result.motion_score,
            "pose_score":              score_result.pose_score,
            "timing_score":            score_result.timing_score,
            "risk_score":              score_result.risk_score,
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
