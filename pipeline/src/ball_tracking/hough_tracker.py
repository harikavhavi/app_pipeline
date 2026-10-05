"""
Ball detection (Hough circles + HSV color match) and wheel rim angle
tracking (single tracked rim point via Lucas-Kanade optical flow) — spec §4.4.
"""
import math
from typing import List, Optional

import cv2
import numpy as np

from src.pipeline.schemas import BallPosition, DetectionFrame, RimAngle

# HSV ranges for common ball colors — red (cricket) needs two wrap-around bands.
_RED_LOW1, _RED_HIGH1 = (0, 120, 70), (10, 255, 255)
_RED_LOW2, _RED_HIGH2 = (170, 120, 70), (180, 255, 255)
_ORANGE_LOW, _ORANGE_HIGH = (10, 100, 100), (25, 255, 255)  # basketball


def _color_match_mask(frame_bgr: np.ndarray) -> np.ndarray:
    hsv = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2HSV)
    red1 = cv2.inRange(hsv, np.array(_RED_LOW1), np.array(_RED_HIGH1))
    red2 = cv2.inRange(hsv, np.array(_RED_LOW2), np.array(_RED_HIGH2))
    orange = cv2.inRange(hsv, np.array(_ORANGE_LOW), np.array(_ORANGE_HIGH))
    return cv2.bitwise_or(cv2.bitwise_or(red1, red2), orange)


def detect_ball(frames: List[np.ndarray], timestamps: List[float]) -> List[BallPosition]:
    results: List[BallPosition] = []

    for frame_idx, (frame, ts) in enumerate(zip(frames, timestamps)):
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (9, 9), 2)

        circles = cv2.HoughCircles(
            blurred, cv2.HOUGH_GRADIENT, dp=1.2, minDist=50,
            param1=100, param2=30, minRadius=10, maxRadius=80,
        )

        if circles is None:
            results.append(BallPosition(frame_idx=frame_idx, timestamp_sec=ts))
            continue

        color_mask = _color_match_mask(frame)
        h, w = color_mask.shape

        best_circle = None
        best_match_pct = 0.0
        for cx, cy, r in np.round(circles[0]).astype(int):
            circle_mask = np.zeros_like(color_mask)
            cv2.circle(circle_mask, (int(cx), int(cy)), int(r), 255, thickness=-1)
            overlap = cv2.bitwise_and(color_mask, circle_mask)
            circle_area = max(int(np.count_nonzero(circle_mask)), 1)
            match_pct = np.count_nonzero(overlap) / circle_area
            if match_pct > best_match_pct:
                best_match_pct = match_pct
                best_circle = (cx, cy, r)

        if best_circle is None or best_match_pct < 0.4:
            results.append(BallPosition(frame_idx=frame_idx, timestamp_sec=ts))
            continue

        cx, cy, r = best_circle
        results.append(BallPosition(frame_idx=frame_idx, timestamp_sec=ts,
                                     x=float(cx), y=float(cy), radius=float(r)))

    return results


def _best_wheel_box(detection_frame: DetectionFrame):
    wheel_boxes = [b for b in detection_frame.boxes if b.class_name == "wheel"]
    if not wheel_boxes:
        return None
    return max(wheel_boxes, key=lambda b: b.confidence)


def track_rim_angle(
    detection_frames: List[DetectionFrame],
    raw_frames: List[np.ndarray],
    timestamps: List[float],
) -> List[RimAngle]:
    results: List[RimAngle] = []

    cumulative_angle = 0.0
    prev_crop_gray: Optional[np.ndarray] = None
    prev_center: Optional[np.ndarray] = None
    prev_track_point: Optional[np.ndarray] = None
    prev_ts: Optional[float] = None
    lk_params = dict(winSize=(15, 15), maxLevel=2,
                      criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 10, 0.03))

    for i, (det_frame, raw_frame, ts) in enumerate(zip(detection_frames, raw_frames, timestamps)):
        wheel_box = _best_wheel_box(det_frame)

        if wheel_box is None:
            results.append(RimAngle(frame_idx=i, timestamp_sec=ts, angle_deg=None))
            prev_crop_gray = None
            prev_track_point = None
            continue

        h, w = raw_frame.shape[:2]
        x1 = max(int(wheel_box.x1) - 10, 0)
        y1 = max(int(wheel_box.y1) - 10, 0)
        x2 = min(int(wheel_box.x2) + 10, w)
        y2 = min(int(wheel_box.y2) + 10, h)
        crop = raw_frame[y1:y2, x1:x2]
        if crop.size == 0:
            results.append(RimAngle(frame_idx=i, timestamp_sec=ts, angle_deg=cumulative_angle))
            continue

        crop_gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        crop_gray = cv2.GaussianBlur(crop_gray, (5, 5), 0)
        center = np.array([(x2 - x1) / 2.0, (y2 - y1) / 2.0])

        circles = cv2.HoughCircles(
            crop_gray, cv2.HOUGH_GRADIENT, dp=1.2, minDist=max(crop_gray.shape) // 2,
            param1=100, param2=25, minRadius=10, maxRadius=max(crop_gray.shape[0], crop_gray.shape[1]),
        )

        if circles is None:
            results.append(RimAngle(frame_idx=i, timestamp_sec=ts, angle_deg=cumulative_angle))
            prev_crop_gray = crop_gray
            prev_center = center
            prev_ts = ts
            continue

        # Pick a high-contrast point on the rim circumference to track.
        if prev_track_point is None or prev_crop_gray is None or prev_crop_gray.shape != crop_gray.shape:
            cx, cy, r = np.round(circles[0][0]).astype(float)
            grad_x = cv2.Sobel(crop_gray, cv2.CV_64F, 1, 0, ksize=3)
            grad_y = cv2.Sobel(crop_gray, cv2.CV_64F, 0, 1, ksize=3)
            grad_mag = cv2.magnitude(grad_x, grad_y)

            best_point = None
            best_grad = -1.0
            for angle_deg in range(0, 360, 10):
                rad = math.radians(angle_deg)
                px = int(cx + r * math.cos(rad))
                py = int(cy + r * math.sin(rad))
                if 0 <= px < grad_mag.shape[1] and 0 <= py < grad_mag.shape[0]:
                    g = grad_mag[py, px]
                    if g > best_grad:
                        best_grad = g
                        best_point = np.array([[px, py]], dtype=np.float32)

            track_point = best_point if best_point is not None else np.array([[cx, cy]], dtype=np.float32)
            results.append(RimAngle(frame_idx=i, timestamp_sec=ts, angle_deg=cumulative_angle))
        else:
            new_point, status, _ = cv2.calcOpticalFlowPyrLK(
                prev_crop_gray, crop_gray, prev_track_point, None, **lk_params)

            if status is not None and status[0][0] == 1:
                dt = max(ts - (prev_ts or ts), 1e-6)
                prev_vec = prev_track_point[0] - (prev_center if prev_center is not None else center)
                new_vec = new_point[0] - center
                prev_ang = math.atan2(prev_vec[1], prev_vec[0])
                new_ang = math.atan2(new_vec[1], new_vec[0])
                delta = math.degrees(new_ang - prev_ang)
                # normalize delta into [-180, 180] so we don't jump on wraparound
                delta = (delta + 180) % 360 - 180
                cumulative_angle += delta
                track_point = new_point
            else:
                track_point = prev_track_point

            results.append(RimAngle(frame_idx=i, timestamp_sec=ts, angle_deg=cumulative_angle))

        prev_crop_gray = crop_gray
        prev_center = center
        prev_track_point = track_point
        prev_ts = ts

    return results
