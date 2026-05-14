# Salamander Deployment AI

YOLO-based salamander video analysis app. Upload a video or run the included
`ensantina.mp4` sample to produce an annotated video and detection metrics.

## Project Layout

- `YOLO/backend/model/` - FastAPI backend and YOLO inference code.
- `YOLO/backend/model/weights/salamander.pt` - default trained checkpoint.
- `YOLO/dataset/ensantina/` - sample YOLO-format dataset for smoke tests.
- `YOLO/frontend/` - Vite React frontend for upload, playback, and metrics.
- `ensantina.mp4` - sample video used by the backend sample endpoint.

## Prerequisites

- Python 3.11 or newer
- Node.js 20 or newer
- Git

PowerShell examples use `.\.venv\Scripts\python.exe`. Git Bash examples use
`.venv/Scripts/python.exe`. On macOS/Linux bash, use `.venv/bin/python` instead.

## Backend Setup

PowerShell:

```powershell
cd YOLO/backend/model
if (!(Test-Path .\.venv\Scripts\python.exe)) { python -m venv .venv }
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000
```

Git Bash:

```bash
cd YOLO/backend/model
test -x .venv/Scripts/python.exe || python -m venv .venv
.venv/Scripts/python.exe -m pip install --upgrade pip
.venv/Scripts/python.exe -m pip install -r requirements.txt
.venv/Scripts/python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000
```

Health check:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/health
```

```bash
curl http://127.0.0.1:8000/api/health
```

Useful backend environment variables:

- `YOLO_WEIGHTS` - override the model checkpoint path.
- `CORS_ORIGINS` - comma-separated list of allowed frontend origins.

## Frontend Setup

Open a second terminal from the repository root.

PowerShell or Git Bash:

```bash
cd YOLO/frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open `http://127.0.0.1:5173`.

If the backend is running somewhere else, set `VITE_API_URL`.

PowerShell:

```powershell
$env:VITE_API_URL="http://127.0.0.1:8000"
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Git Bash:

```bash
VITE_API_URL="http://127.0.0.1:8000" npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

## Using the App

1. Start the backend on port `8000`.
2. Start the frontend on port `5173`.
3. Scroll to the analysis workspace.
4. Upload a video, or use the included `ensantina.mp4` sample.
5. Review the annotated video, detection count, detection rate, visible time,
   average confidence, detection timeline, and center-path plot.

## Command-Line Inference

Run a single image.

PowerShell:

```powershell
cd YOLO/backend/model
.\.venv\Scripts\python.exe scripts\analyze_image.py ..\..\dataset\ensantina\images\val\eeaca3d6-ensantina_0032.jpg --output data\checkpoints\single.jpg --conf 0.25
```

Git Bash:

```bash
cd YOLO/backend/model
.venv/Scripts/python.exe scripts/analyze_image.py ../../dataset/ensantina/images/val/eeaca3d6-ensantina_0032.jpg --output data/checkpoints/single.jpg --conf 0.25
```

Run a video.

PowerShell:

```powershell
cd YOLO/backend/model
.\.venv\Scripts\python.exe scripts\analyze_video.py ..\..\..\ensantina.mp4 --output-dir data\checkpoints\video --conf 0.25 --max-frames 60
```

Git Bash:

```bash
cd YOLO/backend/model
.venv/Scripts/python.exe scripts/analyze_video.py ../../../ensantina.mp4 --output-dir data/checkpoints/video --conf 0.25 --max-frames 60
```

## Training

For a stronger model, build a combined Label Studio export from multiple videos
and label at least 150 total frames with the `salamander` class. Export as
`YOLO` with images included, then prepare a split dataset and train from it.

PowerShell:

```powershell
cd YOLO/backend/model
.\.venv\Scripts\python.exe scripts\prepare_dataset.py --export-dir data\labelstudio_exports\salamander-combined-yolo --output ..\..\dataset\salamander-combined --val-fraction 0.2 --seed 42
.\.venv\Scripts\python.exe scripts\train.py --data ..\..\dataset\salamander-combined\data.yaml --name salamander-combined-150 --epochs 100 --imgsz 640 --batch 8 --device cpu
Copy-Item .\runs\detect\salamander-combined-150\weights\best.pt .\weights\salamander.pt -Force
```

Git Bash:

```bash
cd YOLO/backend/model
.venv/Scripts/python.exe scripts/prepare_dataset.py --export-dir data/labelstudio_exports/salamander-combined-yolo --output ../../dataset/salamander-combined --val-fraction 0.2 --seed 42
.venv/Scripts/python.exe scripts/train.py --data ../../dataset/salamander-combined/data.yaml --name salamander-combined-150 --epochs 100 --imgsz 640 --batch 8 --device cpu
cp runs/detect/salamander-combined-150/weights/best.pt weights/salamander.pt
```

Restart the backend after replacing the checkpoint. See `YOLO/README.md` for
the full retraining workflow and dataset count checks.

## Verification

Frontend, PowerShell or Git Bash:

```bash
cd YOLO/frontend
npm run lint
npm run build
```

Backend syntax check.

PowerShell:

```powershell
cd YOLO/backend/model
.\.venv\Scripts\python.exe -m py_compile app.py analyzer.py scripts\analyze_image.py scripts\analyze_video.py scripts\train.py scripts\live_inference.py scripts\prepare_dataset.py scripts\visualize_augmentations.py
```

Git Bash:

```bash
cd YOLO/backend/model
.venv/Scripts/python.exe -m py_compile app.py analyzer.py scripts/analyze_image.py scripts/analyze_video.py scripts/train.py scripts/live_inference.py scripts/prepare_dataset.py scripts/visualize_augmentations.py
```

## More Details

See `YOLO/README.md` for dataset notes, training notes, inference checkpoints,
metrics, and the color masking vs YOLO comparison.
