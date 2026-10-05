"""
MediaPipe BlazePose extraction — spec §4.1.
"""
from typing import Callable, List, Optional

import cv2

from src.pipeline.schemas import BLAZEPOSE_LANDMARK_NAMES, Keypoint, PoseFrame

try:
    import mediapipe as mp
    _MEDIAPIPE_AVAILABLE = True
except ImportError:
    _MEDIAPIPE_AVAILABLE = False

VISIBILITY_THRESHOLD = 0.5


def extract_pose_frames(
    video_path: str,
    progress_callback: Optional[Callable[[int], None]] = None,
) -> List[PoseFrame]:
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    pose_frames: List[PoseFrame] = []

    if not _MEDIAPIPE_AVAILABLE:
        # Fallback: no landmarks detected for any frame — downstream stages
        # treat this the same as a low-visibility session.
        frame_idx = 0
        while True:
            ret, _ = cap.read()
            if not ret:
                break
            pose_frames.append(PoseFrame(
                frame_idx=frame_idx,
                timestamp_sec=frame_idx / fps,
                keypoints={name: None for name in BLAZEPOSE_LANDMARK_NAMES},
            ))
            frame_idx += 1
            if progress_callback and frame_idx % 100 == 0:
                progress_callback(int(100 * frame_idx / max(total_frames, 1)))
        cap.release()
        return pose_frames

    mp_pose = mp.solutions.pose
    with mp_pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        smooth_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) as pose:
        frame_idx = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(rgb)

            keypoints = {name: None for name in BLAZEPOSE_LANDMARK_NAMES}
            if results.pose_landmarks:
                for idx, landmark in enumerate(results.pose_landmarks.landmark):
                    if idx >= len(BLAZEPOSE_LANDMARK_NAMES):
                        break
                    if landmark.visibility >= VISIBILITY_THRESHOLD:
                        keypoints[BLAZEPOSE_LANDMARK_NAMES[idx]] = Keypoint(
                            x=landmark.x, y=landmark.y, z=landmark.z,
                            visibility=landmark.visibility,
                        )

            pose_frames.append(PoseFrame(
                frame_idx=frame_idx,
                timestamp_sec=frame_idx / fps,
                keypoints=keypoints,
            ))

            frame_idx += 1
            if progress_callback and frame_idx % 100 == 0:
                progress_callback(int(100 * frame_idx / max(total_frames, 1)))

    cap.release()
    return pose_frames
