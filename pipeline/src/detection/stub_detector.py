"""
Hardcoded fallback detector — used until a trained YOLO wheelchair/wheel
model exists at MODEL_WEIGHTS. Spec §4.2.
"""
from typing import Callable, List, Optional

import cv2

from src.pipeline.schemas import BoundingBox, DetectionFrame


def detect_frames_stub(
    video_path: str,
    progress_callback: Optional[Callable[[int], None]] = None,
) -> List[DetectionFrame]:
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    cap.release()

    wheelchair_box = BoundingBox(x1=200, y1=300, x2=800, y2=700, confidence=0.95, class_name="wheelchair")
    wheel_box = BoundingBox(x1=220, y1=450, x2=480, y2=710, confidence=0.90, class_name="wheel")

    frames: List[DetectionFrame] = []
    for frame_idx in range(total_frames):
        frames.append(DetectionFrame(
            frame_idx=frame_idx,
            timestamp_sec=frame_idx / fps,
            boxes=[wheelchair_box, wheel_box],
        ))
        if progress_callback and (frame_idx + 1) % 100 == 0:
            progress_callback(int(100 * (frame_idx + 1) / max(total_frames, 1)))

    return frames
