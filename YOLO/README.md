# Salamander YOLO Tracker

This folder contains the YOLO version of the salamander tracker.

## What is included

- `dataset/ensantina/` - sample YOLO-format dataset used for smoke tests and examples.
- `backend/model/weights/salamander.pt` - default YOLO checkpoint loaded by the app.
- `backend/model/app.py` - FastAPI backend for video analysis.
- `backend/model/analyzer.py` - shared image/video inference logic.
- `frontend/` - Vite React app for upload, annotated video playback, and metrics.

## Shell Notes

PowerShell examples use `.\.venv\Scripts\python.exe`. Git Bash examples use
`.venv/Scripts/python.exe`. On macOS/Linux bash, use `.venv/bin/python` instead.

## Prerequisites

- Python 3.12 or newer.
- Node.js 20 or newer.

## Run the Backend

Run the backend and frontend in separate terminals. The `cd` command below
assumes your terminal is at the repository root, `salamander-deployment-ai`. If
your prompt already ends in `YOLO/backend/model`, skip the `cd` line.

If port `8000` is already in use, the backend may already be running. Run the
health check below; if it returns `"status": "ok"`, leave that backend running
and start the frontend in a second terminal.

PowerShell:

```powershell
cd YOLO/backend/model
if (!(Test-Path .\.venv\Scripts\python.exe)) { python -m venv .venv }
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000
```

Git Bash:

```bash
cd YOLO/backend/model
test -x .venv/Scripts/python.exe || python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt
.venv/Scripts/python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000
```

If you are on macOS/Linux bash, replace `.venv/Scripts/python.exe` with
`.venv/bin/python`.

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

If port `5173` is already in use, the frontend may already be running at
`http://127.0.0.1:5173`.

PowerShell or Git Bash:

```bash
# From the repository root, salamander-deployment-ai:
cd YOLO/frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open `http://127.0.0.1:5173`.

If the backend is running somewhere else:

```powershell
$env:VITE_API_URL="http://127.0.0.1:8000"
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

```bash
VITE_API_URL="http://127.0.0.1:8000" npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Keep the frontend on port `5173` unless you also add the alternate frontend
origin to the backend `CORS_ORIGINS` setting before starting Uvicorn.

## Retrain the Model

Retrain from a combined, labeled dataset instead of relying on the sample clip
alone. Use the same Label Studio frame-labeling workflow used for the original
dataset:

1. Combine the salamander videos you want represented in the model.
2. Export representative frames from the combined video output.
3. Label at least 150 total frames in Label Studio with one class:
   `salamander`.
4. Export from Label Studio as `YOLO` with images included.
5. Unzip the export under `YOLO/backend/model/data/labelstudio_exports/`.

Aim for varied examples: different clips, lighting, poses, backgrounds,
partially visible animals, and a few hard frames. Avoid filling the dataset with
near-duplicate adjacent frames.

Example export folder:

```text
YOLO/backend/model/data/labelstudio_exports/salamander-combined-yolo/
  classes.txt
  images/
  labels/
```

From `YOLO/backend/model`, prepare a train/validation split.

PowerShell:

```powershell
.\.venv\Scripts\python.exe scripts\prepare_dataset.py --export-dir data\labelstudio_exports\salamander-combined-yolo --output ..\..\dataset\salamander-combined --val-fraction 0.2 --seed 42
(Get-ChildItem ..\..\dataset\salamander-combined\images\train,..\..\dataset\salamander-combined\images\val -File).Count
```

Git Bash:

```bash
.venv/Scripts/python.exe scripts/prepare_dataset.py --export-dir data/labelstudio_exports/salamander-combined-yolo --output ../../dataset/salamander-combined --val-fraction 0.2 --seed 42
find ../../dataset/salamander-combined/images/train ../../dataset/salamander-combined/images/val -type f | wc -l
```

The count should be at least `150`. If it is lower, label and export more
frames before training.

Train a new checkpoint.

PowerShell:

```powershell
.\.venv\Scripts\python.exe scripts\train.py --data ..\..\dataset\salamander-combined\data.yaml --name salamander-combined-150 --epochs 100 --imgsz 640 --batch 8 --device cpu
```

Git Bash:

```bash
.venv/Scripts/python.exe scripts/train.py --data ../../dataset/salamander-combined/data.yaml --name salamander-combined-150 --epochs 100 --imgsz 640 --batch 8 --device cpu
```

For quick CPU-only test runs, use `--epochs 50 --imgsz 320`. On an NVIDIA GPU,
replace `--device cpu` with `--device 0`.

After training, compare `best.pt` and `last.pt` on sample images and videos.
Usually `best.pt` is the first checkpoint to try. Replace the app checkpoint
with the selected file, then restart the backend.

PowerShell:

```powershell
Copy-Item .\runs\detect\salamander-combined-150\weights\best.pt .\weights\salamander.pt -Force
```

Git Bash:

```bash
cp runs/detect/salamander-combined-150/weights/best.pt weights/salamander.pt
```

To test a new checkpoint without replacing the default file, start the backend
with `YOLO_WEIGHTS` pointing at the trained `.pt` file.

## Dataset and Training Pipeline

The app expects YOLO-format datasets with this structure:

```text
dataset-name/
  data.yaml
  images/train/
  images/val/
  labels/train/
  labels/val/
```

Training uses Ultralytics YOLO11n. `imgsz=320` is useful for fast iteration;
`imgsz=640` is slower but usually better for a final retrain. The backend loads
`backend/model/weights/salamander.pt` by default.

## Inference Checkpoints

Run a single-image checkpoint.

PowerShell:

```powershell
.\.venv\Scripts\python.exe scripts\analyze_image.py ..\..\dataset\ensantina\images\val\eeaca3d6-ensantina_0032.jpg --output data\checkpoints\single.jpg --conf 0.25
```

Git Bash:

```bash
.venv/Scripts/python.exe scripts/analyze_image.py ../../dataset/ensantina/images/val/eeaca3d6-ensantina_0032.jpg --output data/checkpoints/single.jpg --conf 0.25
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

Retraining with a larger, more varied labeled dataset will make these metrics
more useful for real review work.

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
