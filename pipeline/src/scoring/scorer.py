"""
Scoring module — spec §4.7.
Hard rule: must not import cv2, mediapipe, or ultralytics. Only math, features, schemas.
"""
from typing import Dict

from src.pipeline.schemas import AthleteMetadata, ExtractedFeatures, ScoreResult

SPORT_REFERENCES: Dict[str, Dict[str, float]] = {
    # Keys match the `id`s in app/constants/sports.ts exactly — that's what
    # the frontend actually sends as the `sport` form field.
    "wheelchair_basketball": {
        "avg_speed": 4.0, "avg_rim_speed": 5.0, "cadence": 80,
        "push_symmetry": 90, "fatigue": 5,
    },
    "wheelchair_tennis": {
        "avg_speed": 3.5, "avg_rim_speed": 4.5, "cadence": 70,
        "push_symmetry": 92, "fatigue": 6,
    },
    "wheelchair_badminton": {
        "avg_speed": 3.5, "avg_rim_speed": 4.5, "cadence": 85,
        "push_symmetry": 92, "fatigue": 6,
    },
    "para_athletics": {  # racing
        "avg_speed": 6.0, "avg_rim_speed": 8.0, "cadence": 100,
        "push_symmetry": 95, "fatigue": 3,
    },
    "wheelchair_table_tennis": {
        "avg_speed": 2.5, "avg_rim_speed": 3.5, "cadence": 65,
        "push_symmetry": 90, "fatigue": 5,
    },
    "para_cricket": {
        "avg_speed": 3.0, "avg_rim_speed": 4.0, "cadence": 60,
        "push_symmetry": 88, "fatigue": 8,
    },
}
_DEFAULT_SPORT = "wheelchair_basketball"

_GRADE_BANDS = [
    (93, "A+"), (88, "A"), (83, "A-"), (78, "B+"), (73, "B"), (68, "B-"),
    (63, "C+"), (58, "C"), (53, "C-"), (45, "D"), (0, "F"),
]


def _normalize(value: float, elite: float) -> float:
    """0 at zero, 100 at/above elite, linear in between."""
    if elite <= 0:
        return 0.0
    return max(0.0, min(100.0, (value / elite) * 100))


def _letter_grade(score: float) -> str:
    for threshold, grade in _GRADE_BANDS:
        if score >= threshold:
            return grade
    return "F"


def compute_score(features: ExtractedFeatures, athlete: AthleteMetadata) -> ScoreResult:
    ref = SPORT_REFERENCES.get(athlete.sport, SPORT_REFERENCES[_DEFAULT_SPORT])

    motion = features.motion
    pose = features.pose
    timing = features.timing
    fatigue = features.fatigue

    # ── motion score ─────────────────────────────────────────────────────────
    avg_speed_n = _normalize(motion.avg_speed_mps, ref["avg_speed"])
    avg_rim_speed_n = _normalize(motion.avg_rim_speed_mps, ref["avg_rim_speed"])
    peak_speed_n = _normalize(motion.peak_speed_mps, ref["avg_speed"] * 1.3)
    turning_n = max(0.0, min(100.0, (1 - motion.turning_radius_m / 3.0) * 100))
    braking_n = max(0.0, min(100.0, (motion.braking_rate_mps2 / 3.0) * 100))

    motion_score = (
        avg_speed_n * 0.25 + avg_rim_speed_n * 0.25 + peak_speed_n * 0.20
        + turning_n * 0.15 + braking_n * 0.15
    )

    # ── pose score ────────────────────────────────────────────────────────────
    symmetry_n = pose.push_symmetry_pct
    posture_n = pose.posture_score
    max_arc = max(pose.left_arm_arc_deg, pose.right_arm_arc_deg)
    arc_symmetry_n = (1 - abs(pose.left_arm_arc_deg - pose.right_arm_arc_deg) / max_arc) * 100 if max_arc > 0 else 100.0

    pose_score = symmetry_n * 0.40 + posture_n * 0.30 + arc_symmetry_n * 0.30

    # ── timing score ──────────────────────────────────────────────────────────
    cadence_n = _normalize(timing.cadence_pushes_per_min, ref["cadence"])
    consistency_n = max(0.0, min(100.0, (1 - timing.stroke_consistency_dtw / 100) * 100))
    ratio_n = max(0.0, min(100.0, (1 - abs(timing.push_to_coast_ratio - 0.5) / 0.5) * 100))

    timing_score = cadence_n * 0.40 + consistency_n * 0.40 + ratio_n * 0.20

    # ── risk score (higher = more risk) ─────────────────────────────────────
    fatigue_risk_n = max(0.0, min(100.0, (fatigue.fatigue_rate_pct / 30) * 100))
    variance_n = max(0.0, min(100.0, fatigue.speed_variance * 100))

    risk_score = fatigue.rsi_score * 0.50 + fatigue_risk_n * 0.30 + variance_n * 0.20

    overall_score = (
        motion_score * 0.30 + pose_score * 0.25 + timing_score * 0.25 + (100 - risk_score) * 0.20
    )

    injury_flags = []
    if fatigue.rsi_level == "HIGH":
        injury_flags.append("High shoulder strain risk — consider reducing session intensity")
    elif fatigue.rsi_level == "MEDIUM":
        injury_flags.append("Moderate shoulder strain risk — monitor push technique")
    if fatigue.asymmetry_flag:
        injury_flags.append("Push asymmetry detected — right-left imbalance below 70%, check dominant arm compensation")
    if fatigue.overrotation_flag:
        injury_flags.append("Excessive trunk rotation — average exceeds 25 degrees, risk of lower back strain")
    if fatigue.endurance_flag:
        injury_flags.append("Significant fatigue detected — speed dropped more than 20% across session")

    highlights, recommendations = _highlights_and_recommendations(
        motion, pose, timing, fatigue,
        normalized_scores={
            "avg_speed": avg_speed_n, "avg_rim_speed": avg_rim_speed_n,
            "turning_radius": turning_n, "braking": braking_n,
            "push_symmetry": symmetry_n, "posture": posture_n,
            "cadence": cadence_n, "stroke_consistency": consistency_n,
            "fatigue": 100 - fatigue_risk_n,
        },
    )

    return ScoreResult(
        overall_score=round(overall_score, 1),
        letter_grade=_letter_grade(overall_score),
        motion_score=round(motion_score, 1),
        pose_score=round(pose_score, 1),
        timing_score=round(timing_score, 1),
        risk_score=round(risk_score, 1),
        injury_flags=injury_flags,
        highlights=highlights,
        recommendations=recommendations,
        disability_class=athlete.disability_class,
        sport=athlete.sport,
    )


def _highlights_and_recommendations(motion, pose, timing, fatigue, normalized_scores: Dict[str, float]):
    descriptions = {
        "avg_speed": f"Solid average speed of {motion.avg_speed_mps:.1f} m/s",
        "avg_rim_speed": f"Excellent rim speed: {motion.avg_rim_speed_mps:.1f} m/s average",
        "turning_radius": f"Tight turning radius of {motion.turning_radius_m:.1f}m",
        "braking": f"Strong braking control at {motion.braking_rate_mps2:.1f} m/s²",
        "push_symmetry": f"Strong push symmetry: {pose.push_symmetry_pct:.0f}%",
        "posture": f"Good upper-body posture (score {pose.posture_score:.0f}/100)",
        "cadence": f"Consistent push cadence: {timing.cadence_pushes_per_min:.0f} pushes/min",
        "stroke_consistency": f"Consistent stroke pattern: DTW score {timing.stroke_consistency_dtw:.1f}",
        "fatigue": f"Well-maintained pace — only {fatigue.fatigue_rate_pct:.0f}% speed drop over the session",
    }

    problem_descriptions = {
        "avg_speed": f"Build average speed — currently {motion.avg_speed_mps:.1f} m/s",
        "avg_rim_speed": f"Work on rim speed — currently {motion.avg_rim_speed_mps:.1f} m/s",
        "turning_radius": f"Work on turning radius — current {motion.turning_radius_m:.1f}m, target below 1.0m for elite level",
        "braking": f"Improve braking control — deceleration averaging {motion.braking_rate_mps2:.1f} m/s²",
        "push_symmetry": f"Improve push symmetry — currently {pose.push_symmetry_pct:.0f}%, aim for above 85%",
        "posture": f"Work on upper-body posture and trunk control — averaging {pose.trunk_rotation_deg:.0f} degrees rotation",
        "cadence": f"Increase push cadence — currently {timing.cadence_pushes_per_min:.0f} pushes/min",
        "stroke_consistency": "Improve cadence consistency — stroke timing variance is high",
        "fatigue": f"Build endurance — {fatigue.fatigue_rate_pct:.0f}% speed drop over session",
    }

    ranked = sorted(normalized_scores.items(), key=lambda kv: kv[1], reverse=True)
    highlights = [descriptions[name] for name, _ in ranked[:3]]
    recommendations = [problem_descriptions[name] for name, _ in ranked[-3:]][::-1]
    return highlights, recommendations
