"""
Kalman-filtered chair trajectory + speed — spec §4.5.

Calibration note: the spec's inline step (7e) computes pixels_per_meter from
frame_width_px, which implicitly assumes the wheel diameter spans the full
frame width — that's wrong and produces nonsense speeds. We instead use the
"Pixels-to-meters calibration" note from the same section: pixels_per_meter
derived from the actual average detected wheel bounding-box pixel diameter.

The final pixels_per_meter decision (wheel diameter > detected chair width >
nominal guess) is made once by the caller — see api.py's
`_estimate_pixels_per_meter` — and passed in directly, so every metric that
depends on real-world scale (speed here, turning radius in
motion_kinematics.py) uses the exact same number instead of each computing
its own fallback and silently disagreeing.
"""
from typing import List, Tuple

import numpy as np
from filterpy.kalman import KalmanFilter

from src.pipeline.schemas import ChairTrajectoryPoint


def smooth_trajectory(
    centroids: List[Tuple[int, float, float, float]],
    fps: float,
    pixels_per_meter: float,
) -> List[ChairTrajectoryPoint]:
    if not centroids:
        return []

    kf = KalmanFilter(dim_x=4, dim_z=2)
    dt = 1.0 / fps if fps > 0 else 1.0 / 30.0

    kf.F = np.array([
        [1, 0, dt, 0],
        [0, 1, 0, dt],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
    ])
    kf.H = np.array([
        [1, 0, 0, 0],
        [0, 1, 0, 0],
    ])
    kf.Q = np.eye(4) * 0.1
    kf.R = np.eye(2) * 10

    first_idx, first_ts, first_x, first_y = centroids[0]
    kf.x = np.array([first_x, first_y, 0.0, 0.0])
    kf.P = np.eye(4) * 500

    points: List[ChairTrajectoryPoint] = []
    for frame_idx, ts, raw_x, raw_y in centroids:
        kf.predict()
        kf.update(np.array([raw_x, raw_y]))

        smoothed_x, smoothed_y, vx, vy = kf.x
        speed_mps = float(np.sqrt(vx ** 2 + vy ** 2) / pixels_per_meter)

        points.append(ChairTrajectoryPoint(
            frame_idx=frame_idx,
            timestamp_sec=ts,
            raw_x=raw_x, raw_y=raw_y,
            smoothed_x=float(smoothed_x), smoothed_y=float(smoothed_y),
            velocity_x=float(vx), velocity_y=float(vy),
            speed_mps=speed_mps,
        ))

    return points
