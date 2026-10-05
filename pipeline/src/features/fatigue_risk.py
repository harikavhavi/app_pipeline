"""
METRIC CATEGORY 4: Fatigue and Risk — spec §4.6.
"""
from typing import List

import numpy as np

from src.pipeline.schemas import ChairTrajectoryPoint, FatigueRiskFeatures, PoseFrame


def extract_fatigue_risk(
    trajectory: List[ChairTrajectoryPoint],
    pose_frames: List[PoseFrame],
    push_symmetry_pct: float,
    trunk_rotation_deg: float,
    cadence_hz: float = 0.0,
    wrist_angle_range_deg: float = 0.0,
) -> FatigueRiskFeatures:
    if not trajectory:
        return FatigueRiskFeatures(
            fatigue_rate_pct=0, speed_variance=0, rsi_score=0, rsi_level="LOW",
            shoulder_acceleration_avg=0, asymmetry_flag=push_symmetry_pct < 70,
            overrotation_flag=trunk_rotation_deg > 25, endurance_flag=False,
        )

    session_duration = trajectory[-1].timestamp_sec - trajectory[0].timestamp_sec

    # ── fatigue rate ─────────────────────────────────────────────────────────
    t0 = trajectory[0].timestamp_sec
    if session_duration >= 360:  # 6 minutes
        window = 180
    else:
        window = session_duration * 0.25

    first_window = [p.speed_mps for p in trajectory if p.timestamp_sec <= t0 + window]
    last_window = [p.speed_mps for p in trajectory if p.timestamp_sec >= trajectory[-1].timestamp_sec - window]

    avg_speed_first = float(np.mean(first_window)) if first_window else 0.0
    avg_speed_last = float(np.mean(last_window)) if last_window else 0.0
    fatigue_rate_pct = ((avg_speed_first - avg_speed_last) / avg_speed_first * 100) if avg_speed_first > 0 else 0.0

    # ── speed variance ───────────────────────────────────────────────────────
    speeds = np.sort(np.array([p.speed_mps for p in trajectory], dtype=float))
    if speeds.size:
        lo, hi = int(speeds.size * 0.05), int(speeds.size * 0.95)
        trimmed = speeds[lo:max(hi, lo + 1)]
    else:
        trimmed = speeds
    speed_variance = float(np.var(trimmed)) if trimmed.size else 0.0

    # ── shoulder acceleration ────────────────────────────────────────────────
    shoulder_acceleration_avg = _shoulder_acceleration(pose_frames)

    # ── RSI score ─────────────────────────────────────────────────────────────
    shoulder_component = min(30.0, (shoulder_acceleration_avg / 50) * 30)
    cadence_component = min(30.0, (cadence_hz / 3) * 30)
    duration_component = min(20.0, (session_duration / 900) * 20)
    wrist_component = min(20.0, (wrist_angle_range_deg / 90) * 20)
    rsi_score = min(100.0, shoulder_component + cadence_component + duration_component + wrist_component)

    if rsi_score < 25:
        rsi_level = "LOW"
    elif rsi_score <= 60:
        rsi_level = "MEDIUM"
    else:
        rsi_level = "HIGH"

    asymmetry_flag = push_symmetry_pct < 70
    overrotation_flag = trunk_rotation_deg > 25
    endurance_flag = fatigue_rate_pct > 20

    return FatigueRiskFeatures(
        fatigue_rate_pct=fatigue_rate_pct,
        speed_variance=speed_variance,
        rsi_score=rsi_score,
        rsi_level=rsi_level,
        shoulder_acceleration_avg=shoulder_acceleration_avg,
        asymmetry_flag=asymmetry_flag,
        overrotation_flag=overrotation_flag,
        endurance_flag=endurance_flag,
    )


def _shoulder_acceleration(pose_frames: List[PoseFrame]) -> float:
    valid = [(f.timestamp_sec, f.keypoints.get("LEFT_SHOULDER"), f.keypoints.get("RIGHT_SHOULDER"))
             for f in pose_frames]
    valid = [(t, l, r) for t, l, r in valid if l is not None and r is not None]

    if len(valid) < 3:
        return 0.0

    velocities = []
    for (t_prev, l_prev, r_prev), (t_curr, l_curr, r_curr) in zip(valid, valid[1:]):
        dt = t_curr - t_prev
        if dt <= 0:
            continue
        lv = np.array([(l_curr.x - l_prev.x) / dt, (l_curr.y - l_prev.y) / dt])
        rv = np.array([(r_curr.x - r_prev.x) / dt, (r_curr.y - r_prev.y) / dt])
        velocities.append((t_curr, lv, rv))

    accelerations = []
    for (t_prev, lv_prev, rv_prev), (t_curr, lv_curr, rv_curr) in zip(velocities, velocities[1:]):
        dt = t_curr - t_prev
        if dt <= 0:
            continue
        la = np.linalg.norm(lv_curr - lv_prev) / dt
        ra = np.linalg.norm(rv_curr - rv_prev) / dt
        accelerations.append((la + ra) / 2)

    return float(np.mean(accelerations)) if accelerations else 0.0
