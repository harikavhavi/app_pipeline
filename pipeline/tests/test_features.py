import math

from src.features.body_pose_form import extract_body_pose_form
from src.features.fatigue_risk import extract_fatigue_risk
from src.features.motion_kinematics import extract_motion_kinematics
from src.features.timing_responsiveness import extract_timing_responsiveness
from src.pipeline.schemas import ChairTrajectoryPoint, Keypoint, PoseFrame, RimAngle


def test_motion_kinematics_plausible_avg_speed():
    trajectory = []
    for i in range(50):
        t = i / 30
        trajectory.append(ChairTrajectoryPoint(
            frame_idx=i, timestamp_sec=t,
            raw_x=i * 5.0, raw_y=0.0, smoothed_x=i * 5.0, smoothed_y=0.0,
            velocity_x=150.0, velocity_y=0.0, speed_mps=3.0,
        ))
    rim_angles = [RimAngle(frame_idx=i, timestamp_sec=i / 30, angle_deg=i * 10.0) for i in range(50)]

    features = extract_motion_kinematics(trajectory, rim_angles, wheel_radius_cm=30)
    assert 0 < features.avg_speed_mps < 10


def test_timing_cadence_matches_known_frequency():
    # Build a 1 Hz sinusoidal rim-angle signal over 5 seconds at 30 Hz sampling.
    fps = 30
    duration = 5
    rim_angles = []
    for i in range(fps * duration):
        t = i / fps
        angle = 50 * math.sin(2 * math.pi * 1.0 * t) + t * 20  # net forward drift + oscillation
        rim_angles.append(RimAngle(frame_idx=i, timestamp_sec=t, angle_deg=angle))

    features = extract_timing_responsiveness(rim_angles)
    assert 0.5 <= features.cadence_hz <= 1.5


def _symmetric_pose_frames(n=20):
    frames = []
    for i in range(n):
        sway = 0.05 * math.sin(i / 3)
        kp = {
            "LEFT_SHOULDER":  Keypoint(x=0.4, y=0.3, z=0, visibility=0.9),
            "RIGHT_SHOULDER": Keypoint(x=0.6, y=0.3, z=0, visibility=0.9),
            "LEFT_ELBOW":     Keypoint(x=0.4 + sway, y=0.5, z=0, visibility=0.9),
            "RIGHT_ELBOW":    Keypoint(x=0.6 - sway, y=0.5, z=0, visibility=0.9),
            "LEFT_WRIST":     Keypoint(x=0.4, y=0.7, z=0, visibility=0.9),
            "RIGHT_WRIST":    Keypoint(x=0.6, y=0.7, z=0, visibility=0.9),
        }
        frames.append(PoseFrame(frame_idx=i, timestamp_sec=i / 30, keypoints=kp))
    return frames


def test_symmetric_pose_gives_high_symmetry():
    frames = _symmetric_pose_frames()
    features = extract_body_pose_form(frames, frame_width_px=640, frame_height_px=480)
    assert features.push_symmetry_pct > 90


def test_fatigue_flag_when_speed_drops():
    trajectory = []
    n = 60
    for i in range(n):
        t = i * 6  # 6 seconds apart -> 360s total session
        speed = 4.0 if t < 180 else 3.0  # 25% drop in the back half
        trajectory.append(ChairTrajectoryPoint(
            frame_idx=i, timestamp_sec=t, raw_x=0, raw_y=0, smoothed_x=0, smoothed_y=0,
            velocity_x=0, velocity_y=0, speed_mps=speed,
        ))

    features = extract_fatigue_risk(trajectory, [], push_symmetry_pct=90, trunk_rotation_deg=10)
    assert features.fatigue_rate_pct > 15
    assert features.endurance_flag is True
