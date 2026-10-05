"""
Wheelchair centroid extraction from detection frames — spec §4.5.
"""
from typing import List, Tuple

from src.pipeline.schemas import DetectionFrame


def compute_centroids(detection_frames: List[DetectionFrame]) -> List[Tuple[int, float, float, float]]:
    centroids: List[Tuple[int, float, float, float]] = []
    last_xy = None

    for det_frame in detection_frames:
        chair_boxes = [b for b in det_frame.boxes if b.class_name == "wheelchair"]

        if not chair_boxes:
            if last_xy is not None:
                cx, cy = last_xy
                centroids.append((det_frame.frame_idx, det_frame.timestamp_sec, cx, cy))
            continue

        box = max(chair_boxes, key=lambda b: b.confidence)
        cx = (box.x1 + box.x2) / 2.0
        cy = (box.y1 + box.y2) / 2.0
        last_xy = (cx, cy)
        centroids.append((det_frame.frame_idx, det_frame.timestamp_sec, cx, cy))

    return centroids
