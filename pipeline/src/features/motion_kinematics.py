"""
METRIC CATEGORY 1: Motion and Kinematics — spec §4.6.
"""
import math
from typing import List

import numpy as np

from src.pipeline.schemas import ChairTrajectoryPoint, MotionKinematicsFeatures, RimAngle


def _trim_outliers(values: List[float], pct: float = 0.05) -> np.ndarray:
    arr = np.sort(np.array(values, dtype=float))
    if arr.size == 0:
        return arr
    lo = int(arr.size * pct)
    hi = int(arr.size * (1 - pct))
    trimmed = arr[lo:max(hi, lo + 1)]
    return trimmed if trimmed.size else arr


def extract_motion_kinematics(
    trajectory: List[ChairTrajectoryPoint],
    rim_angles: List[RimAngle],
    wheel_radius_cm: float,
    pixels_per_meter: float = 100.0,
) -> MotionKinematicsFeatures:
    if not trajectory:
        return MotionKinematicsFeatures(
            avg_speed_mps=0, peak_speed_mps=0, avg_acceleration_mps2=0,
            peak_acceleration_mps2=0, avg_rim_speed_mps=0, peak_rim_speed_mps=0,
            turning_radius_m=0, angular_velocity_deg_per_sec=0, braking_rate_mps2=0,
        )

    # ── avg/peak speed ──────────────────────────────────────────────────────
    speeds = [p.speed_mps for p in trajectory]
    trimmed_speeds = _trim_outliers(speeds, 0.05)
    avg_speed = float(np.mean(trimmed_speeds)) if trimmed_speeds.size else 0.0
    peak_speed = float(np.percentile(trimmed_speeds, 95)) if trimmed_speeds.size else 0.0

    # ── acceleration ─────────────────────────────────────────────────────────
    accelerations = []
    for prev, curr in zip(trajectory, trajectory[1:]):
        dt = curr.timestamp_sec - prev.timestamp_sec
        if dt <= 0:
            continue
        accelerations.append(abs(curr.speed_mps - prev.speed_mps) / dt)
    positive_accel = [a for a in accelerations if a > 0]
    avg_acceleration = float(np.mean(positive_accel)) if positive_accel else 0.0
    peak_acceleration = float(np.percentile(accelerations, 95)) if accelerations else 0.0

    # ── rim speed ─────────────────────────────────────────────────────────────
    wheel_radius_m = wheel_radius_cm / 100.0
    rim_speeds = []
    for prev, curr in zip(rim_angles, rim_angles[1:]):
        if prev.angle_deg is None or curr.angle_deg is None:
            continue
        dt = curr.timestamp_sec - prev.timestamp_sec
        if dt <= 0:
            continue
        angular_velocity = (curr.angle_deg - prev.angle_deg) / dt
        rim_speeds.append(abs(angular_velocity) * (math.pi / 180) * wheel_radius_m)
    avg_rim_speed = float(np.mean(rim_speeds)) if rim_speeds else 0.0
    peak_rim_speed = float(np.percentile(rim_speeds, 95)) if rim_speeds else 0.0

    # ── turning radius ───────────────────────────────────────────────────────
    turning_radius_m = _min_turning_radius(trajectory, pixels_per_meter)

    # ── angular velocity of chair heading ───────────────────────────────────
    bearings = []
    for prev, curr in zip(trajectory, trajectory[1:]):
        dx = curr.smoothed_x - prev.smoothed_x
        dy = curr.smoothed_y - prev.smoothed_y
        if dx == 0 and dy == 0:
            continue
        bearings.append((curr.timestamp_sec, math.degrees(math.atan2(dy, dx))))

    angular_velocities = []
    for (t_prev, b_prev), (t_curr, b_curr) in zip(bearings, bearings[1:]):
        dt = t_curr - t_prev
        if dt <= 0:
            continue
        delta = (b_curr - b_prev + 180) % 360 - 180
        angular_velocities.append(abs(delta) / dt)
    angular_velocity_deg_per_sec = float(np.mean(angular_velocities)) if angular_velocities else 0.0

    # ── braking rate ─────────────────────────────────────────────────────────
    braking_rate_mps2 = _avg_braking_rate(trajectory)

    return MotionKinematicsFeatures(
        avg_speed_mps=avg_speed,
        peak_speed_mps=peak_speed,
        avg_acceleration_mps2=avg_acceleration,
        peak_acceleration_mps2=peak_acceleration,
        avg_rim_speed_mps=avg_rim_speed,
        peak_rim_speed_mps=peak_rim_speed,
        turning_radius_m=turning_radius_m,
        angular_velocity_deg_per_sec=angular_velocity_deg_per_sec,
        braking_rate_mps2=braking_rate_mps2,
    )


def _min_turning_radius(trajectory: List[ChairTrajectoryPoint], pixels_per_meter: float) -> float:
    # Find turning events: sequences where travel direction changes > 30 deg.
    bearings = []
    for prev, curr in zip(trajectory, trajectory[1:]):
        dx = curr.smoothed_x - prev.smoothed_x
        dy = curr.smoothed_y - prev.smoothed_y
        bearings.append(math.degrees(math.atan2(dy, dx)) if (dx or dy) else None)

    events: List[List[ChairTrajectoryPoint]] = []
    current_event: List[ChairTrajectoryPoint] = []
    ref_bearing = None

    for i, b in enumerate(bearings):
        if b is None:
            continue
        if ref_bearing is None:
            ref_bearing = b
            current_event = [trajectory[i]]
            continue
        delta = abs((b - ref_bearing + 180) % 360 - 180)
        if delta > 30:
            current_event.append(trajectory[i + 1])
            if len(current_event) >= 4:
                events.append(current_event)
            ref_bearing = b
        else:
            current_event = [trajectory[i]]
            ref_bearing = b

    if not events:
        return 0.0

    radii = []
    for event in events:
        r_px = _fit_circle_radius_px(event)
        if r_px is not None and r_px > 0:
            radii.append(r_px / pixels_per_meter)

    return float(min(radii)) if radii else 0.0


def _fit_circle_radius_px(points: List[ChairTrajectoryPoint]):
    """Least-squares circle fit (Kasa method), returns radius in pixels."""
    xs = np.array([p.smoothed_x for p in points])
    ys = np.array([p.smoothed_y for p in points])
    if xs.size < 3:
        return None

    A = np.column_stack([xs, ys, np.ones_like(xs)])
    b = xs ** 2 + ys ** 2
    try:
        sol, *_ = np.linalg.lstsq(A, b, rcond=None)
    except np.linalg.LinAlgError:
        return None
    cx, cy = sol[0] / 2, sol[1] / 2
    return math.sqrt(sol[2] + cx ** 2 + cy ** 2)


def _avg_braking_rate(trajectory: List[ChairTrajectoryPoint]) -> float:
    events = []
    i = 0
    n = len(trajectory)
    while i < n - 1:
        start = trajectory[i]
        j = i + 1
        while j < n and (trajectory[j].timestamp_sec - start.timestamp_sec) < 2.0:
            drop = start.speed_mps - trajectory[j].speed_mps
            if drop > 0.5:
                dt = trajectory[j].timestamp_sec - start.timestamp_sec
                if dt > 0:
                    events.append(drop / dt)
                break
            j += 1
        i += 1

    return float(np.mean(events)) if events else 0.0
