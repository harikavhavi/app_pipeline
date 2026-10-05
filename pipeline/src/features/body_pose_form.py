"""
METRIC CATEGORY 2: Body Pose and Form — spec §4.6.
"""
import math
from typing import List, Optional

import numpy as np

from src.pipeline.schemas import BodyPoseFormFeatures, PoseFrame


def _arm_swing_angle(shoulder, elbow) -> float:
    """Angle (deg) between the shoulder→elbow vector and vertical."""
    dx = elbow.x - shoulder.x
    dy = elbow.y - shoulder.y
    return math.degrees(math.atan2(dx, dy))  # 0 = straight down


def extract_body_pose_form(
    pose_frames: List[PoseFrame],
    frame_width_px: int,
    frame_height_px: int,
) -> BodyPoseFormFeatures:
    if not pose_frames:
        return BodyPoseFormFeatures(
            push_symmetry_pct=0, trunk_rotation_deg=0, avg_shoulder_height_diff_px=0,
            wrist_angle_range_deg=0, posture_score=0, left_arm_arc_deg=0, right_arm_arc_deg=0,
        )

    left_swing_angles: List[float] = []
    right_swing_angles: List[float] = []
    trunk_angles: List[float] = []
    shoulder_diffs: List[float] = []
    left_wrist_angles: List[float] = []
    right_wrist_angles: List[float] = []

    for frame in pose_frames:
        kp = frame.keypoints
        l_sh, r_sh = kp.get("LEFT_SHOULDER"), kp.get("RIGHT_SHOULDER")
        l_el, r_el = kp.get("LEFT_ELBOW"), kp.get("RIGHT_ELBOW")
        l_wr, r_wr = kp.get("LEFT_WRIST"), kp.get("RIGHT_WRIST")
        l_idx, r_idx = kp.get("LEFT_INDEX"), kp.get("RIGHT_INDEX")

        if l_sh and l_el:
            left_swing_angles.append(_arm_swing_angle(l_sh, l_el))
        if r_sh and r_el:
            right_swing_angles.append(_arm_swing_angle(r_sh, r_el))

        if l_sh and r_sh:
            px_l = (l_sh.x * frame_width_px, l_sh.y * frame_height_px)
            px_r = (r_sh.x * frame_width_px, r_sh.y * frame_height_px)
            angle = math.degrees(math.atan2(px_r[1] - px_l[1], px_r[0] - px_l[0]))
            trunk_angles.append(angle)
            shoulder_diffs.append(abs(px_l[1] - px_r[1]))

        if l_wr and l_el and l_sh:
            ref = l_idx if l_idx else None
            if ref:
                v1 = np.array([l_el.x - l_wr.x, l_el.y - l_wr.y])
                v2 = np.array([ref.x - l_wr.x, ref.y - l_wr.y])
            else:
                v1 = np.array([l_el.x - l_wr.x, l_el.y - l_wr.y])
                v2 = np.array([0, -1])  # vertical reference
            left_wrist_angles.append(_angle_between(v1, v2))

        if r_wr and r_el and r_sh:
            ref = r_idx if r_idx else None
            if ref:
                v1 = np.array([r_el.x - r_wr.x, r_el.y - r_wr.y])
                v2 = np.array([ref.x - r_wr.x, ref.y - r_wr.y])
            else:
                v1 = np.array([r_el.x - r_wr.x, r_el.y - r_wr.y])
                v2 = np.array([0, -1])
            right_wrist_angles.append(_angle_between(v1, v2))

    # ── push symmetry ────────────────────────────────────────────────────────
    left_arc = _sweep_arc(left_swing_angles)
    right_arc = _sweep_arc(right_swing_angles)
    max_arc = max(left_arc, right_arc)
    symmetry_pct = (1 - abs(left_arc - right_arc) / max_arc) * 100 if max_arc > 0 else 100.0

    # ── trunk rotation & shoulder symmetry ──────────────────────────────────
    trunk_rotation_deg = float(np.mean(np.abs(trunk_angles))) if trunk_angles else 0.0
    avg_shoulder_height_diff_px = float(np.mean(shoulder_diffs)) if shoulder_diffs else 0.0

    # ── wrist angle range ────────────────────────────────────────────────────
    left_range = (max(left_wrist_angles) - min(left_wrist_angles)) if left_wrist_angles else 0.0
    right_range = (max(right_wrist_angles) - min(right_wrist_angles)) if right_wrist_angles else 0.0
    wrist_angle_range_deg = float((left_range + right_range) / 2) if (left_wrist_angles or right_wrist_angles) else 0.0

    # ── posture score ────────────────────────────────────────────────────────
    trunk_component = max(0.0, 100 - trunk_rotation_deg * 3)
    shoulder_component = 100 - min(100.0, avg_shoulder_height_diff_px * 0.5)
    posture_score = trunk_component * 0.6 + shoulder_component * 0.4

    return BodyPoseFormFeatures(
        push_symmetry_pct=float(symmetry_pct),
        trunk_rotation_deg=trunk_rotation_deg,
        avg_shoulder_height_diff_px=avg_shoulder_height_diff_px,
        wrist_angle_range_deg=wrist_angle_range_deg,
        posture_score=float(posture_score),
        left_arm_arc_deg=float(left_arc),
        right_arm_arc_deg=float(right_arc),
    )


def _sweep_arc(angles: List[float]) -> float:
    if not angles:
        return 0.0
    return float(max(angles) - min(angles))


def _angle_between(v1: np.ndarray, v2: np.ndarray) -> float:
    n1, n2 = np.linalg.norm(v1), np.linalg.norm(v2)
    if n1 == 0 or n2 == 0:
        return 0.0
    cos_theta = np.clip(np.dot(v1, v2) / (n1 * n2), -1.0, 1.0)
    return float(math.degrees(math.acos(cos_theta)))
