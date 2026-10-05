# -*- coding: utf-8 -*-
"""
seed_db.py - ParaSync 2.0 database seeder
==========================================
Wipes all existing data and seeds:
  - 26 para-athlete profiles + User accounts
  - 12 coach User accounts
  - 6 scout User accounts
  - 5 analysis sessions per athlete (130 total)
  - Scout <-> athlete connections (realistic many-to-many)
  - Coach <-> athlete connections
  - Training assignments
  - Scout notes / watchlist entries
  - Notifications

Run from the pipeline/ directory:
    python seed_db.py
"""

import json
import random
import uuid
import os
import sys
from datetime import datetime, timezone, timedelta

# Make sure we can import database models
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import (
    Base, engine, SessionLocal,
    Athlete, User, AthleteCoach, AthleteScout,
    AnalysisSession, TrainingAssignment, Watchlist, ScoutNote, Notification,
)

# Import the REAL password hasher from database.py so stored hashes
# are identical to what verify_password() expects at login time.
import importlib, types
_db_mod = importlib.import_module("database")
_hash_password = getattr(_db_mod, "_hash_password")  # pbkdf2_hmac, 100_000 rounds

# ─── Helpers ──────────────────────────────────────────────────────────────────

def make_id(): return str(uuid.uuid4())

def days_ago(n: int) -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=n)

def iso_date(d: datetime) -> str:
    return d.strftime("%Y-%m-%d")

# ─── Seed constants ───────────────────────────────────────────────────────────

DEFAULT_PASSWORD = "12345678"

SPORTS = [
    "wheelchair_basketball", "wheelchair_tennis", "para_athletics",
    "wheelchair_badminton", "para_swimming", "boccia",
]

IPC_CLASSES = {
    "wheelchair_basketball": ["Class 1", "Class 2", "Class 3", "Class 4"],
    "wheelchair_tennis":     ["Class 1", "Class 2"],
    "para_athletics":        ["T51", "T52", "T53", "T54"],
    "wheelchair_badminton":  ["WH1", "WH2"],
    "para_swimming":         ["S1", "S2", "S3", "S4"],
    "boccia":                ["BC1", "BC2", "BC3", "BC4"],
}

STATES = [
    "Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "West Bengal",
    "Odisha", "Kerala", "Gujarat", "Rajasthan", "Uttar Pradesh",
]

CITIES = {
    "Maharashtra": ["Mumbai", "Pune", "Nagpur"],
    "Delhi": ["New Delhi"],
    "Karnataka": ["Bengaluru", "Mysuru"],
    "Tamil Nadu": ["Chennai", "Coimbatore"],
    "West Bengal": ["Kolkata", "Howrah"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela"],
    "Kerala": ["Thiruvananthapuram", "Kochi"],
    "Gujarat": ["Ahmedabad", "Surat"],
    "Rajasthan": ["Jaipur", "Jodhpur"],
    "Uttar Pradesh": ["Lucknow", "Kanpur"],
}

# ─── Athlete definitions ──────────────────────────────────────────────────────

ATHLETE_DEFS = [
    # name,                 sport,                    ipc_class,   state,          city,         ipc_verified
    ("Advaith Iyer",        "wheelchair_basketball",  "Class 3",   "Kerala",       "Kochi",       True),
    ("Karthik Nair",        "wheelchair_tennis",      "Class 2",   "Tamil Nadu",   "Chennai",     True),
    ("Pranav Rao",          "para_athletics",         "T54",       "Karnataka",    "Bengaluru",   True),
    ("Vignesh Reddy",       "wheelchair_basketball",  "Class 2",   "Tamil Nadu",   "Coimbatore",  False),
    ("Tarun Menon",         "para_swimming",          "S3",        "Kerala",       "Thiruvananthapuram", True),
    ("Arvind Pillai",       "wheelchair_badminton",   "WH1",       "Kerala",       "Thiruvananthapuram", False),
    ("Nila Nambiar",        "wheelchair_tennis",      "Class 1",   "Kerala",       "Kochi",       True),
    ("Ananya Hegde",        "para_athletics",         "T52",       "Karnataka",    "Mysuru",      True),
    ("Keerthi Sundaram",    "wheelchair_badminton",   "WH2",       "Tamil Nadu",   "Chennai",     False),
    ("Debashish Mohapatra", "para_athletics",         "T53",       "Odisha",       "Bhubaneswar", True),
    ("Soumya Ranjan Nayak", "wheelchair_basketball",  "Class 1",   "Odisha",       "Cuttack",     True),
    ("Subham Pradhan",      "boccia",                 "BC2",       "Odisha",       "Rourkela",    True),
    ("Chandan Dash",        "para_athletics",         "T54",       "Odisha",       "Bhubaneswar", True),
    ("Bikram Rout",         "wheelchair_tennis",      "Class 2",   "Odisha",       "Cuttack",     False),
    ("Manas Patnaik",       "wheelchair_basketball",  "Class 4",   "Odisha",       "Rourkela",    True),
    ("Subhashree Sahoo",    "para_athletics",         "T51",       "Odisha",       "Bhubaneswar", True),
    ("Itishree Mishra",     "para_swimming",          "S2",        "Odisha",       "Bhubaneswar", True),
    ("Tapasmita Behera",    "wheelchair_badminton",   "WH1",       "Odisha",       "Cuttack",     False),
    ("Kabir Sharma",        "wheelchair_basketball",  "Class 3",   "Delhi",        "New Delhi",   True),
    ("Dhruv Verma",         "para_athletics",         "T54",       "Uttar Pradesh","Lucknow",     True),
    ("Reyansh Kapoor",      "wheelchair_tennis",      "Class 1",   "Delhi",        "New Delhi",   False),
    ("Aarav Malhotra",      "wheelchair_basketball",  "Class 2",   "Rajasthan",    "Jaipur",      True),
    ("Vivaan Joshi",        "boccia",                 "BC3",       "Maharashtra",  "Mumbai",      True),
    ("Shaurya Chauhan",     "para_swimming",          "S4",        "Uttar Pradesh","Kanpur",      True),
    ("Avani Agarwal",       "wheelchair_badminton",   "WH2",       "Rajasthan",    "Jodhpur",     True),
    ("Meera Singhal",       "para_athletics",         "T53",       "Maharashtra",  "Pune",        True),
]

# ─── Coach definitions ────────────────────────────────────────────────────────

COACH_DEFS = [
    ("Siddharth Murthy",      "wheelchair_basketball", "Karnataka"),
    ("Ashwin Balakrishnan",   "para_athletics",        "Tamil Nadu"),
    ("Harish Venkatesh",      "wheelchair_tennis",     "Tamil Nadu"),
    ("Sambit Tripathy",       "para_athletics",        "Odisha"),
    ("Alok Biswal",           "wheelchair_basketball", "Odisha"),
    ("Priyabrata Samal",      "boccia",                "Odisha"),
    ("Tanmay Saxena",         "wheelchair_tennis",     "Delhi"),
    ("Rishabh Tiwari",        "para_athletics",        "Uttar Pradesh"),
    ("Kunal Singhania",       "wheelchair_basketball", "Rajasthan"),
    ("Divya Swaminathan",     "para_swimming",         "Tamil Nadu"),
    ("Chinmayee Panda",       "wheelchair_badminton",  "Odisha"),
    ("Rajan Mehta",           "para_athletics",        "Maharashtra"),  # 12th coach
]

# ─── Scout definitions ────────────────────────────────────────────────────────

SCOUT_DEFS = [
    ("Varun Subramanian",     "Tamil Nadu"),
    ("Gautham Namboodiri",    "Kerala"),
    ("Aniket Jena",           "Odisha"),
    ("Satyabrata Barik",      "Odisha"),
    ("Ayush Srivastava",      "Uttar Pradesh"),
    ("Harsh Vardhan Shukla",  "Delhi"),
]

# ─── Session metric templates per sport ──────────────────────────────────────

def make_metric_cards(sport: str, ipc_class: str, session_idx: int) -> list:
    """Generate realistic metric cards for a session. session_idx 0=oldest, 4=latest (improving trend)."""
    progress = 0.6 + (session_idx * 0.08)  # 0.60 → 0.92 across 5 sessions

    def sc(base: float, variance: float = 5.0) -> int:
        raw = base * progress + random.uniform(-variance, variance)
        return max(30, min(100, int(raw)))

    if sport == "wheelchair_basketball":
        return [
            {"id": "p1_max_speed",       "pillar": "Propulsion", "label": "Max Speed",        "value": f"{(3.5 + progress * 1.2):.1f}", "unit": "m/s", "score": sc(85), "higher_is_better": True,  "trend": round(random.uniform(0.5, 2.5), 1), "trend_unit": "%"},
            {"id": "p1_push_symmetry",   "pillar": "Propulsion", "label": "Push Symmetry",    "value": f"{(80 + progress * 15):.0f}%",  "unit": "%",   "score": sc(88), "higher_is_better": True,  "trend": round(random.uniform(1.0, 3.0), 1), "trend_unit": "%"},
            {"id": "p1_push_cadence",    "pillar": "Propulsion", "label": "Push Cadence",     "value": f"{(60 + progress * 22):.0f}",   "unit": "rpm", "score": sc(82), "higher_is_better": True,  "trend": round(random.uniform(0.5, 2.0), 1), "trend_unit": "rpm"},
            {"id": "p1_stroke_length",   "pillar": "Propulsion", "label": "Stroke Length",    "value": f"{(0.8 + progress * 0.4):.2f}", "unit": "m",   "score": sc(79), "higher_is_better": True,  "trend": round(random.uniform(0.1, 0.5), 2), "trend_unit": "m"},
            {"id": "p2_turn_radius",     "pillar": "Agility",    "label": "Turn Radius",      "value": f"{(1.8 - progress * 0.6):.2f}", "unit": "m",   "score": sc(76), "higher_is_better": False, "trend": round(random.uniform(0.1, 0.3), 2), "trend_unit": "m"},
            {"id": "p2_dir_change",      "pillar": "Agility",    "label": "Direction Change", "value": f"{(1.2 - progress * 0.5):.2f}", "unit": "s",   "score": sc(80), "higher_is_better": False, "trend": round(random.uniform(0.05, 0.15), 2), "trend_unit": "s"},
            {"id": "p3_speed_drop",      "pillar": "Fatigue",    "label": "Speed Drop",       "value": f"{(20 - progress * 10):.0f}%",  "unit": "%",   "score": sc(74), "higher_is_better": False, "trend": round(random.uniform(1.0, 3.0), 1), "trend_unit": "%"},
            {"id": "p12_rsi_risk_level", "pillar": "Fatigue",    "label": "RSI Score",        "value": f"{(0.25 - progress * 0.12):.2f}", "unit": "",  "score": sc(78), "higher_is_better": False, "trend": round(random.uniform(0.01, 0.05), 2), "trend_unit": ""},
        ]

    elif sport == "para_athletics":
        return [
            {"id": "p1_sprint_speed",    "pillar": "Propulsion", "label": "Sprint Speed",     "value": f"{(4.2 + progress * 1.5):.2f}", "unit": "m/s", "score": sc(88), "higher_is_better": True,  "trend": round(random.uniform(0.5, 2.0), 1), "trend_unit": "%"},
            {"id": "p1_push_symmetry",   "pillar": "Propulsion", "label": "Push Symmetry",    "value": f"{(82 + progress * 14):.0f}%",  "unit": "%",   "score": sc(90), "higher_is_better": True,  "trend": round(random.uniform(1.0, 3.0), 1), "trend_unit": "%"},
            {"id": "p1_cadence",         "pillar": "Propulsion", "label": "Cadence",          "value": f"{(70 + progress * 20):.0f}",   "unit": "rpm", "score": sc(86), "higher_is_better": True,  "trend": round(random.uniform(1.0, 3.0), 1), "trend_unit": "rpm"},
            {"id": "p2_start_time",      "pillar": "Agility",    "label": "Start Reaction",   "value": f"{(0.35 - progress * 0.08):.3f}", "unit": "s", "score": sc(82), "higher_is_better": False, "trend": round(random.uniform(0.01, 0.03), 3), "trend_unit": "s"},
            {"id": "p2_split_time_100",  "pillar": "Agility",    "label": "100m Split",       "value": f"{(18.0 - progress * 3.5):.1f}", "unit": "s",  "score": sc(85), "higher_is_better": False, "trend": round(random.uniform(0.2, 0.8), 1), "trend_unit": "s"},
            {"id": "p3_pace_drop",       "pillar": "Fatigue",    "label": "Pace Drop",        "value": f"{(15 - progress * 8):.0f}%",   "unit": "%",   "score": sc(76), "higher_is_better": False, "trend": round(random.uniform(1.0, 2.5), 1), "trend_unit": "%"},
            {"id": "p12_rsi_risk_level", "pillar": "Fatigue",    "label": "RSI Score",        "value": f"{(0.20 - progress * 0.09):.2f}", "unit": "",  "score": sc(80), "higher_is_better": False, "trend": round(random.uniform(0.01, 0.04), 2), "trend_unit": ""},
        ]

    elif sport == "wheelchair_tennis":
        return [
            {"id": "p1_max_speed",       "pillar": "Propulsion", "label": "Max Speed",        "value": f"{(3.2 + progress * 1.0):.1f}", "unit": "m/s", "score": sc(82), "higher_is_better": True,  "trend": round(random.uniform(0.5, 2.0), 1), "trend_unit": "%"},
            {"id": "p1_push_symmetry",   "pillar": "Propulsion", "label": "Push Symmetry",    "value": f"{(78 + progress * 16):.0f}%",  "unit": "%",   "score": sc(85), "higher_is_better": True,  "trend": round(random.uniform(1.0, 3.0), 1), "trend_unit": "%"},
            {"id": "p2_court_coverage",  "pillar": "Agility",    "label": "Court Coverage",   "value": f"{(55 + progress * 30):.0f}%",  "unit": "%",   "score": sc(80), "higher_is_better": True,  "trend": round(random.uniform(1.0, 3.0), 1), "trend_unit": "%"},
            {"id": "p2_dir_change",      "pillar": "Agility",    "label": "Direction Change", "value": f"{(1.0 - progress * 0.35):.2f}", "unit": "s",  "score": sc(77), "higher_is_better": False, "trend": round(random.uniform(0.05, 0.10), 2), "trend_unit": "s"},
            {"id": "p3_speed_drop",      "pillar": "Fatigue",    "label": "Speed Drop",       "value": f"{(18 - progress * 8):.0f}%",   "unit": "%",   "score": sc(73), "higher_is_better": False, "trend": round(random.uniform(1.0, 2.5), 1), "trend_unit": "%"},
            {"id": "p12_rsi_risk_level", "pillar": "Fatigue",    "label": "RSI Score",        "value": f"{(0.22 - progress * 0.10):.2f}", "unit": "",  "score": sc(76), "higher_is_better": False, "trend": round(random.uniform(0.01, 0.04), 2), "trend_unit": ""},
        ]

    elif sport == "wheelchair_badminton":
        return [
            {"id": "p1_max_speed",       "pillar": "Propulsion", "label": "Max Speed",        "value": f"{(2.8 + progress * 0.8):.1f}", "unit": "m/s", "score": sc(79), "higher_is_better": True,  "trend": round(random.uniform(0.5, 2.0), 1), "trend_unit": "%"},
            {"id": "p1_push_symmetry",   "pillar": "Propulsion", "label": "Push Symmetry",    "value": f"{(75 + progress * 18):.0f}%",  "unit": "%",   "score": sc(82), "higher_is_better": True,  "trend": round(random.uniform(1.0, 3.0), 1), "trend_unit": "%"},
            {"id": "p2_reach_angle",     "pillar": "Agility",    "label": "Reach Angle",      "value": f"{(110 + progress * 25):.0f}°", "unit": "°",   "score": sc(77), "higher_is_better": True,  "trend": round(random.uniform(1.0, 3.0), 1), "trend_unit": "°"},
            {"id": "p2_shuttle_reaction","pillar": "Agility",    "label": "Shuttle Reaction", "value": f"{(0.40 - progress * 0.10):.2f}", "unit": "s", "score": sc(75), "higher_is_better": False, "trend": round(random.uniform(0.01, 0.05), 2), "trend_unit": "s"},
            {"id": "p3_speed_drop",      "pillar": "Fatigue",    "label": "Speed Drop",       "value": f"{(16 - progress * 7):.0f}%",   "unit": "%",   "score": sc(72), "higher_is_better": False, "trend": round(random.uniform(1.0, 2.5), 1), "trend_unit": "%"},
            {"id": "p12_rsi_risk_level", "pillar": "Fatigue",    "label": "RSI Score",        "value": f"{(0.21 - progress * 0.09):.2f}", "unit": "",  "score": sc(74), "higher_is_better": False, "trend": round(random.uniform(0.01, 0.04), 2), "trend_unit": ""},
        ]

    elif sport == "para_swimming":
        return [
            {"id": "p1_stroke_rate",     "pillar": "Propulsion", "label": "Stroke Rate",      "value": f"{(28 + progress * 12):.0f}",   "unit": "spm", "score": sc(84), "higher_is_better": True,  "trend": round(random.uniform(0.5, 2.0), 1), "trend_unit": "%"},
            {"id": "p1_push_symmetry",   "pillar": "Propulsion", "label": "Stroke Symmetry",  "value": f"{(76 + progress * 18):.0f}%",  "unit": "%",   "score": sc(87), "higher_is_better": True,  "trend": round(random.uniform(1.0, 3.0), 1), "trend_unit": "%"},
            {"id": "p1_lap_speed",       "pillar": "Propulsion", "label": "Lap Speed",        "value": f"{(1.2 + progress * 0.5):.2f}", "unit": "m/s", "score": sc(83), "higher_is_better": True,  "trend": round(random.uniform(0.5, 1.5), 1), "trend_unit": "%"},
            {"id": "p2_turn_time",       "pillar": "Agility",    "label": "Turn Time",        "value": f"{(1.8 - progress * 0.5):.2f}", "unit": "s",   "score": sc(78), "higher_is_better": False, "trend": round(random.uniform(0.05, 0.10), 2), "trend_unit": "s"},
            {"id": "p3_pace_drop",       "pillar": "Fatigue",    "label": "Pace Drop",        "value": f"{(12 - progress * 5):.0f}%",   "unit": "%",   "score": sc(75), "higher_is_better": False, "trend": round(random.uniform(1.0, 2.5), 1), "trend_unit": "%"},
            {"id": "p12_rsi_risk_level", "pillar": "Fatigue",    "label": "RSI Score",        "value": f"{(0.18 - progress * 0.07):.2f}", "unit": "",  "score": sc(77), "higher_is_better": False, "trend": round(random.uniform(0.01, 0.04), 2), "trend_unit": ""},
        ]

    else:  # boccia
        return [
            {"id": "p1_release_accuracy","pillar": "Propulsion", "label": "Release Accuracy", "value": f"{(72 + progress * 22):.0f}%",  "unit": "%",   "score": sc(83), "higher_is_better": True,  "trend": round(random.uniform(1.0, 3.0), 1), "trend_unit": "%"},
            {"id": "p1_throw_power",     "pillar": "Propulsion", "label": "Throw Power",      "value": f"{(4.5 + progress * 2.0):.1f}", "unit": "N",   "score": sc(80), "higher_is_better": True,  "trend": round(random.uniform(0.5, 2.0), 1), "trend_unit": "%"},
            {"id": "p2_aim_deviation",   "pillar": "Agility",    "label": "Aim Deviation",    "value": f"{(12 - progress * 5):.1f}",    "unit": "cm",  "score": sc(78), "higher_is_better": False, "trend": round(random.uniform(0.5, 1.5), 1), "trend_unit": "cm"},
            {"id": "p2_reaction_time",   "pillar": "Agility",    "label": "Reaction Time",    "value": f"{(0.55 - progress * 0.15):.2f}", "unit": "s", "score": sc(76), "higher_is_better": False, "trend": round(random.uniform(0.01, 0.05), 2), "trend_unit": "s"},
            {"id": "p3_consistency",     "pillar": "Fatigue",    "label": "Throw Consistency","value": f"{(68 + progress * 24):.0f}%",  "unit": "%",   "score": sc(74), "higher_is_better": True,  "trend": round(random.uniform(1.0, 2.5), 1), "trend_unit": "%"},
            {"id": "p12_rsi_risk_level", "pillar": "Fatigue",    "label": "RSI Score",        "value": f"{(0.16 - progress * 0.06):.2f}", "unit": "",  "score": sc(72), "higher_is_better": False, "trend": round(random.uniform(0.01, 0.04), 2), "trend_unit": ""},
        ]


def avg_score(cards: list) -> int:
    scores = [c["score"] for c in cards if c.get("score") is not None]
    return int(sum(scores) / len(scores)) if scores else 0


def make_ai_log(cards: list, athlete_name: str, session_idx: int) -> list:
    top = sorted(cards, key=lambda c: c["score"], reverse=True)
    low = sorted(cards, key=lambda c: c["score"])
    log = []
    if top:
        log.append({"type": "good", "msg": f"{top[0]['label']} at {top[0]['value']} — strong performance for this classification."})
    if len(top) > 1:
        log.append({"type": "good", "msg": f"{top[1]['label']} consistently improving over the last {session_idx + 1} session(s)."})
    if low and low[0]["score"] < 70:
        log.append({"type": "warn", "msg": f"{low[0]['label']} is below benchmark — targeted drill recommended."})
    if session_idx >= 3:
        log.append({"type": "good", "msg": "Significant improvement from Session 1 baseline. Keep the momentum."})
    if low[0]["score"] < 60:
        log.append({"type": "warn", "msg": "RSI risk elevated — reduce training load this week and monitor HRV."})
    return log


def make_feedback(athlete_name: str, sport: str, overall: int, session_idx: int) -> dict:
    fn = athlete_name.split()[0]
    trend = "improving" if session_idx >= 2 else "developing"
    return {
        "scout_feedback": (
            f"{fn} shows {trend} biomechanics for {sport.replace('_', ' ')} classification. "
            f"Session score {overall}/100 — {"strong shortlist candidate" if overall >= 78 else "worth monitoring"}."
        ),
        "coach_feedback": (
            f"{fn}, {"excellent" if overall >= 80 else "good"} effort this session. "
            f"{"Push your symmetry drills harder next block." if session_idx < 3 else "The consistency you are showing is paying off."} "
            f"Overall: {overall}/100."
        ),
        "athlete_feedback": (
            f"Your score of {overall}/100 is {"above" if overall >= 75 else "approaching"} the benchmark for your class. "
            f"{"Keep focusing on the recovery drills." if overall < 80 else "Elite performance — maintain this consistency."}"
        ),
    }


# ─── Coach assignment plan ────────────────────────────────────────────────────
# Each coach handles ~4-5 athletes from their sport/state
def plan_coach_assignments(athlete_ids_by_sport, coach_records):
    assignments = {}  # athlete_id → [coach_id, ...]
    coach_by_sport = {}
    for c in coach_records:
        s = c["sport"]
        coach_by_sport.setdefault(s, []).append(c["id"])

    for sport, aids in athlete_ids_by_sport.items():
        coaches = coach_by_sport.get(sport, coach_records[:2])  # fallback
        for i, aid in enumerate(aids):
            coach_id = coaches[i % len(coaches)]
            assignments.setdefault(aid, []).append(coach_id)
    return assignments


# ─── Scout connection plan ────────────────────────────────────────────────────
# Each scout is connected to 8-12 athletes; each athlete visible to 1-3 scouts
def plan_scout_connections(athlete_ids, scout_ids):
    connections = []  # list of (athlete_id, scout_id)
    seen = set()
    # Distribute athletes across scouts
    for i, aid in enumerate(athlete_ids):
        # Each athlete connected to 1-2 scouts
        n_scouts = random.randint(1, 2)
        chosen = random.sample(scout_ids, min(n_scouts, len(scout_ids)))
        for sid in chosen:
            key = (aid, sid)
            if key not in seen:
                seen.add(key)
                connections.append(key)
    # Ensure each scout has at least 6 connections
    for sid in scout_ids:
        scout_conns = [p for p in connections if p[1] == sid]
        if len(scout_conns) < 6:
            candidates = [a for a in athlete_ids if (a, sid) not in seen]
            extra = random.sample(candidates, min(6 - len(scout_conns), len(candidates)))
            for aid in extra:
                connections.append((aid, sid))
                seen.add((aid, sid))
    return connections


# ─── Watchlist plan ───────────────────────────────────────────────────────────
def plan_watchlist(athlete_ids, scout_ids, connections):
    wl = []
    conn_set = set(connections)
    for sid in scout_ids:
        # Watchlist 3-5 additional athletes beyond their connections
        not_connected = [a for a in athlete_ids if (a, sid) not in conn_set]
        extras = random.sample(not_connected, min(4, len(not_connected)))
        for aid in extras:
            wl.append((sid, aid))
    return wl


# ─── Training assignment templates ───────────────────────────────────────────
TRAINING_TEMPLATES = [
    ("Propulsion Interval Set",   "Propulsion", "5×200m sprints with 90s rest. Maintain push symmetry above 90%.", "assigned"),
    ("Agility Slalom Circuit",    "Agility",    "10-cone slalom course, 3 sets. Target sub-0.6s direction change.", "in_progress"),
    ("Recovery & HRV Session",    "Fatigue",    "Low-intensity 20-min activity + stretching. Monitor HRV via smartwatch.", "completed"),
    ("Symmetry Drill Block",      "Propulsion", "Bilateral push drills — alternating strong/weak side. 3×8 reps each.", "assigned"),
    ("Speed Endurance Run",       "Fatigue",    "4×400m at race pace. Track speed drop across intervals.", "in_progress"),
]

# ─── Scout note templates ─────────────────────────────────────────────────────
SCOUT_NOTE_TEMPLATES = [
    "Outstanding biomechanics for the classification. Strong shortlist candidate.",
    "Improving session-over-session. Worth tracking for state selection.",
    "RSI elevated in recent sessions — flag to coaching staff before events.",
    "Push symmetry metrics consistently above 90th percentile for peer group.",
    "Needs to improve in Agility pillar — Direction Change time is above benchmark.",
    "First athlete from this state to consistently score above 80. Exceptional.",
    "Recommend IPC re-classification check — performance exceeds class upper band.",
    "Strong mental focus noted in video review. Attitude matches elite trajectory.",
]


# ─── MAIN SEED ────────────────────────────────────────────────────────────────

def seed():
    print("=" * 60)
    print("ParaSync DB Seeder — Starting")
    print("=" * 60)

    db = SessionLocal()

    # ── 1. Wipe all existing data ─────────────────────────────────────────────
    print("\n[1/8] Wiping existing data...")
    for model in [
        ScoutNote, Watchlist, Notification,
        TrainingAssignment, AthleteCoach, AthleteScout,
        AnalysisSession, Athlete, User,
    ]:
        deleted = db.query(model).delete()
        print(f"      Deleted {deleted} rows from {model.__tablename__}")
    db.commit()

    # ── 2. Create Users (athletes) ───────────────────────────────────────────
    print("\n[2/8] Creating 26 athlete User accounts...")
    athlete_users = []
    for name, sport, ipc_class, state, city, ipc_v in ATHLETE_DEFS:
        uid = make_id()
        parts = name.lower().split()
        email = parts[0] + parts[-1] + "@gmail.com"  # e.g. advaithiyer@gmail.com
        ph, salt = _hash_password(DEFAULT_PASSWORD)
        u = User(
            id=uid, name=name, email=email,
            password_hash=ph, password_salt=salt,
            role="athlete", sport=sport, ipc_class=ipc_class,
            extra_json=json.dumps({"state": state, "city": city}),
        )
        db.add(u)
        athlete_users.append({"id": uid, "name": name, "sport": sport, "ipc_class": ipc_class, "state": state, "city": city, "ipc_v": ipc_v})
    db.commit()
    print(f"      ✓ {len(athlete_users)} athlete users created")

    # ── 3. Create Athlete profiles ───────────────────────────────────────────
    print("\n[3/8] Creating 26 Athlete profiles...")
    athlete_records = []
    for u in athlete_users:
        a = Athlete(
            id=u["id"],  # Same ID as User for easy lookup
            name=u["name"], sport=u["sport"], ipc_class=u["ipc_class"],
            state=u["state"], city=u["city"],
            discoverable=True, ipc_verified=u["ipc_v"],
            view_count=random.randint(5, 80),
        )
        db.add(a)
        athlete_records.append(u)
    db.commit()
    print(f"      ✓ {len(athlete_records)} athlete profiles created")

    # ── 4. Create Coaches ────────────────────────────────────────────────────
    print("\n[4/8] Creating 12 coach User accounts...")
    coach_records = []
    for name, sport, state in COACH_DEFS:
        uid = make_id()
        parts = name.lower().split()
        email = parts[0] + parts[-1] + "@gmail.com"  # e.g. siddharthmurthy@gmail.com
        ph, salt = _hash_password(DEFAULT_PASSWORD)
        c = User(
            id=uid, name=name, email=email,
            password_hash=ph, password_salt=salt,
            role="coach", sport=sport,
            extra_json=json.dumps({"state": state, "federation": "SAI", "experience": str(random.randint(5, 15)), "certification": "NIS Level 2"}),
        )
        db.add(c)
        coach_records.append({"id": uid, "name": name, "sport": sport, "state": state})
    db.commit()
    print(f"      ✓ {len(coach_records)} coaches created")

    # ── 5. Create Scouts ─────────────────────────────────────────────────────
    print("\n[5/8] Creating 6 scout User accounts...")
    scout_records = []
    for name, state in SCOUT_DEFS:
        uid = make_id()
        parts = name.lower().split()
        email = parts[0] + parts[-1] + "@gmail.com"  # e.g. varunsubramanian@gmail.com
        ph, salt = _hash_password(DEFAULT_PASSWORD)
        s = User(
            id=uid, name=name, email=email,
            password_hash=ph, password_salt=salt,
            role="scout",
            extra_json=json.dumps({"state": state, "organization": "Paralympics India", "region": state}),
        )
        db.add(s)
        scout_records.append({"id": uid, "name": name, "state": state})
    db.commit()
    print(f"      ✓ {len(scout_records)} scouts created")

    # ── 6. Create Sessions (5 per athlete) ──────────────────────────────────
    print("\n[6/8] Creating 5 sessions per athlete (130 total)...")
    session_records = {}  # athlete_id → [session_id, ...]
    for a in athlete_records:
        aid = a["id"]
        session_records[aid] = []
        for i in range(5):
            days_back = (4 - i) * 7 + random.randint(0, 3)  # ~weekly, oldest first
            session_date = days_ago(days_back)
            cards = make_metric_cards(a["sport"], a["ipc_class"], i)
            overall = avg_score(cards)
            ai_log = make_ai_log(cards, a["name"], i)
            feedback = make_feedback(a["name"], a["sport"], overall, i)
            sid = make_id()
            sess = AnalysisSession(
                id=sid,
                athlete_id=aid,
                sport=a["sport"],
                ipc_class=a["ipc_class"],
                date=iso_date(session_date),
                created_at=session_date,
                video_filename=f"training_{iso_date(session_date).replace('-','')}.mp4",
                video_duration_sec=round(random.uniform(240, 480), 1),
                video_fps=30.0,
                video_resolution="1920x1080",
                video_camera_angle="side",
                video_frames_analysed=random.randint(3000, 8000),
                pose_confidence_avg=round(random.uniform(0.82, 0.97), 3),
                metric_cards_json=json.dumps(cards),
                feedback_json=json.dumps(feedback),
                ai_log_json=json.dumps(ai_log),
                pillars_computed=3,
                total_metric_cards=len(cards),
                pipeline_version="2.0.0",
                processing_time_sec=round(random.uniform(8.0, 22.0), 2),
            )
            db.add(sess)
            session_records[aid].append(sid)
    db.commit()
    print(f"      ✓ {5 * len(athlete_records)} sessions created")

    # ── 7. Coach ↔ Athlete connections ──────────────────────────────────────
    print("\n[7/8] Creating coach ↔ athlete connections + training assignments...")
    athlete_ids_by_sport = {}
    for a in athlete_records:
        athlete_ids_by_sport.setdefault(a["sport"], []).append(a["id"])

    coach_assignments = plan_coach_assignments(athlete_ids_by_sport, coach_records)
    conn_count = 0
    training_count = 0

    for aid, coach_ids in coach_assignments.items():
        for cid in coach_ids:
            ac = AthleteCoach(
                id=make_id(), athlete_id=aid, coach_id=cid,
                status="accepted",
                created_at=days_ago(random.randint(20, 60)),
            )
            db.add(ac)
            conn_count += 1
            # Create 2-3 training assignments per connection
            n_train = random.randint(2, 3)
            for tmpl in random.sample(TRAINING_TEMPLATES, n_train):
                title, pillar, desc, status = tmpl
                ta = TrainingAssignment(
                    id=make_id(), coach_id=cid, athlete_id=aid,
                    title=title, description=desc, target_pillar=pillar,
                    due_date=iso_date(days_ago(random.randint(-14, 7))),
                    status=status,
                    created_at=days_ago(random.randint(5, 30)),
                )
                db.add(ta)
                training_count += 1
    db.commit()
    print(f"      ✓ {conn_count} coach connections + {training_count} training assignments")

    # ── 8. Scout ↔ Athlete connections + notes + watchlist ──────────────────
    print("\n[8/8] Creating scout connections, notes, and watchlists...")
    all_aid = [a["id"] for a in athlete_records]
    all_sid = [s["id"] for s in scout_records]

    scout_conns = plan_scout_connections(all_aid, all_sid)
    sc_conn_count = 0
    for aid, sid in scout_conns:
        asc = AthleteScout(
            id=make_id(), athlete_id=aid, scout_id=sid,
            status="accepted",
            created_at=days_ago(random.randint(10, 45)),
        )
        db.add(asc)
        sc_conn_count += 1
        # 1-3 scout notes per connected athlete
        n_notes = random.randint(1, 3)
        for note_text in random.sample(SCOUT_NOTE_TEMPLATES, n_notes):
            sn = ScoutNote(
                id=make_id(), scout_id=sid, athlete_id=aid,
                text=note_text,
                created_at=days_ago(random.randint(1, 20)),
            )
            db.add(sn)

    # Watchlist entries
    wl_entries = plan_watchlist(all_aid, all_sid, scout_conns)
    for sid, aid in wl_entries:
        wl = Watchlist(
            id=make_id(), scout_id=sid, athlete_id=aid,
            created_at=days_ago(random.randint(2, 15)),
        )
        db.add(wl)

    db.commit()
    print(f"      ✓ {sc_conn_count} scout connections | {len(wl_entries)} watchlist entries")

    # ── Summary ───────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("✅ Seed Complete!")
    print(f"   Athletes : {len(athlete_records)}")
    print(f"   Coaches  : {len(coach_records)}")
    print(f"   Scouts   : {len(scout_records)}")
    print(f"   Sessions : {5 * len(athlete_records)}")
    print(f"   Coach↔Athlete connections: {conn_count}")
    print(f"   Scout↔Athlete connections: {sc_conn_count}")
    print(f"   Training assignments: {training_count}")
    print(f"   Watchlist entries: {len(wl_entries)}")
    print("=" * 60)
    print("\n🔑 Login with any account using password: ParaSync@123")
    print("   Example athlete : advaith.iyer@parasync.in")
    print("   Example coach   : siddharth.murthy@parasync.in")
    print("   Example scout   : varun.subramanian@parasync.in")
    print("=" * 60)

    db.close()


if __name__ == "__main__":
    seed()
