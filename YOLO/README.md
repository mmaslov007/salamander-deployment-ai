# Salamander YOLO Tracker

This folder contains the YOLO version of the salamander tracker.

## What is included

- `dataset/ensantina/` - 36 labeled frames split into train/val.
- `backend/model/weights/salamander-36.pt` - current YOLO model trained from the 36-frame dataset.
- `backend/model/app.py` - FastAPI backend for video analysis.
- `backend/model/analyzer.py` - shared image/video inference logic.
- `frontend/` - Vite React app for upload, annotated video playback, and metrics.

## Shell Notes

PowerShell examples use `.\.venv\Scripts\python.exe`. Git Bash examples use
`.venv/Scripts/python.exe`. On macOS/Linux bash, use `.venv/bin/python` instead.

## Run the Backend

PowerShell:

```powershell
cd YOLO/backend/model
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000
```

Git Bash:

```bash
cd YOLO/backend/model
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt
.venv/Scripts/python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000
```

Optional backend settings:

- `YOLO_WEIGHTS` - path to a different `.pt` checkpoint.
- `CORS_ORIGINS` - comma-separated frontend origins, defaulting to local Vite.

Health check:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/health
```

```bash
curl http://127.0.0.1:8000/api/health
```

## Run the Frontend

PowerShell or Git Bash:

```bash
cd YOLO/frontend
npm install
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173`.

If the backend is running somewhere else:

```powershell
$env:VITE_API_URL="http://127.0.0.1:8000"
npm run dev -- --host 127.0.0.1
```

```bash
VITE_API_URL="http://127.0.0.1:8000" npm run dev -- --host 127.0.0.1
```

## Train Again

From `YOLO/backend/model`.

PowerShell:

```powershell
.\.venv\Scripts\python.exe scripts\train.py --data ..\..\dataset\ensantina\data.yaml --name ensantina-36 --epochs 50 --imgsz 320 --batch 8 --device cpu
```

Git Bash:

```bash
.venv/Scripts/python.exe scripts/train.py --data ../../dataset/ensantina/data.yaml --name ensantina-36 --epochs 50 --imgsz 320 --batch 8 --device cpu
```

For the current checkpoint, `last.pt` performed better at practical confidence thresholds than `best.pt`.
Copy the chosen checkpoint into `backend/model/weights/salamander-36.pt` before running the app.

## Dataset and Training Pipeline

The current prototype model uses 36 labeled frames from `ensantina.mp4`, exported
from Label Studio in YOLO with Images format. The dataset has one class,
`salamander`, with 29 training images and 7 validation images under
`dataset/ensantina/`.

Training uses Ultralytics YOLO11n at `imgsz=320` for fast iteration. The
checked-in checkpoint is `backend/model/weights/salamander-36.pt`. This is
enough to wire the app together and verify the full workflow, but the course
workflow recommends growing toward about 150 labeled frames with a mix of easy
and hard examples before treating the model as reliable.

## Inference Checkpoints

Run a single-image checkpoint.

PowerShell:

```powershell
.\.venv\Scripts\python.exe scripts\analyze_image.py ..\..\dataset\ensantina\images\val\84109402-ensantina_0036.jpg --output data\checkpoints\single.jpg --conf 0.25
```

Git Bash:

```bash
.venv/Scripts/python.exe scripts/analyze_image.py ../../dataset/ensantina/images/val/84109402-ensantina_0036.jpg --output data/checkpoints/single.jpg --conf 0.25
```

Run a video checkpoint.

PowerShell:

```powershell
.\.venv\Scripts\python.exe scripts\analyze_video.py ..\..\..\ensantina.mp4 --output-dir data\checkpoints\video --conf 0.25 --max-frames 60
```

Git Bash:

```bash
.venv/Scripts/python.exe scripts/analyze_video.py ../../../ensantina.mp4 --output-dir data/checkpoints/video --conf 0.25 --max-frames 60
```

## Metrics

The backend writes `metrics.json` for every analysis job. The frontend displays:

- total detections
- detection rate
- visible seconds
- average confidence
- detection-count timeline
- best bounding-box center path

This model was trained on only 36 frames, so it is good enough for wiring the product together but should be retrained with more labeled clips before treating the detections as reliable.

## Color Masking vs YOLO

Color masking is the right first tool when the salamander is visually distinct,
lighting is stable, and the background is plain. It is fast, simple, and easy to
explain, but it breaks down when the background has texture, lighting changes,
or multiple animals appear. YOLO is better for textured footage and changing
pose because it learns the salamander shape from labeled examples, but it costs
more time: you need labeled frames, training, inference code, and periodic
retraining as new videos introduce new conditions. Use color masking for simple,
controlled lab footage; use YOLO for field-like footage or anything with visual
variation.
