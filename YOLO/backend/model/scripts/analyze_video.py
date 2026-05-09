"""Run YOLO on a video and save an annotated video plus metrics JSON."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from analyzer import analyze_video


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video", help="Input video path")
    parser.add_argument("--output-dir", default="data/checkpoints/video")
    parser.add_argument("--weights", default=None)
    parser.add_argument("--conf", type=float, default=0.1)
    parser.add_argument("--imgsz", type=int, default=320)
    parser.add_argument("--max-det", type=int, default=1)
    parser.add_argument("--max-frames", type=int, default=None)
    args = parser.parse_args()

    metrics = analyze_video(
        args.video,
        args.output_dir,
        weights=args.weights,
        conf=args.conf,
        imgsz=args.imgsz,
        max_det=args.max_det,
        max_frames=args.max_frames,
    )
    print(json.dumps(metrics["summary"], indent=2))
    print(f"Annotated video: {Path(args.output_dir) / 'annotated.mp4'}")
    print(f"Metrics JSON:    {Path(args.output_dir) / 'metrics.json'}")


if __name__ == "__main__":
    main()
