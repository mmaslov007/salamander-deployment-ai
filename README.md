# Salamander Deployment AI

YOLO-based salamander video analysis app. Upload a video or run the included
`ensantina.mp4` sample to produce an annotated video and detection metrics.

## Project Layout

- `YOLO/backend/model/` - FastAPI backend and YOLO inference code.
- `YOLO/backend/model/weights/salamander-36.pt` - current trained checkpoint.
- `YOLO/dataset/ensantina/` - 36 labeled frames split into train and val sets.
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
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000
```

Git Bash:

```bash
cd YOLO/backend/model
python -m venv .venv
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
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173`.

If the backend is running somewhere else, set `VITE_API_URL`.

PowerShell:

```powershell
$env:VITE_API_URL="http://127.0.0.1:8000"
npm run dev -- --host 127.0.0.1
```

Git Bash:

```bash
VITE_API_URL="http://127.0.0.1:8000" npm run dev -- --host 127.0.0.1
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
.\.venv\Scripts\python.exe scripts\analyze_image.py ..\..\dataset\ensantina\images\val\84109402-ensantina_0036.jpg --output data\checkpoints\single.jpg --conf 0.25
```

Git Bash:

```bash
cd YOLO/backend/model
.venv/Scripts/python.exe scripts/analyze_image.py ../../dataset/ensantina/images/val/84109402-ensantina_0036.jpg --output data/checkpoints/single.jpg --conf 0.25
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

The current checkpoint was trained from 36 labeled frames. To retrain from the
checked-in dataset:

PowerShell:

```powershell
cd YOLO/backend/model
.\.venv\Scripts\python.exe scripts\train.py --data ..\..\dataset\ensantina\data.yaml --name ensantina-36 --epochs 50 --imgsz 320 --batch 8 --device cpu
```

Git Bash:

```bash
cd YOLO/backend/model
.venv/Scripts/python.exe scripts/train.py --data ../../dataset/ensantina/data.yaml --name ensantina-36 --epochs 50 --imgsz 320 --batch 8 --device cpu
```

After training, copy the selected checkpoint to:

```text
YOLO/backend/model/weights/salamander-36.pt
```

The model is enough for the application workflow, but it should be retrained
with more labeled frames before using the results as reliable measurements.

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
