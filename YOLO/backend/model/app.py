"""FastAPI backend for salamander YOLO video analysis."""
from __future__ import annotations

import json
import os
import shutil
import traceback
import uuid
from pathlib import Path
from typing import Any

from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from analyzer import DEFAULT_WEIGHTS, MODEL_ROOT, analyze_video


REPO_ROOT = MODEL_ROOT.parents[2]
DATA_ROOT = MODEL_ROOT / "data"
JOBS_ROOT = DATA_ROOT / "jobs"
JOBS_ROOT.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Salamander YOLO Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.environ.get(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/outputs", StaticFiles(directory=str(JOBS_ROOT)), name="outputs")

jobs: dict[str, dict[str, Any]] = {}


def job_urls(job_id: str) -> dict[str, str]:
    return {
        "annotatedVideoUrl": f"/outputs/{job_id}/annotated.mp4",
        "metricsUrl": f"/outputs/{job_id}/metrics.json",
    }


def read_summary(job_dir: Path) -> dict[str, Any] | None:
    metrics_path = job_dir / "metrics.json"
    if not metrics_path.exists():
        return None
    with metrics_path.open("r", encoding="utf-8") as f:
        metrics = json.load(f)
    return metrics.get("summary")


def run_analysis_job(
    *,
    job_id: str,
    video_path: Path,
    conf: float,
    imgsz: int,
    max_det: int,
    max_frames: int | None,
    cleanup_video: bool = False,
) -> None:
    job_dir = JOBS_ROOT / job_id
    jobs[job_id].update({"status": "processing", "message": "Running YOLO inference"})
    try:
        analyze_video(
            video_path,
            job_dir,
            weights=DEFAULT_WEIGHTS,
            conf=conf,
            imgsz=imgsz,
            max_det=max_det,
            max_frames=max_frames,
        )
        jobs[job_id].update(
            {
                "status": "done",
                "message": "Analysis complete",
                "summary": read_summary(job_dir),
                **job_urls(job_id),
            }
        )
    except Exception as exc:
        jobs[job_id].update(
            {
                "status": "error",
                "message": str(exc),
                "traceback": traceback.format_exc(),
            }
        )
    finally:
        if cleanup_video:
            video_path.unlink(missing_ok=True)


def create_job(
    *,
    background_tasks: BackgroundTasks,
    source_video: Path,
    original_filename: str,
    conf: float,
    imgsz: int,
    max_det: int,
    max_frames: int | None,
    cleanup_source: bool = False,
) -> dict[str, Any]:
    if not DEFAULT_WEIGHTS.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Model weights not found at {DEFAULT_WEIGHTS}. Train the model first.",
        )

    job_id = str(uuid.uuid4())
    job_dir = JOBS_ROOT / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    jobs[job_id] = {
        "jobId": job_id,
        "status": "queued",
        "message": "Queued for analysis",
        "filename": original_filename,
        "params": {
            "conf": conf,
            "imgsz": imgsz,
            "maxDet": max_det,
            "maxFrames": max_frames,
        },
    }
    background_tasks.add_task(
        run_analysis_job,
        job_id=job_id,
        video_path=source_video,
        conf=conf,
        imgsz=imgsz,
        max_det=max_det,
        max_frames=max_frames,
        cleanup_video=cleanup_source,
    )
    return jobs[job_id]


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "weightsReady": DEFAULT_WEIGHTS.exists(),
        "weightsPath": str(DEFAULT_WEIGHTS),
    }


@app.post("/api/analyze")
async def analyze_upload(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    conf: float = Form(0.25),
    imgsz: int = Form(320),
    max_det: int = Form(1),
    max_frames: int | None = Form(None),
) -> dict[str, Any]:
    if not file.filename:
        raise HTTPException(status_code=400, detail="A video file is required")

    suffix = Path(file.filename).suffix.lower()
    if suffix not in {".mp4", ".mov", ".m4v", ".avi", ".webm", ".mkv"}:
        raise HTTPException(status_code=400, detail="Upload a video file")

    upload_dir = DATA_ROOT / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)
    stored_video = upload_dir / f"{uuid.uuid4()}{suffix}"
    with stored_video.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        return create_job(
            background_tasks=background_tasks,
            source_video=stored_video,
            original_filename=file.filename,
            conf=conf,
            imgsz=imgsz,
            max_det=max_det,
            max_frames=max_frames,
            cleanup_source=True,
        )
    except Exception:
        stored_video.unlink(missing_ok=True)
        raise


@app.post("/api/analyze-sample")
def analyze_sample(
    background_tasks: BackgroundTasks,
    conf: float = Form(0.25),
    imgsz: int = Form(320),
    max_det: int = Form(1),
    max_frames: int | None = Form(None),
) -> dict[str, Any]:
    sample = REPO_ROOT / "ensantina.mp4"
    if not sample.exists():
        raise HTTPException(status_code=404, detail="ensantina.mp4 was not found in the repo root")
    return create_job(
        background_tasks=background_tasks,
        source_video=sample,
        original_filename=sample.name,
        conf=conf,
        imgsz=imgsz,
        max_det=max_det,
        max_frames=max_frames,
    )


@app.get("/api/jobs/{job_id}")
def get_job(job_id: str) -> dict[str, Any]:
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
