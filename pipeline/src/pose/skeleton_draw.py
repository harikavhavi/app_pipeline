"""
Draws a simplified skeleton overlay onto a single BGR frame from an already-
computed PoseFrame. Pure rendering — no inference — so calling this on a
handful of sample frames after pose extraction adds negligible time.
"""
from typing import List, Tuple

import cv2
import numpy as np

from src.pipeline.schemas import PoseFrame

_CONNECTIONS: List[Tuple[str, str]] = [
    ("LEFT_SHOULDER", "RIGHT_SHOULDER"),
    ("LEFT_SHOULDER", "LEFT_ELBOW"), ("LEFT_ELBOW", "LEFT_WRIST"),
    ("RIGHT_SHOULDER", "RIGHT_ELBOW"), ("RIGHT_ELBOW", "RIGHT_WRIST"),
    ("LEFT_SHOULDER", "LEFT_HIP"), ("RIGHT_SHOULDER", "RIGHT_HIP"),
    ("LEFT_HIP", "RIGHT_HIP"),
    ("LEFT_HIP", "LEFT_KNEE"), ("LEFT_KNEE", "LEFT_ANKLE"),
    ("RIGHT_HIP", "RIGHT_KNEE"), ("RIGHT_KNEE", "RIGHT_ANKLE"),
    ("NOSE", "LEFT_SHOULDER"), ("NOSE", "RIGHT_SHOULDER"),
]

_LINE_COLOR = (238, 211, 34)   # BGR — cyan-ish, matches the app's accent
_DOT_COLOR = (255, 255, 255)
_VISIBILITY_THRESHOLD = 0.5


def draw_skeleton(frame_bgr: np.ndarray, pose_frame: PoseFrame) -> np.ndarray:
    """Returns a copy of frame_bgr with skeleton lines/points drawn on top."""
    out = frame_bgr.copy()
    h, w = out.shape[:2]
    kps = pose_frame.keypoints

    def px(name: str):
        kp = kps.get(name)
        if kp is None or kp.visibility < _VISIBILITY_THRESHOLD:
            return None
        return int(kp.x * w), int(kp.y * h)

    for a, b in _CONNECTIONS:
        pa, pb = px(a), px(b)
        if pa and pb:
            cv2.line(out, pa, pb, _LINE_COLOR, 2, cv2.LINE_AA)

    for name in kps:
        p = px(name)
        if p:
            cv2.circle(out, p, 3, _DOT_COLOR, -1, cv2.LINE_AA)

    return out
