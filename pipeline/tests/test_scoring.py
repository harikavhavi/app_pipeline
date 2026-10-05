from src.pipeline.schemas import (
    AthleteMetadata, BodyPoseFormFeatures, ExtractedFeatures, FatigueRiskFeatures,
    MotionKinematicsFeatures, TimingResponsivenessFeatures,
)
from src.scoring.scorer import compute_score


def _athlete():
    return AthleteMetadata(name="Test Athlete", sport="wheelchair_basketball", disability_class="Class 3")


def _features(**overrides) -> ExtractedFeatures:
    motion = MotionKinematicsFeatures(
        avg_speed_mps=4.5, peak_speed_mps=5.5, avg_acceleration_mps2=2.0, peak_acceleration_mps2=3.0,
        avg_rim_speed_mps=5.5, peak_rim_speed_mps=6.5, turning_radius_m=0.8,
        angular_velocity_deg_per_sec=60, braking_rate_mps2=2.5,
    )
    pose = BodyPoseFormFeatures(
        push_symmetry_pct=95, trunk_rotation_deg=5, avg_shoulder_height_diff_px=5,
        wrist_angle_range_deg=40, posture_score=95, left_arm_arc_deg=60, right_arm_arc_deg=60,
    )
    timing = TimingResponsivenessFeatures(
        cadence_pushes_per_min=85, cadence_hz=1.4, stroke_consistency_dtw=5, contact_arc_deg=30,
        avg_push_duration_sec=0.3, avg_coast_duration_sec=0.3, push_to_coast_ratio=0.5,
    )
    fatigue = FatigueRiskFeatures(
        fatigue_rate_pct=2, speed_variance=0.05, rsi_score=10, rsi_level="LOW",
        shoulder_acceleration_avg=10, asymmetry_flag=False, overrotation_flag=False, endurance_flag=False,
    )
    base = ExtractedFeatures(
        motion=motion, pose=pose, timing=timing, fatigue=fatigue,
        session_duration_sec=300, total_frames_processed=9000, wheel_radius_cm=30,
    )
    return base.model_copy(update=overrides) if overrides else base


def test_perfect_features_score_high_grade():
    result = compute_score(_features(), _athlete())
    assert result.letter_grade in ("A+", "A")
    assert result.overall_score >= 88


def test_high_rsi_produces_injury_flag():
    fatigue = FatigueRiskFeatures(
        fatigue_rate_pct=25, speed_variance=0.4, rsi_score=75, rsi_level="HIGH",
        shoulder_acceleration_avg=80, asymmetry_flag=True, overrotation_flag=True, endurance_flag=True,
    )
    features = _features(fatigue=fatigue)
    result = compute_score(features, _athlete())
    assert any("shoulder strain" in f for f in result.injury_flags)
    assert len(result.injury_flags) >= 3


def test_low_risk_inputs_have_no_injury_flags():
    result = compute_score(_features(), _athlete())
    assert result.injury_flags == []
