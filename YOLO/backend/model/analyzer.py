"""YOLO inference helpers for the salamander video app."""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import time
from functools import lru_cache
from pathlib import Path
from typing import Any

import cv2
import imageio_ffmpeg
from ultralytics import YOLO


MODEL_ROOT = Path(__file__).resolve().parent
DEFAULT_WEIGHTS = Path(os.environ.get("YOLO_WEIGHTS", MODEL_ROOT / "weights" / "salamander-36.pt"))
DEFAULT_CLASS_NAME = "salamander"


@lru_cache(maxsize=2)
def _load_model_cached(weights_path: str) -> YOLO:
    return YOLO(weights_path)


def load_model(weights: str | Path | None = None) -> YOLO:
    weights_path = Path(weights or DEFAULT_WEIGHTS).resolve()
    if not weights_path.exists():
        raise FileNotFoundError(
            f"Model weights not found at {weights_path}. "
            "Train first with scripts/train.py or set YOLO_WEIGHTS."
        )
    return _load_model_cached(str(weights_path))


def detections_from_result(result: Any, model: YOLO) -> list[dict[str, Any]]:
    detections: list[dict[str, Any]] = []
    boxes = result.boxes
    if boxes is None or len(boxes) == 0:
        return detections

    xyxy_values = boxes.xyxy.cpu().tolist()
    class_ids = boxes.cls.cpu().tolist()
    confidences = boxes.conf.cpu().tolist()

    for xyxy, cls_value, confidence in zip(xyxy_values, class_ids, confidences):
        x1, y1, x2, y2 = [float(v) for v in xyxy]
        width = x2 - x1
        height = y2 - y1
        cls_id = int(cls_value)
        confidence = float(confidence)
        detections.append(
            {
                "classId": cls_id,
                "className": model.names.get(cls_id, DEFAULT_CLASS_NAME),
                "confidence": round(confidence, 4),
                "bbox": {
                    "x": round(x1, 2),
                    "y": round(y1, 2),
                    "width": round(width, 2),
                    "height": round(height, 2),
                },
                "center": {
                    "x": round(x1 + width / 2, 2),
                    "y": round(y1 + height / 2, 2),
                },
            }
        )
    return detections


def analyze_image(
    image_path: str | Path,
    output_path: str | Path,
    *,
    weights: str | Path | None = None,
    conf: float = 0.1,
    imgsz: int = 320,
    max_det: int = 1,
) -> dict[str, Any]:
    model = load_model(weights)
    image_path = Path(image_path)
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    result = model(str(image_path), conf=conf, imgsz=imgsz, max_det=max_det, verbose=False)[0]
    annotated = result.plot()
    cv2.imwrite(str(output_path), annotated)

    return {
        "source": str(image_path),
        "annotatedImage": str(output_path),
        "detections": detections_from_result(result, model),
    }


def _video_writer(path: Path, fps: float, width: int, height: int) -> cv2.VideoWriter:
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(path), fourcc, fps, (width, height))
    if not writer.isOpened():
        raise RuntimeError(f"Could not open video writer for {path}")
    return writer


def transcode_for_browser(raw_path: Path, final_path: Path) -> None:
    """Transcode OpenCV MP4 output to browser-friendly H.264 when ffmpeg is available."""
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    command = [
        ffmpeg,
        "-y",
        "-loglevel",
        "error",
        "-i",
        str(raw_path),
        "-vcodec",
        "libx264",
        "-preset",
        "veryfast",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        "-an",
        str(final_path),
    ]
    try:
        subprocess.run(command, check=True, capture_output=True, text=True)
    except Exception:
        shutil.copyfile(raw_path, final_path)


def analyze_video(
    video_path: str | Path,
    output_dir: str | Path,
    *,
    weights: str | Path | None = None,
    conf: float = 0.1,
    imgsz: int = 320,
    max_det: int = 1,
    max_frames: int | None = None,
) -> dict[str, Any]:
    model = load_model(weights)
    video_path = Path(video_path)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    source_frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)

    raw_video = output_dir / "annotated.raw.mp4"
    annotated_video = output_dir / "annotated.mp4"
    metrics_path = output_dir / "metrics.json"
    writer = _video_writer(raw_video, fps, width, height)

    frame_metrics: list[dict[str, Any]] = []
    detection_count_series: list[dict[str, Any]] = []
    center_series: list[dict[str, Any]] = []
    total_detections = 0
    confidence_sum = 0.0
    frames_with_detections = 0
    started_at = time.time()
    frame_index = 0

    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            if max_frames is not None and frame_index >= max_frames:
                break

            result = model(frame, conf=conf, imgsz=imgsz, max_det=max_det, verbose=False)[0]
            detections = detections_from_result(result, model)
            annotated = result.plot()
            writer.write(annotated)

            timestamp = frame_index / fps
            detection_count = len(detections)
            total_detections += detection_count
            if detections:
                frames_with_detections += 1
                confidence_sum += sum(d["confidence"] for d in detections)
                best = max(detections, key=lambda d: d["confidence"])
                center_series.append(
                    {
                        "frame": frame_index,
                        "time": round(timestamp, 3),
                        "x": best["center"]["x"],
                        "y": best["center"]["y"],
                        "confidence": best["confidence"],
                    }
                )

            detection_count_series.append(
                {
                    "frame": frame_index,
                    "time": round(timestamp, 3),
                    "count": detection_count,
                }
            )
            if frame_index % 30 == 0:
                frame_metrics.append(
                    {
                        "frame": frame_index,
                        "time": round(timestamp, 3),
                        "detections": detections,
                    }
                )
            frame_index += 1
    finally:
        cap.release()
        writer.release()

    transcode_for_browser(raw_video, annotated_video)
    raw_video.unlink(missing_ok=True)

    processed_duration = frame_index / fps if fps else 0.0
    average_confidence = confidence_sum / total_detections if total_detections else 0.0
    metrics = {
        "sourceVideo": video_path.name,
        "annotatedVideo": annotated_video.name,
        "imageSize": {"width": width, "height": height},
        "fps": round(fps, 3),
        "sourceFrameCount": source_frame_count,
        "processedFrameCount": frame_index,
        "processedDurationSeconds": round(processed_duration, 3),
        "processingSeconds": round(time.time() - started_at, 3),
        "summary": {
            "totalDetections": total_detections,
            "framesWithDetections": frames_with_detections,
            "detectionRate": round(frames_with_detections / frame_index, 4) if frame_index else 0,
            "visibleSeconds": round(frames_with_detections / fps, 3) if fps else 0,
            "averageConfidence": round(average_confidence, 4),
            "maxDetectionsInFrame": max((p["count"] for p in detection_count_series), default=0),
        },
        "series": {
            "detectionCount": detection_count_series,
            "bestCenter": center_series,
        },
        "sampledFrames": frame_metrics,
    }
    with metrics_path.open("w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    return metrics
