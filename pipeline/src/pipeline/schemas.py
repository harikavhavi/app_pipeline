"""
ParaSync pipeline — canonical data schemas.
Every module in src/ imports only from here. See ParaSync_Pipeline_Spec_ClaudeCode.md Part 3.
"""
from typing import Callable, Dict, List, Optional

from pydantic import BaseModel

BLAZEPOSE_LANDMARK_NAMES = [
    "NOSE", "LEFT_EYE_INNER", "LEFT_EYE", "LEFT_EYE_OUTER",
    "RIGHT_EYE_INNER", "RIGHT_EYE", "RIGHT_EYE_OUTER",
    "LEFT_EAR", "RIGHT_EAR", "MOUTH_LEFT", "MOUTH_RIGHT",
    "LEFT_SHOULDER", "RIGHT_SHOULDER", "LEFT_ELBOW", "RIGHT_ELBOW",
    "LEFT_WRIST", "RIGHT_WRIST", "LEFT_PINKY", "RIGHT_PINKY",
    "LEFT_INDEX", "RIGHT_INDEX", "LEFT_THUMB", "RIGHT_THUMB",
    "LEFT_HIP", "RIGHT_HIP", "LEFT_KNEE", "RIGHT_KNEE",
    "LEFT_ANKLE", "RIGHT_ANKLE", "LEFT_HEEL", "RIGHT_HEEL",
    "LEFT_FOOT_INDEX", "RIGHT_FOOT_INDEX",
]


class Keypoint(BaseModel):
    x: float
    y: float
    z: float
    visibility: float


class PoseFrame(BaseModel):
    frame_idx: int
    timestamp_sec: float
    keypoints: Dict[str, Optional[Keypoint]]


class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    confidence: float
    class_name: str  # "wheelchair" or "wheel"


class DetectionFrame(BaseModel):
    frame_idx: int
    timestamp_sec: float
    boxes: List[BoundingBox] = []


class BallPosition(BaseModel):
    frame_idx: int
    timestamp_sec: float
    x: Optional[float] = None
    y: Optional[float] = None
    radius: Optional[float] = None


class RimAngle(BaseModel):
    frame_idx: int
    timestamp_sec: float
    angle_deg: Optional[float] = None


class ChairTrajectoryPoint(BaseModel):
    frame_idx: int
    timestamp_sec: float
    raw_x: float
    raw_y: float
    smoothed_x: float
    smoothed_y: float
    velocity_x: float
    velocity_y: float
    speed_mps: float


class MotionKinematicsFeatures(BaseModel):
    avg_speed_mps: float
    peak_speed_mps: float
    avg_acceleration_mps2: float
    peak_acceleration_mps2: float
    avg_rim_speed_mps: float
    peak_rim_speed_mps: float
    turning_radius_m: float
    angular_velocity_deg_per_sec: float
    braking_rate_mps2: float


class BodyPoseFormFeatures(BaseModel):
    push_symmetry_pct: float
    trunk_rotation_deg: float
    avg_shoulder_height_diff_px: float
    wrist_angle_range_deg: float
    posture_score: float
    left_arm_arc_deg: float
    right_arm_arc_deg: float


class TimingResponsivenessFeatures(BaseModel):
    cadence_pushes_per_min: float
    cadence_hz: float
    stroke_consistency_dtw: float
    contact_arc_deg: float
    avg_push_duration_sec: float
    avg_coast_duration_sec: float
    push_to_coast_ratio: float


class FatigueRiskFeatures(BaseModel):
    fatigue_rate_pct: float
    speed_variance: float
    rsi_score: float
    rsi_level: str  # "LOW" | "MEDIUM" | "HIGH"
    shoulder_acceleration_avg: float
    asymmetry_flag: bool
    overrotation_flag: bool
    endurance_flag: bool


class ExtractedFeatures(BaseModel):
    motion: MotionKinematicsFeatures
    pose: BodyPoseFormFeatures
    timing: TimingResponsivenessFeatures
    fatigue: FatigueRiskFeatures
    session_duration_sec: float
    total_frames_processed: int
    wheel_radius_cm: float


class ScoreResult(BaseModel):
    overall_score: float
    letter_grade: str
    motion_score: float
    pose_score: float
    timing_score: float
    risk_score: float
    injury_flags: List[str] = []
    highlights: List[str] = []
    recommendations: List[str] = []
    disability_class: str
    sport: str


class AthleteMetadata(BaseModel):
    name: str
    sport: str
    disability_class: str
    age: Optional[int] = None


class PipelineProgress(BaseModel):
    stage: str
    progress_pct: int
    message: str
    data: Optional[dict] = None


__all__ = [
    "BLAZEPOSE_LANDMARK_NAMES",
    "Keypoint", "PoseFrame", "BoundingBox", "DetectionFrame",
    "BallPosition", "RimAngle", "ChairTrajectoryPoint",
    "MotionKinematicsFeatures", "BodyPoseFormFeatures",
    "TimingResponsivenessFeatures", "FatigueRiskFeatures",
    "ExtractedFeatures", "ScoreResult", "AthleteMetadata", "PipelineProgress",
    "Callable",
]
