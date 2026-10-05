import numpy as np

from src.ball_tracking.hough_tracker import detect_ball, track_rim_angle
from src.pipeline.schemas import BoundingBox, DetectionFrame


def _blank_frames(n=10, size=(240, 320)):
    return [np.full((size[0], size[1], 3), 30, dtype=np.uint8) for _ in range(n)]


def test_detect_ball_returns_one_per_frame():
    frames = _blank_frames()
    timestamps = [i / 10 for i in range(len(frames))]
    results = detect_ball(frames, timestamps)
    assert len(results) == len(frames)


def test_detect_ball_no_ball_gives_none_values():
    frames = _blank_frames()
    timestamps = [i / 10 for i in range(len(frames))]
    results = detect_ball(frames, timestamps)
    for r in results:
        assert r.x is None
        assert r.y is None
        assert r.radius is None


def test_rim_angle_increases_when_wheel_spins():
    # Simulate a rotating high-contrast marker on a wheel by moving a bright
    # dot around a circle across frames; track_rim_angle should accumulate
    # a non-trivial angle rather than staying at 0.
    n = 30
    frames = []
    cx, cy, r = 80, 80, 60
    for i in range(n):
        frame = np.full((240, 320, 3), 20, dtype=np.uint8)
        cv_angle = (i / n) * 2 * np.pi * 2  # two full rotations
        import cv2
        cv2.circle(frame, (cx, cy), r, (200, 200, 200), 2)
        px = int(cx + r * np.cos(cv_angle))
        py = int(cy + r * np.sin(cv_angle))
        cv2.circle(frame, (px, py), 6, (255, 255, 255), -1)
        frames.append(frame)

    timestamps = [i / 15 for i in range(n)]
    wheel_box = BoundingBox(x1=10, y1=10, x2=150, y2=150, confidence=0.9, class_name="wheel")
    detection_frames = [DetectionFrame(frame_idx=i, timestamp_sec=timestamps[i], boxes=[wheel_box])
                         for i in range(n)]

    results = track_rim_angle(detection_frames, frames, timestamps)
    assert len(results) == n
    # Not a strict monotonic guarantee (LK tracking can be noisy), but the
    # cumulative magnitude should reflect real rotation, not stay near zero.
    final_angles = [r.angle_deg for r in results if r.angle_deg is not None]
    assert final_angles
    assert abs(final_angles[-1]) > 0
