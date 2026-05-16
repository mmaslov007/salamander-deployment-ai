# Salamander Deployment AI

YOLO-based salamander video analysis app. The backend runs FastAPI and
Ultralytics YOLO, while the frontend is a Vite React interface for uploading a
video, viewing the annotated result, and reviewing detection metrics.

The current `main` branch uses the YOLO implementation under `YOLO/`. The old
Java/color-masking prototype is no longer part of this branch.

## Quick Start With Docker

Prerequisites:

- Docker Desktop
- Git

From the repository root:

```powershell
docker compose up --build
```

If your Docker install still uses the older Compose command:

```powershell
docker-compose up --build
```

After the containers start, open:

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:8000/api/health`

For later runs, you can usually skip the rebuild:

```powershell
docker compose up
```

## Project Layout

```text
salamander-deployment-ai/
  README.md
  docker-compose.yml
  data/
    labelstudio/        # Label Studio project/export data
    salamander-data/    # Label Studio YOLO export
  saladata/             # Extracted source frames
  YOLO/
    README.md           # Detailed YOLO workflow and training notes
    dataset/ensantina/  # Small YOLO-format dataset currently in the repo
    backend/model/
      app.py            # FastAPI API
      analyzer.py       # Shared YOLO image/video inference logic
      requirements.txt
      weights/
        salamander.pt   # Default model checkpoint loaded by the app
    frontend/
      src/              # React app
      public/           # Frontend static assets
```

## Manual Setup

Use this when you do not want Docker. Run the backend and frontend in separate
terminals.

Prerequisites:

- Python 3.11 or newer
- Node.js 20 or newer
- `ffmpeg` available on your PATH for video handling

### Backend

PowerShell:

```powershell
cd YOLO/backend/model
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000
```

Git Bash on Windows:

```bash
cd YOLO/backend/model
python -m venv .venv
.venv/Scripts/python.exe -m pip install --upgrade pip
.venv/Scripts/python.exe -m pip install -r requirements.txt
.venv/Scripts/python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000
```

macOS/Linux bash:

```bash
cd YOLO/backend/model
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m uvicorn app:app --host 127.0.0.1 --port 8000
```

Health check:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/health
```

```bash
curl http://127.0.0.1:8000/api/health
```

### Frontend

PowerShell or Git Bash:

```bash
cd YOLO/frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open `http://127.0.0.1:5173`.

If the backend is running somewhere other than `http://localhost:8000`, set
`VITE_API_URL` before starting the frontend.

PowerShell:

```powershell
$env:VITE_API_URL="http://127.0.0.1:8000"
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Git Bash:

```bash
VITE_API_URL="http://127.0.0.1:8000" npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

## Current Model And Data

- The app loads `YOLO/backend/model/weights/salamander.pt` by default.
- `YOLO/dataset/ensantina/` contains the small YOLO-format dataset currently
  checked into the repo.
- `saladata/video/ensantina.mp4` is the source video used for current examples
  and testing.
- `data/labelstudio/`, `data/salamander-data/`, and `saladata/` contain the
  labeling/export artifacts used to reproduce or expand the dataset.

To use a different checkpoint without replacing `salamander.pt`, set
`YOLO_WEIGHTS` before starting the backend.

PowerShell:

```powershell
$env:YOLO_WEIGHTS="C:\path\to\best.pt"
.\.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000
```

Git Bash:

```bash
YOLO_WEIGHTS="/c/path/to/best.pt" .venv/Scripts/python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000
```

## Useful Commands

Run frontend checks:

```bash
cd YOLO/frontend
npm run lint
npm run build
```

Compile-check backend Python files from `YOLO/backend/model`.

PowerShell:

```powershell
.\.venv\Scripts\python.exe -m py_compile app.py analyzer.py scripts/analyze_image.py scripts/analyze_video.py scripts/train.py scripts/live_inference.py scripts/prepare_dataset.py scripts/visualize_augmentations.py
```

Git Bash:

```bash
.venv/Scripts/python.exe -m py_compile app.py analyzer.py scripts/analyze_image.py scripts/analyze_video.py scripts/train.py scripts/live_inference.py scripts/prepare_dataset.py scripts/visualize_augmentations.py
```

Analyze the included video from `YOLO/backend/model`.

PowerShell:

```powershell
.\.venv\Scripts\python.exe scripts\analyze_video.py ..\..\..\saladata\video\ensantina.mp4 --output-dir data\checkpoints\video --conf 0.25 --max-frames 60
```

Git Bash:

```bash
.venv/Scripts/python.exe scripts/analyze_video.py ../../../saladata/video/ensantina.mp4 --output-dir data/checkpoints/video --conf 0.25 --max-frames 60
```

## Training Workflow

The detailed workflow lives in `YOLO/README.md`. In short:

1. Extract representative frames from one or more salamander videos.
2. Label bounding boxes in Label Studio.
3. Export as `YOLO with Images`.
4. Prepare a train/validation split with `scripts/prepare_dataset.py`.
5. Train with `scripts/train.py`.
6. Copy the chosen checkpoint to `YOLO/backend/model/weights/salamander.pt`.
7. Restart the backend or Docker containers.

The course comparison requirement is documented in `YOLO/README.md` under
`Color Masking vs YOLO`.
