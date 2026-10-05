"""
Google Gemini client for LLM-generated athlete feedback.

Thin, provider-specific wrapper around google-genai (the current unified
Google GenAI SDK — NOT the older, now-deprecated google-generativeai package)
— everything that calls into an LLM goes through `generate_feedback()`, so
swapping providers later means rewriting this one module, not the callers.
Never raises: on any failure (no API key, network error, malformed response)
it returns None and the caller falls back to the existing rule-based
feedback in src/pipeline/adapter.py — an LLM outage must never break video
analysis.
"""
from __future__ import annotations

import json
import os
import re
from typing import Dict, List, Optional

from src.pipeline.schemas import AthleteMetadata, ScoreResult

_MODEL_NAME = "gemini-2.0-flash"


def _client_available() -> bool:
    return bool(os.environ.get("GEMINI_API_KEY"))


def _build_prompt(score: ScoreResult, metric_cards: List[dict], athlete: AthleteMetadata) -> str:
    # Only the metrics that actually have a normalized score are useful for
    # narrative feedback — raw flags (asymmetry_flag etc.) are booleans/labels,
    # not something to average or comment on numerically.
    scored = [
        f"- {c['pillar']} / {c['label']}: {c['value']}{c.get('unit') or ''} (score {c['score']}/100)"
        for c in metric_cards if c.get("score") is not None
    ]
    metrics_block = "\n".join(scored) if scored else "No scored metrics available this session."

    return f"""You are a biomechanics analyst writing feedback for a wheelchair para-sport athlete's video analysis session.

Athlete: {athlete.name}, sport: {athlete.sport.replace('_', ' ')}, classification: {athlete.disability_class}
Overall score: {score.overall_score}/100 (grade {score.letter_grade})

Per-metric scores this session:
{metrics_block}

Injury/risk flags: {', '.join(score.injury_flags) if score.injury_flags else 'none'}

Write three short pieces of feedback as JSON with exactly these three keys:
- "scout_feedback": 2-3 sentences, written for a talent scout evaluating this athlete — focus on standout strengths and overall potential, not technique instruction.
- "coach_feedback": 2-3 sentences, written for the athlete's coach — focus on concrete technique adjustments tied to the weakest scored metrics above.
- "athlete_feedback": 3-4 sentences, written directly to the athlete in second person ("you"/"your"). Must reference at least one specific metric value by name and number from the list above (not a vague generality), must explicitly call out any injury/risk flags and what they mean in plain language, and must include at least one concrete joint-angle or body-positioning adjustment (e.g. "keep your trunk rotation closer to X degrees" / "increase your push arc to reduce strain on..."). Encouraging but honest tone — this is the athlete's own copy, not a coach's private note.

Respond with ONLY the JSON object, no markdown fences, no other text."""


def generate_feedback(
    score: ScoreResult, metric_cards: List[dict], athlete: AthleteMetadata,
) -> Optional[Dict[str, str]]:
    """Returns {"scout_feedback": str, "coach_feedback": str, "athlete_feedback": str}
    or None if the LLM is unavailable/unconfigured or the call fails for any reason."""
    if not _client_available():
        return None

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
        response = client.models.generate_content(
            model=_MODEL_NAME,
            contents=_build_prompt(score, metric_cards, athlete),
            config=types.GenerateContentConfig(temperature=0.4, max_output_tokens=550),
        )
        text = (response.text or "").strip()
        # Models sometimes wrap JSON in ```json fences despite instructions not to.
        if text.startswith("```"):
            text = text.strip("`")
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()

        parsed = json.loads(text)
        scout_fb = parsed.get("scout_feedback")
        coach_fb = parsed.get("coach_feedback")
        athlete_fb = parsed.get("athlete_feedback")
        if not scout_fb or not coach_fb or not athlete_fb:
            return None
        return {"scout_feedback": scout_fb, "coach_feedback": coach_fb, "athlete_feedback": athlete_fb}
    except Exception as exc:
        print(f"[Pipeline] Gemini feedback generation failed, using rule-based fallback: {exc}")
        return None


# ─── Scout chatbot: natural-language query -> Discovery filter params ──────────

_VALID_SPORTS = [
    "wheelchair_basketball", "wheelchair_tennis", "wheelchair_badminton",
    "para_athletics", "wheelchair_table_tennis", "para_cricket",
]

# Checked longest-keyword-first so "table tennis" matches before "tennis" does.
_SPORT_KEYWORDS = [
    ("wheelchair_table_tennis", ["table tennis"]),
    ("wheelchair_basketball", ["basketball"]),
    ("wheelchair_tennis", ["tennis"]),
    ("wheelchair_badminton", ["badminton"]),
    ("para_athletics", ["athletics", "racing", "sprint"]),
    ("para_cricket", ["cricket"]),
]

_IPC_CLASS_RE = re.compile(r"\b([TFSBC]{1,2}\d{1,2})\b", re.IGNORECASE)
_MIN_SCORE_RE = re.compile(r"(?:above|over|at least|scoring|score\s*(?:of)?)\s*(\d{1,3})", re.IGNORECASE)


def heuristic_parse_query(query: str, known_states: List[str]) -> dict:
    """
    Pure keyword/regex query parser — no LLM, no API key needed. Used when
    Gemini is unavailable (or its call fails) so the chatbot still does real
    sport/class/location filtering instead of degrading to a useless
    name-only search that returns nothing for a query like "basketball
    players" (the athlete's *name* is very unlikely to contain the word
    "basketball"). Gemini, when configured, still gives better results for
    fuzzier phrasing — this is the floor, not a replacement.
    """
    q = query.lower()
    filters: dict = {}

    for sport_id, keywords in _SPORT_KEYWORDS:
        if any(kw in q for kw in keywords):
            filters["sport"] = sport_id
            break

    ipc_match = _IPC_CLASS_RE.search(query)
    if ipc_match:
        filters["ipc_class"] = ipc_match.group(1).upper()

    for state in known_states:
        if state.lower() in q:
            filters["state"] = state
            break

    score_match = _MIN_SCORE_RE.search(q)
    if score_match:
        filters["min_score"] = float(score_match.group(1))

    # Only fall back to treating the whole query as a name search if nothing
    # structured was recognized at all — otherwise a query like "basketball
    # players named Arjun" would (correctly) drop the literal words as a
    # separate, much noisier name filter.
    if not filters:
        filters["name_search"] = query.strip()

    return filters


def parse_athlete_query(query: str, known_states: List[str]) -> Optional[dict]:
    """Extract {sport, ipc_class, state, min_score} filter params from a scout's
    free-text search ("T53 basketball players in Karnataka scoring above 70").
    Returns None if the LLM is unavailable or the call fails — the caller
    falls back to a plain name/keyword search instead of failing the chat.
    Returns {} (not None) if the query parsed fine but named no filters.
    """
    if not _client_available():
        return None
    try:
        from google import genai
        from google.genai import types

        prompt = f"""Extract athlete search filters from this scout's query, for a wheelchair para-sport recruiting platform.

Valid sports (use exactly these ids): {', '.join(_VALID_SPORTS)}
Known athlete locations in the database: {', '.join(known_states) if known_states else '(none recorded yet)'}

Query: "{query}"

Respond with ONLY a JSON object with these optional keys — omit any not clearly mentioned:
- "sport": one of the valid sport ids above (map casual terms like "basketball players" to "wheelchair_basketball")
- "ipc_class": an IPC classification code if mentioned (e.g. "T53")
- "state": one of the known locations above, only if it's an exact or clear match
- "min_score": a number 0-100 if a minimum performance/score threshold is mentioned
- "name_search": a plain keyword if the query looks like it's searching for a specific athlete by name

If nothing above is clearly mentioned, respond with {{}}."""

        client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
        response = client.models.generate_content(
            model=_MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.1, max_output_tokens=150),
        )
        text = (response.text or "").strip()
        if text.startswith("```"):
            text = text.strip("`")
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()
        parsed = json.loads(text)
        return parsed if isinstance(parsed, dict) else {}
    except Exception as exc:
        print(f"[Pipeline] Gemini query parsing failed, falling back to keyword search: {exc}")
        return None
