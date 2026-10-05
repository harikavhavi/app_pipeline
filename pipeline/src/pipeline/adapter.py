"""
Adapter — converts the new ExtractedFeatures/ScoreResult pipeline output into
the metric_cards / feedback / ai_log shape the existing mobile app already
expects from api.py's /analyse endpoint. Not part of the spec — this is the
glue that lets the new pipeline drop in without any frontend changes.
"""
from typing import List, Optional

from src.pipeline.schemas import ExtractedFeatures, ScoreResult
from src.scoring.scorer import SPORT_REFERENCES, _DEFAULT_SPORT, _normalize

_MOTION_PILLAR = "Motion & Kinematics"
_POSE_PILLAR = "Body Pose & Form"
_TIMING_PILLAR = "Timing & Responsiveness"
_FATIGUE_PILLAR = "Fatigue & Risk"


def _card(card_id: str, pillar: str, label: str, value, unit: Optional[str],
          score: Optional[float] = None, higher_is_better: Optional[bool] = None) -> dict:
    return {
        "id": card_id,
        "pillar": pillar,
        "label": label,
        "value": value,
        "unit": unit,
        "score": round(score, 1) if score is not None else None,
        "higher_is_better": higher_is_better,
        "trend": None,
        "trend_unit": None,
    }


def _fatigue_score(fatigue_rate_pct: float, elite_fatigue_pct: float) -> float:
    """Lower fatigue rate = better; 0% drop = 100, 2x the elite reference = 0."""
    ceiling = elite_fatigue_pct * 2
    if ceiling <= 0:
        return 0.0
    return max(0.0, min(100.0, (1 - fatigue_rate_pct / ceiling) * 100))


def build_metric_cards(features: ExtractedFeatures, sport: str) -> List[dict]:
    ref = SPORT_REFERENCES.get(sport, SPORT_REFERENCES[_DEFAULT_SPORT])
    m, p, t, f = features.motion, features.pose, features.timing, features.fatigue

    cards = [
        # ── Motion & Kinematics ──────────────────────────────────────────────
        _card("m_avg_speed", _MOTION_PILLAR, "Average Speed", round(m.avg_speed_mps, 2), "m/s",
              _normalize(m.avg_speed_mps, ref["avg_speed"]), True),
        _card("m_peak_speed", _MOTION_PILLAR, "Peak Speed", round(m.peak_speed_mps, 2), "m/s",
              _normalize(m.peak_speed_mps, ref["avg_speed"] * 1.3), True),
        _card("m_avg_accel", _MOTION_PILLAR, "Average Acceleration", round(m.avg_acceleration_mps2, 2), "m/s²",
              None, True),
        _card("m_peak_accel", _MOTION_PILLAR, "Peak Acceleration", round(m.peak_acceleration_mps2, 2), "m/s²",
              None, True),
        _card("m_avg_rim_speed", _MOTION_PILLAR, "Rim Speed (avg)", round(m.avg_rim_speed_mps, 2), "m/s",
              _normalize(m.avg_rim_speed_mps, ref["avg_rim_speed"]), True),
        _card("m_peak_rim_speed", _MOTION_PILLAR, "Rim Speed (peak)", round(m.peak_rim_speed_mps, 2), "m/s",
              None, True),
        _card("m_turning_radius", _MOTION_PILLAR, "Turning Radius", round(m.turning_radius_m, 2), "m",
              None, False),
        _card("m_angular_velocity", _MOTION_PILLAR, "Angular Velocity", round(m.angular_velocity_deg_per_sec, 1), "deg/s",
              None, None),
        _card("m_braking_rate", _MOTION_PILLAR, "Braking Rate", round(m.braking_rate_mps2, 2), "m/s²",
              None, True),

        # ── Body Pose & Form ─────────────────────────────────────────────────
        _card("p_symmetry", _POSE_PILLAR, "Push Symmetry", round(p.push_symmetry_pct, 1), "%",
              p.push_symmetry_pct, True),
        _card("p_trunk_rotation", _POSE_PILLAR, "Trunk Rotation", round(p.trunk_rotation_deg, 1), "deg",
              None, False),
        _card("p_shoulder_diff", _POSE_PILLAR, "Shoulder Height Diff", round(p.avg_shoulder_height_diff_px, 1), "px",
              None, False),
        _card("p_wrist_range", _POSE_PILLAR, "Wrist Angle Range", round(p.wrist_angle_range_deg, 1), "deg",
              None, None),
        _card("p_posture", _POSE_PILLAR, "Posture Score", round(p.posture_score, 1), None,
              p.posture_score, True),
        _card("p_left_arc", _POSE_PILLAR, "Left Arm Arc", round(p.left_arm_arc_deg, 1), "deg",
              None, None),
        _card("p_right_arc", _POSE_PILLAR, "Right Arm Arc", round(p.right_arm_arc_deg, 1), "deg",
              None, None),

        # ── Timing & Responsiveness ─────────────────────────────────────────
        _card("t_cadence", _TIMING_PILLAR, "Push Cadence", round(t.cadence_pushes_per_min, 1), "/min",
              _normalize(t.cadence_pushes_per_min, ref["cadence"]), True),
        _card("t_stroke_consistency", _TIMING_PILLAR, "Stroke Consistency (DTW)", round(t.stroke_consistency_dtw, 1), None,
              None, False),
        _card("t_contact_arc", _TIMING_PILLAR, "Contact Arc", round(t.contact_arc_deg, 1), "deg",
              None, None),
        _card("t_push_duration", _TIMING_PILLAR, "Push Duration (avg)", round(t.avg_push_duration_sec, 2), "s",
              None, None),
        _card("t_coast_duration", _TIMING_PILLAR, "Coast Duration (avg)", round(t.avg_coast_duration_sec, 2), "s",
              None, None),
        _card("t_push_coast_ratio", _TIMING_PILLAR, "Push-to-Coast Ratio", round(t.push_to_coast_ratio, 2), None,
              None, None),

        # ── Fatigue & Risk ───────────────────────────────────────────────────
        _card("f_fatigue_rate", _FATIGUE_PILLAR, "Fatigue Rate", round(f.fatigue_rate_pct, 1), "%",
              _fatigue_score(f.fatigue_rate_pct, ref["fatigue"]), False),
        _card("f_speed_variance", _FATIGUE_PILLAR, "Speed Variance", round(f.speed_variance, 3), None,
              None, False),
        _card("f_shoulder_accel", _FATIGUE_PILLAR, "Shoulder Acceleration", round(f.shoulder_acceleration_avg, 1), "px/s²",
              None, False),
        _card("p12_rsi_score", _FATIGUE_PILLAR, "RSI Index", round(f.rsi_score, 1), None,
              max(0.0, 100 - f.rsi_score), False),
        _card("p12_rsi_risk_level", _FATIGUE_PILLAR, "Injury Risk Level", f.rsi_level, None,
              None, None),
        _card("f_asymmetry_flag", _FATIGUE_PILLAR, "Asymmetry Flag", f.asymmetry_flag, None, None, None),
        _card("f_overrotation_flag", _FATIGUE_PILLAR, "Overrotation Flag", f.overrotation_flag, None, None, None),
        _card("f_endurance_flag", _FATIGUE_PILLAR, "Endurance Flag", f.endurance_flag, None, None, None),
    ]

    return cards


def _athlete_feedback(score: ScoreResult) -> str:
    """Deterministic fallback for the athlete-facing feedback field when no
    GEMINI_API_KEY is configured — same underlying data (recommendations,
    injury_flags) as coach_feedback, just addressed directly to the athlete
    in second person with risk flags called out explicitly."""
    parts = [f"You scored {score.overall_score}/100 (grade {score.letter_grade}) this session."]
    if score.injury_flags:
        parts.append(
            "Risk flags to watch: " + ", ".join(f.replace("_", " ") for f in score.injury_flags) + "."
        )
    if score.recommendations:
        parts.append("To improve: " + " ".join(score.recommendations))
    else:
        parts.append("No specific technique concerns were flagged this session — keep it up.")
    return " ".join(parts)


def build_feedback(score: ScoreResult) -> dict:
    scout_feedback = (
        f"Overall grade {score.letter_grade} ({score.overall_score}/100). " +
        " ".join(score.highlights)
    )
    coach_feedback = " ".join(score.recommendations) if score.recommendations else "No specific technique concerns flagged this session."
    athlete_feedback = _athlete_feedback(score)

    ai_log = [{"msg": flag, "type": "warn"} for flag in score.injury_flags]
    ai_log.append({
        "msg": f"Session scored {score.overall_score}/100 ({score.letter_grade}).",
        "type": "good" if score.overall_score >= 70 else "warn",
    })

    return {
        "scout_feedback": scout_feedback,
        "coach_feedback": coach_feedback,
        "athlete_feedback": athlete_feedback,
        "ai_log": ai_log,
    }
