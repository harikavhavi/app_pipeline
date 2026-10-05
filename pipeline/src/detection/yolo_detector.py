"""
Real YOLOv8 wheelchair/wheel detector — spec §4.3.

Class-id mapping (0="wheelchair", 1="wheel") depends on the order of
`names` in the dataset.yaml used to train MODEL_WEIGHTS — see
training/train_yolo.py. Falls back gracefully if ultralytics or the
weights file isn't available; callers should prefer stub_detector.py
until a real trained model exists.
"""
from typing import Callable, List, Optional

import cv2

from src.pipeline.schemas import BoundingBox, DetectionFrame

_CLASS_NAMES = {0: "wheelchair", 1: "wheel"}


def detect_frames(
    video_path: str,
    weights_path: str,
    progress_callback: Optional[Callable[[int], None]] = None,
    confidence: float = 0.4,
    frame_stride: int = 2,
) -> List[DetectionFrame]:
    from ultralytics import YOLO

    model = YOLO(weights_path)

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    frames: List[DetectionFrame] = []
    frame_idx = 0
    last_boxes: List[BoundingBox] = []
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Wheel/wheelchair boxes feed rim-angle tracking, which is more
        # motion-sensitive than the stock detector's centroid-only use —
        # stride kept lower (every 2nd frame) to preserve rim-angle accuracy.
        if frame_idx % frame_stride == 0:
            results = model(frame, conf=confidence, imgsz=480, verbose=False)
            boxes: List[BoundingBox] = []
            for box in results[0].boxes:
                conf = float(box.conf[0])
                if conf < confidence:
                    continue
                cls_id = int(box.cls[0])
                class_name = _CLASS_NAMES.get(cls_id)
                if class_name is None:
                    continue
                x1, y1, x2, y2 = [float(v) for v in box.xyxy[0]]
                boxes.append(BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2, confidence=conf, class_name=class_name))
            last_boxes = boxes
        else:
            boxes = last_boxes

        frames.append(DetectionFrame(
            frame_idx=frame_idx,
            timestamp_sec=frame_idx / fps,
            boxes=boxes,
        ))

        frame_idx += 1
        if progress_callback and frame_idx % 100 == 0:
            progress_callback(int(100 * frame_idx / max(total_frames, 1)))

    cap.release()
    return frames
