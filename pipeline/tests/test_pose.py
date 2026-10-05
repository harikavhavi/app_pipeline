import os

import cv2
import numpy as np
import pytest

from src.pose.blazepose import extract_pose_frames
from src.pipeline.schemas import PoseFrame

SYNTHETIC_VIDEO = os.path.join(os.path.dirname(__file__), "_fixtures", "synthetic.mp4")


def _make_synthetic_video(path: str, seconds: int = 2, fps: int = 10, size=(320, 240)):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(path, fourcc, fps, size)
    for i in range(seconds * fps):
        frame = np.full((size[1], size[0], 3), 40, dtype=np.uint8)
        cv2.circle(frame, (size[0] // 2, size[1] // 2), 30, (200, 200, 200), -1)
        writer.write(frame)
    writer.release()


@pytest.fixture(scope="module")
def synthetic_video():
    _make_synthetic_video(SYNTHETIC_VIDEO)
    yield SYNTHETIC_VIDEO


def test_returns_pose_frame_list(synthetic_video):
    frames = extract_pose_frames(synthetic_video)
    assert isinstance(frames, list)
    assert all(isinstance(f, PoseFrame) for f in frames)
    assert len(frames) > 0


def test_low_visibility_keypoints_are_none(synthetic_video):
    frames = extract_pose_frames(synthetic_video)
    # A synthetic video with no real body will yield no confident landmarks.
    for f in frames:
        for kp in f.keypoints.values():
            if kp is not None:
                assert kp.visibility >= 0.5


def test_valid_keypoints_in_range(synthetic_video):
    frames = extract_pose_frames(synthetic_video)
    for f in frames:
        for kp in f.keypoints.values():
            if kp is not None:
                assert 0.0 <= kp.x <= 1.0
                assert 0.0 <= kp.y <= 1.0
