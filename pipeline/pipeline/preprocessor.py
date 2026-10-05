"""
Stage 1 — Pre-Processor
- Decode video frames at 30 fps
- ECC-based video stabilization
- Camera angle detection (side / top / angled)
- Pixel→metre scale estimation from wheel detection
"""
import cv2
import numpy as np
from typing import Tuple, List, Optional

from utils.video_utils import frame_generator, get_video_meta, frames_to_rgb


# ─── ECC Video Stabilization ─────────────────────────────────────────────────

def _stabilize_frames(frames: List[np.ndarray],
                      max_iter: int = 50,
                      eps: float = 1e-6) -> List[np.ndarray]:
    """
    Apply ECC (Enhanced Correlation Coefficient) stabilization.
    Aligns each frame to the first frame using rigid motion model.
    Falls back to original frame on any failure.
    """
    if len(frames) < 2:
        return frames

    ref_gray = cv2.cvtColor(frames[0], cv2.COLOR_BGR2GRAY)
    criteria = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, max_iter, eps)
    warp_mode = cv2.MOTION_EUCLIDEAN
    warp_matrix = np.eye(2, 3, dtype=np.float32)

    stabilized = [frames[0]]
    for frame in frames[1:]:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        try:
            _, warp = cv2.findTransformECC(
                ref_gray, gray, warp_matrix.copy(), warp_mode,
                criteria, None, 5
            )
            h, w = frame.shape[:2]
            stable = cv2.warpAffine(frame, warp, (w, h),
                                    flags=cv2.INTER_LINEAR + cv2.WARP_INVERSE_MAP)
            stabilized.append(stable)
        except cv2.error:
            stabilized.append(frame)  # fallback: keep original
    return stabilized


# ─── Camera Angle Detection ───────────────────────────────────────────────────

def detect_camera_angle(frames: List[np.ndarray]) -> str:
    """
    Heuristic camera angle detection using optical flow direction analysis.
    Returns: 'side', 'top', or 'angled'.
    """
    if len(frames) < 10:
        return 'side'

    sample = frames[len(frames) // 2]
    h, w = sample.shape[:2]

    # Compute optical flow on middle 10 frames
    mid = len(frames) // 2
    window = frames[max(0, mid - 5): mid + 5]
    flows_x, flows_y = [], []
    for i in range(len(window) - 1):
        g1 = cv2.cvtColor(window[i],     cv2.COLOR_BGR2GRAY)
        g2 = cv2.cvtColor(window[i + 1], cv2.COLOR_BGR2GRAY)
        flow = cv2.calcOpticalFlowFarneback(
            g1, g2, None, 0.5, 3, 15, 3, 5, 1.2, 0)
        flows_x.append(np.abs(flow[..., 0]).mean())
        flows_y.append(np.abs(flow[..., 1]).mean())

    mean_x = np.mean(flows_x)
    mean_y = np.mean(flows_y)

    ratio = mean_x / (mean_y + 1e-9)
    if ratio > 2.0:
        return 'side'      # mostly horizontal motion → side view
    elif ratio < 0.5:
        return 'top'       # mostly vertical motion → top view
    else:
        return 'angled'


# ─── Main Preprocessor ───────────────────────────────────────────────────────

class Preprocessor:
    """
    Loads and prepares all frames from a video for pipeline stages 2–6.
    """

    TARGET_FPS: float = 30.0
    MAX_DIM: int = 720

    def __init__(self, stabilize: bool = True):
        self.stabilize = stabilize

    def run(self, video_path: str) -> dict:
        """
        Returns:
        {
          'frames':       list of np.ndarray (BGR),
          'fps':          float,
          'width':        int,
          'height':       int,
          'total_frames': int,
          'duration_sec': float,
          'resolution':   str,
          'camera_angle': str,
        }
        """
        meta = get_video_meta(video_path)

        # Collect frames at target FPS
        frames: List[np.ndarray] = []
        for _, frame in frame_generator(video_path,
                                        target_fps=self.TARGET_FPS,
                                        max_dim=self.MAX_DIM):
            frames.append(frame)

        if not frames:
            raise ValueError(f"No frames decoded from: {video_path}")

        # Optional stabilization (skip for very long videos > 600 frames to stay fast)
        if self.stabilize and len(frames) <= 600:
            frames = _stabilize_frames(frames)

        camera_angle = detect_camera_angle(frames)

        h, w = frames[0].shape[:2]

        return {
            "frames":       frames,
            "fps":          self.TARGET_FPS,
            "width":        w,
            "height":       h,
            "total_frames": len(frames),
            "duration_sec": len(frames) / self.TARGET_FPS,
            "resolution":   f"{w}x{h}",
            "camera_angle": camera_angle,
        }
