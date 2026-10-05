"""
Interim detector using the stock COCO-pretrained YOLOv8n weights
(pipeline/models/yolov8n.pt) as a proxy for wheelchair-athlete position,
for use until a custom wheelchair/wheel model is trained.

COCO class 0 ("person") is remapped to class_name="wheelchair" so the
downstream centroid tracker and feature extractors work unchanged — this
gives a REAL moving centroid (unlike stub_detector.py's frozen box), so
speed/acceleration reflect actual motion in the video.

Important limitation: COCO has no "wheel"/"bicycle wheel" class, so no
wheel boxes are ever produced here. That means:
  - Rim speed, cadence, and other rim-angle-derived metrics stay at 0 —
    those need a real wheel detector.
  - The pixel-to-meter scale can't be calibrated from a detected wheel
    diameter, so kalman_smoother falls back to its frame-width heuristic.
    Speed/acceleration will be real and relatively meaningful (faster
    segments read faster) but the absolute m/s number is an approximation,
    not a calibrated measurement.
"""
from typing import Callable, List, Optional

import cv2

from src.pipeline.schemas import BoundingBox, DetectionFrame

_PERSON_CLASS_ID = 0


def detect_frames(
    video_path: str,
    weights_path: str,
    progress_callback: Optional[Callable[[int], None]] = None,
    confidence: float = 0.4,
    frame_stride: int = 3,
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

        # Person position moves little frame-to-frame at video fps, so only
        # every `frame_stride`-th frame actually runs YOLO — the frames in
        # between hold the last detected box. Cuts inference calls ~3x with
        # negligible impact on the smoothed trajectory.
        if frame_idx % frame_stride == 0:
            results = model(frame, conf=confidence, classes=[_PERSON_CLASS_ID], imgsz=480, verbose=False)
            boxes: List[BoundingBox] = []
            for box in results[0].boxes:
                conf = float(box.conf[0])
                if conf < confidence:
                    continue
                x1, y1, x2, y2 = [float(v) for v in box.xyxy[0]]
                # Remapped to "wheelchair" — see module docstring.
                boxes.append(BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2, confidence=conf, class_name="wheelchair"))
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
