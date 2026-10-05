"""
METRIC CATEGORY 3: Timing and Responsiveness — spec §4.6.
"""
from typing import List, Tuple

import numpy as np

from src.pipeline.schemas import RimAngle, TimingResponsivenessFeatures

_SAMPLE_HZ = 30.0
_PUSH_THRESHOLD_DEG_PER_SEC = 0.5 * 360  # "0.5 Hz equivalent" per spec


def _uniform_signal(rim_angles: List[RimAngle]) -> Tuple[np.ndarray, np.ndarray]:
    samples = [(r.timestamp_sec, r.angle_deg) for r in rim_angles if r.angle_deg is not None]
    if len(samples) < 2:
        return np.array([]), np.array([])

    ts = np.array([s[0] for s in samples])
    angles = np.array([s[1] for s in samples])

    t0, t1 = ts[0], ts[-1]
    if t1 <= t0:
        return np.array([]), np.array([])

    uniform_t = np.arange(t0, t1, 1 / _SAMPLE_HZ)
    uniform_angle = np.interp(uniform_t, ts, angles)
    return uniform_t, uniform_angle


def _push_cycles(uniform_t: np.ndarray, uniform_angle: np.ndarray):
    """Segment into push cycles using angular-velocity threshold crossings."""
    if uniform_t.size < 3:
        return []

    angular_velocity = np.gradient(uniform_angle, uniform_t)
    is_pushing = angular_velocity > _PUSH_THRESHOLD_DEG_PER_SEC

    cycles = []
    push_start = None
    coast_start = None
    for i in range(1, len(is_pushing)):
        if is_pushing[i] and not is_pushing[i - 1]:
            push_start = uniform_t[i]
            if coast_start is not None:
                cycles.append({"coast_start": coast_start, "coast_end": uniform_t[i]})
        if not is_pushing[i] and is_pushing[i - 1]:
            coast_start = uniform_t[i]
            if push_start is not None:
                if cycles and "coast_end" in cycles[-1] and "push_start" not in cycles[-1]:
                    cycles[-1]["push_start"] = push_start
                    cycles[-1]["push_end"] = uniform_t[i]
                else:
                    cycles.append({"push_start": push_start, "push_end": uniform_t[i]})

    # merge push/coast pairs into full cycles with contact arc info
    full_cycles = []
    idx_push = [c for c in cycles if "push_start" in c]
    for i, c in enumerate(idx_push):
        push_dur = c["push_end"] - c["push_start"]
        coast_dur = None
        if i + 1 < len(idx_push):
            coast_dur = idx_push[i + 1]["push_start"] - c["push_end"]
        mask = (uniform_t >= c["push_start"]) & (uniform_t <= c["push_end"])
        arc = float(uniform_angle[mask].max() - uniform_angle[mask].min()) if mask.any() else 0.0
        full_cycles.append({
            "push_start": c["push_start"], "push_end": c["push_end"],
            "push_duration": push_dur, "coast_duration": coast_dur, "contact_arc": arc,
            "signal": uniform_angle[mask],
        })

    return full_cycles


def extract_timing_responsiveness(rim_angles: List[RimAngle]) -> TimingResponsivenessFeatures:
    uniform_t, uniform_angle = _uniform_signal(rim_angles)

    if uniform_t.size < 4:
        return TimingResponsivenessFeatures(
            cadence_pushes_per_min=0, cadence_hz=0, stroke_consistency_dtw=0,
            contact_arc_deg=0, avg_push_duration_sec=0, avg_coast_duration_sec=0,
            push_to_coast_ratio=0,
        )

    # ── cadence via FFT ───────────────────────────────────────────────────────
    fft_vals = np.fft.fft(uniform_angle - np.mean(uniform_angle))
    freqs = np.fft.fftfreq(len(uniform_angle), d=1 / _SAMPLE_HZ)
    power = np.abs(fft_vals)

    band_mask = (freqs >= 0.3) & (freqs <= 3.0)
    if band_mask.any() and power[band_mask].size:
        dominant_idx = np.argmax(power[band_mask])
        cadence_hz = float(freqs[band_mask][dominant_idx])
    else:
        cadence_hz = 0.0
    cadence_pushes_per_min = cadence_hz * 60

    # ── push cycle segmentation ──────────────────────────────────────────────
    cycles = _push_cycles(uniform_t, uniform_angle)

    push_durations = [c["push_duration"] for c in cycles if c["push_duration"] > 0]
    coast_durations = [c["coast_duration"] for c in cycles if c["coast_duration"] and c["coast_duration"] > 0]
    contact_arcs = [c["contact_arc"] for c in cycles]

    avg_push_duration_sec = float(np.mean(push_durations)) if push_durations else 0.0
    avg_coast_duration_sec = float(np.mean(coast_durations)) if coast_durations else 0.0
    contact_arc_deg = float(np.mean(contact_arcs)) if contact_arcs else 0.0
    push_to_coast_ratio = (avg_push_duration_sec / avg_coast_duration_sec) if avg_coast_duration_sec > 0 else 0.0

    # ── stroke consistency (mean pairwise DTW distance) ─────────────────────
    stroke_consistency_dtw = _mean_pairwise_dtw(cycles)

    return TimingResponsivenessFeatures(
        cadence_pushes_per_min=cadence_pushes_per_min,
        cadence_hz=cadence_hz,
        stroke_consistency_dtw=stroke_consistency_dtw,
        contact_arc_deg=contact_arc_deg,
        avg_push_duration_sec=avg_push_duration_sec,
        avg_coast_duration_sec=avg_coast_duration_sec,
        push_to_coast_ratio=push_to_coast_ratio,
    )


def _resample(signal: np.ndarray, length: int = 100) -> np.ndarray:
    if signal.size < 2:
        return np.zeros(length)
    x_old = np.linspace(0, 1, signal.size)
    x_new = np.linspace(0, 1, length)
    return np.interp(x_new, x_old, signal)


def _dtw_distance(a: np.ndarray, b: np.ndarray) -> float:
    n, m = len(a), len(b)
    cost = np.full((n + 1, m + 1), np.inf)
    cost[0, 0] = 0
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            d = abs(a[i - 1] - b[j - 1])
            cost[i, j] = d + min(cost[i - 1, j], cost[i, j - 1], cost[i - 1, j - 1])
    return float(cost[n, m])


def _mean_pairwise_dtw(cycles) -> float:
    signals = [_resample(c["signal"]) for c in cycles if c["signal"].size >= 2]
    if len(signals) < 2:
        return 0.0

    distances = []
    for i in range(len(signals)):
        for j in range(i + 1, len(signals)):
            distances.append(_dtw_distance(signals[i], signals[j]))

    return float(np.mean(distances)) if distances else 0.0
