"""Train a YOLO11n model on the prepared dataset.

Defaults are tuned for fast iteration on a typical laptop without a GPU:
- yolo11n.pt is the smallest YOLO11 variant.
- imgsz=320 cuts training time roughly 4x compared to the default 640.
- batch=8 fits in most laptop RAM; bump it up if you have a GPU.

Run from YOLO/backend/model with the current dataset:
    python scripts/train.py

Tweak augmentation hyperparameters by editing the
defaults below. Run `python scripts/train.py --help` for the full list.

Outputs land in runs/detect/<name>/ . The trained weights are at
runs/detect/<name>/weights/best.pt.
"""
import argparse
from pathlib import Path

import yaml
from ultralytics import YOLO


MODEL_ROOT = Path(__file__).resolve().parents[1]
YOLO_ROOT = MODEL_ROOT.parents[1]
DEFAULT_DATA = YOLO_ROOT / "dataset" / "ensantina" / "data.yaml"


def resolve_data_yaml(data_path: str) -> str:
    """Resolve relative dataset paths from the YAML file location."""
    original = Path(data_path)
    if not original.exists() and not original.is_absolute():
        original = MODEL_ROOT / original
    original = original.resolve()

    with original.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    if not isinstance(data, dict):
        raise ValueError(f"Dataset YAML did not contain a mapping: {original}")

    dataset_path = Path(data.get("path", ""))
    if dataset_path and not dataset_path.is_absolute():
        data["path"] = str((original.parent / dataset_path).resolve())

    resolved_dir = MODEL_ROOT / "data" / "resolved"
    resolved_dir.mkdir(parents=True, exist_ok=True)
    resolved = resolved_dir / f"{original.stem}.resolved.yaml"
    with resolved.open("w", encoding="utf-8") as f:
        yaml.safe_dump(data, f, sort_keys=False)

    return str(resolved)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", default=str(DEFAULT_DATA),
                        help="Path to YOLO data.yaml")
    parser.add_argument("--model", default="yolo11n.pt",
                        help="Base model to fine-tune (yolo11n/s/m/l/x.pt)")
    parser.add_argument("--epochs", type=int, default=50,
                        help="Number of training epochs")
    parser.add_argument("--imgsz", type=int, default=320,
                        help="Training image size (320 is fast, 640 is the default)")
    parser.add_argument("--batch", type=int, default=8,
                        help="Batch size per training step")
    parser.add_argument("--name", default="run1",
                        help="Run name. Outputs land in runs/detect/<name>/")
    parser.add_argument("--project", default=str(MODEL_ROOT / "runs" / "detect"),
                        help="Output directory for training runs")
    parser.add_argument("--device", default=None,
                        help="Force a device (e.g. 'cpu', 'mps', '0' for GPU 0). "
                             "Default lets Ultralytics auto-detect.")

    parser.add_argument("--hsv-h", type=float, default=0.015)
    parser.add_argument("--hsv-s", type=float, default=0.7)
    parser.add_argument("--hsv-v", type=float, default=0.4)
    parser.add_argument("--degrees", type=float, default=0.0)
    parser.add_argument("--translate", type=float, default=0.1)
    parser.add_argument("--scale", type=float, default=0.5)
    parser.add_argument("--shear", type=float, default=0.0)
    parser.add_argument("--perspective", type=float, default=0.0)
    parser.add_argument("--flipud", type=float, default=0.0)
    parser.add_argument("--fliplr", type=float, default=0.5)
    parser.add_argument("--mosaic", type=float, default=1.0)
    parser.add_argument("--mixup", type=float, default=0.0)
    parser.add_argument("--close-mosaic", type=int, default=10,
                        help="Disable mosaic for the last N epochs (helps final accuracy)")

    args = parser.parse_args()
    data_yaml = resolve_data_yaml(args.data)

    model = YOLO(args.model)
    model.train(
        data=data_yaml,
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        name=args.name,
        project=args.project,
        device=args.device,
        hsv_h=args.hsv_h,
        hsv_s=args.hsv_s,
        hsv_v=args.hsv_v,
        degrees=args.degrees,
        translate=args.translate,
        scale=args.scale,
        shear=args.shear,
        perspective=args.perspective,
        flipud=args.flipud,
        fliplr=args.fliplr,
        mosaic=args.mosaic,
        mixup=args.mixup,
        close_mosaic=args.close_mosaic,
    )


if __name__ == "__main__":
    main()
