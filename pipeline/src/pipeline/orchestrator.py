"""
Standalone pipeline orchestrator — spec §4.8.

Used for local/CLI runs (see main.py). The live FastAPI SSE endpoint in
api.py calls the underlying stage functions directly instead of this
callback-driven wrapper, so it can keep emitting the frontend's legacy
SSE event names — see src/pipeline/adapter.py for that glue.
"""
import os
from typing import Callable

import cv2

from src.ball_tracking.hough_tracker import detect_ball, track_rim_angle
from src.detection.stub_detector import detect_frames_stub
from src.detection.yolo_detector import detect_frames as yolo_detect_frames
from src.detection.stock_person_detector import detect_frames as stock_person_detect_frames
from src.features.body_pose_form import extract_body_pose_form
from src.features.fatigue_risk import extract_fatigue_risk
from src.features.motion_kinematics import extract_motion_kinematics
from src.features.timing_responsiveness import extract_timing_responsiveness
from src.pose.blazepose import extract_pose_frames
from src.scoring.scorer import compute_score
from src.tracking.centroid_tracker import compute_centroids
from src.tracking.kalman_smoother import smooth_trajectory
from src.pipeline.schemas import AthleteMetadata, ExtractedFeatures, PipelineProgress, ScoreResult

WHEEL_RADIUS_CM = float(os.environ.get("WHEEL_RADIUS_CM", 30))
MODEL_WEIGHTS = os.environ.get("MODEL_WEIGHTS", "data/weights/yolov8n_wheelchair.pt")
STOCK_WEIGHTS = os.environ.get("STOCK_WEIGHTS", "models/yolov8n.pt")
YOLO_CONFIDENCE = float(os.environ.get("YOLO_CONFIDENCE", 0.4))

# Typical overall width (athlete + wheelchair frame, side-on) in cm — used only
# as a fallback scale reference when no "wheel" box exists (e.g. the stock
# person-detector proxy, which has no wheel class).
_ATHLETE_CHAIR_WIDTH_CM = 70.0


def _select_detector(video_path: str):
    if os.path.exists(MODEL_WEIGHTS):
        return yolo_detect_frames(video_path, MODEL_WEIGHTS, confidence=YOLO_CONFIDENCE)
    if os.path.exists(STOCK_WEIGHTS):
        return stock_person_detect_frames(video_path, STOCK_WEIGHTS, confidence=YOLO_CONFIDENCE)
    return detect_frames_stub(video_path)


def _avg_wheel_pixel_diameter(detection_frames) -> float:
    widths = []
    for frame in detection_frames:
        for box in frame.boxes:
            if box.class_name == "wheel":
                widths.append(box.x2 - box.x1)
    return float(sum(widths) / len(widths)) if widths else 0.0


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


def run_pipeline(
    video_path: str,
    athlete: AthleteMetadata,
    progress_callback: Callable[[PipelineProgress], None],
) -> ScoreResult:
    try:
        progress_callback(PipelineProgress(stage="pose_extraction", progress_pct=0,
                                            message="Extracting body keypoints..."))

        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 1280
        frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 720
        cap.release()

        pose_frames = extract_pose_frames(video_path,
                                           lambda pct: progress_callback(PipelineProgress(
                                               stage="pose_extraction", progress_pct=pct,
                                               message="Extracting body keypoints...")))

        progress_callback(PipelineProgress(stage="detection", progress_pct=25,
                                            message="Detecting wheelchair and wheels..."))

        detection_frames = _select_detector(video_path)

        progress_callback(PipelineProgress(stage="ball_rim_tracking", progress_pct=40,
                                            message="Tracking ball and wheel rim..."))

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

        ball_positions = detect_ball(raw_frames, timestamps)
        rim_angles = track_rim_angle(detection_frames, raw_frames, timestamps)
        del raw_frames  # free memory once tracking is done

        progress_callback(PipelineProgress(stage="tracking_fusion", progress_pct=55,
                                            message="Fusing detections into a trajectory..."))

        centroids = compute_centroids(detection_frames)
        pixels_per_meter = _estimate_pixels_per_meter(detection_frames)
        trajectory = smooth_trajectory(centroids, fps, pixels_per_meter)

        progress_callback(PipelineProgress(stage="feature_extraction", progress_pct=70,
                                            message="Extracting biomechanical features..."))

        motion_features = extract_motion_kinematics(trajectory, rim_angles, WHEEL_RADIUS_CM, pixels_per_meter)
        pose_features = extract_body_pose_form(pose_frames, frame_width, frame_height)
        timing_features = extract_timing_responsiveness(rim_angles)
        fatigue_features = extract_fatigue_risk(
            trajectory, pose_frames, pose_features.push_symmetry_pct, pose_features.trunk_rotation_deg,
            cadence_hz=timing_features.cadence_hz, wrist_angle_range_deg=pose_features.wrist_angle_range_deg,
        )

        session_duration = timestamps[-1] if timestamps else 0.0
        features = ExtractedFeatures(
            motion=motion_features, pose=pose_features, timing=timing_features, fatigue=fatigue_features,
            session_duration_sec=session_duration, total_frames_processed=len(pose_frames),
            wheel_radius_cm=WHEEL_RADIUS_CM,
        )

        progress_callback(PipelineProgress(stage="scoring", progress_pct=90,
                                            message="Scoring performance..."))

        score_result = compute_score(features, athlete)

        progress_callback(PipelineProgress(stage="complete", progress_pct=100,
                                            message="Analysis complete", data=score_result.model_dump()))
        return score_result

    except Exception as exc:
        progress_callback(PipelineProgress(stage="error", progress_pct=0, message=str(exc)))
        raise
