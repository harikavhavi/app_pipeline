import os

import cv2
import numpy as np
import pytest

from src.detection.stub_detector import detect_frames_stub
from src.pipeline.schemas import DetectionFrame

SYNTHETIC_VIDEO = os.path.join(os.path.dirname(__file__), "_fixtures", "synthetic_detect.mp4")


@pytest.fixture(scope="module")
def synthetic_video():
    os.makedirs(os.path.dirname(SYNTHETIC_VIDEO), exist_ok=True)
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(SYNTHETIC_VIDEO, fourcc, 10, (320, 240))
    for _ in range(20):
        writer.write(np.full((240, 320, 3), 50, dtype=np.uint8))
    writer.release()
    yield SYNTHETIC_VIDEO


def test_stub_returns_detection_per_frame(synthetic_video):
    frames = detect_frames_stub(synthetic_video)
    assert len(frames) == 20
    assert all(isinstance(f, DetectionFrame) for f in frames)


def test_stub_boxes_have_expected_classes(synthetic_video):
    frames = detect_frames_stub(synthetic_video)
    for f in frames:
        assert len(f.boxes) >= 1
        class_names = {b.class_name for b in f.boxes}
        assert class_names.issubset({"wheelchair", "wheel"})


def test_yolo_detector_importable():
    # Only checks the module + real-weights code path is importable; actual
    # inference requires trained weights which aren't part of this repo yet.
    from src.detection import yolo_detector  # noqa: F401
