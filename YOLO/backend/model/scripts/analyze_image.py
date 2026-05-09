"""Run a single-image YOLO checkpoint and save an annotated image."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from analyzer import analyze_image


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", help="Input image path")
    parser.add_argument("--output", default="data/checkpoints/annotated-image.jpg")
    parser.add_argument("--weights", default=None)
    parser.add_argument("--conf", type=float, default=0.1)
    parser.add_argument("--imgsz", type=int, default=320)
    parser.add_argument("--max-det", type=int, default=1)
    args = parser.parse_args()

    result = analyze_image(
        args.image,
        args.output,
        weights=args.weights,
        conf=args.conf,
        imgsz=args.imgsz,
        max_det=args.max_det,
    )
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
