"""
CLI entry point for the ParaSync analysis pipeline.
Usage: python main.py --video sample.mp4 --sport wheelchair_basketball --class T53
"""
import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from src.pipeline.orchestrator import run_pipeline
from src.pipeline.schemas import AthleteMetadata, PipelineProgress


def run(video_path: str, sport: str, ipc_class: str,
        athlete_name: str = "cli_athlete", age: int = None,
        verbose: bool = False) -> dict:

    def progress_callback(p: PipelineProgress):
        if verbose:
            print(f"[{p.progress_pct:3d}%] {p.stage}: {p.message}")

    athlete = AthleteMetadata(name=athlete_name, sport=sport, disability_class=ipc_class, age=age)
    score_result = run_pipeline(video_path, athlete, progress_callback)
    return score_result.model_dump()


def main():
    parser = argparse.ArgumentParser(
        description="ParaSync — Wheelchair Sports Video Analysis Pipeline"
    )
    parser.add_argument("--video", required=True, help="Path to input video file")
    parser.add_argument("--sport", required=True,
                        choices=["wheelchair_basketball", "wheelchair_tennis",
                                 "wheelchair_badminton", "para_athletics",
                                 "wheelchair_table_tennis", "para_cricket"],
                        help="Sport type")
    parser.add_argument("--class", required=True, dest="ipc_class",
                        help="Disability classification (e.g. Class 3)")
    parser.add_argument("--athlete-name", default="CLI Athlete", help="Athlete name")
    parser.add_argument("--age", type=int, default=None, help="Athlete age")
    parser.add_argument("--output", default=None, help="Output JSON file path (default: stdout)")
    parser.add_argument("--verbose", action="store_true", help="Print pipeline progress")
    args = parser.parse_args()

    if not os.path.exists(args.video):
        print(f"ERROR: Video file not found: {args.video}", file=sys.stderr)
        sys.exit(1)

    result = run(
        video_path=args.video,
        sport=args.sport,
        ipc_class=args.ipc_class,
        athlete_name=args.athlete_name,
        age=args.age,
        verbose=args.verbose,
    )

    output_str = json.dumps(result, indent=2, ensure_ascii=False)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(output_str)
        print(f"Result saved to: {args.output}")
    else:
        print(output_str)


if __name__ == "__main__":
    main()
