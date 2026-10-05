"""
Video utility functions: frame decoding, FPS, resolution normalization.
"""
import cv2
import numpy as np
from typing import Generator, Tuple


def open_video(path: str) -> cv2.VideoCapture:
    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        raise IOError(f"Cannot open video: {path}")
    return cap


def get_video_meta(path: str) -> dict:
    """Returns dict with fps, width, height, total_frames, duration_sec."""
    cap = open_video(path)
    fps          = cap.get(cv2.CAP_PROP_FPS) or 30.0
    width        = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height       = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    cap.release()
    return {
        "fps":          fps,
        "width":        width,
        "height":       height,
        "total_frames": total_frames,
        "duration_sec": total_frames / fps if fps > 0 else 0,
        "resolution":   f"{width}x{height}",
    }


def frame_generator(path: str,
                    target_fps: float = 30.0,
                    max_dim: int = 720) -> Generator[Tuple[int, np.ndarray], None, None]:
    """
    Yields (frame_index, frame_bgr) tuples at target_fps.
    Resizes frames so the longest dimension ≤ max_dim.
    """
    cap = open_video(path)
    src_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    stride  = max(1, round(src_fps / target_fps))

    frame_idx = 0
    out_idx   = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_idx % stride == 0:
            frame = resize_frame(frame, max_dim)
            yield out_idx, frame
            out_idx += 1
        frame_idx += 1
    cap.release()


def resize_frame(frame: np.ndarray, max_dim: int = 720) -> np.ndarray:
    """Resize frame so longest side ≤ max_dim, preserving aspect ratio."""
    h, w = frame.shape[:2]
    longest = max(h, w)
    if longest <= max_dim:
        return frame
    scale = max_dim / longest
    new_w = int(w * scale)
    new_h = int(h * scale)
    return cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_AREA)


def frames_to_rgb(frame_bgr: np.ndarray) -> np.ndarray:
    """Convert BGR OpenCV frame to RGB (for MediaPipe)."""
    return cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
