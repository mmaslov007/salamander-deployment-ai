# Salamander Deployment AI

YOLO-based salamander video analysis app. Upload a video to produce an annotated
video and detection metrics.

## Quick Start

One command from the project root — first build takes ~8 minutes (PyTorch is large):

```powershell
docker-compose up --build
```

Subsequent starts skip the install and take ~10 seconds:

```powershell
docker-compose up
```

Then open `http://localhost:5173`.

---

## Project Layout

```
salamander-deployment-ai/
  data/
    salamander-data/    # Label Studio YOLO export (images + labels + classes.txt)
    labelstudio/        # Label Studio project data
  saladata/             # Raw extracted frames
  YOLO/
    backend/model/      # FastAPI backend, YOLO inference, training scripts
      weights/          # Trained model checkpoints (salamander.pt)
      scripts/          # Training and dataset prep scripts
    frontend/           # Vite React frontend
  docker-compose.yml
```

---

## Manual Setup (without Docker)

**Prerequisites:** Python 3.11+, Node.js 20+

**Terminal 1 — Backend:**

```powershell
cd YOLO/backend/model
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000
```

**Terminal 2 — Frontend:**

```powershell
cd YOLO/frontend
npm install
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173`. Health check: `Invoke-RestMethod http://127.0.0.1:8000/api/health`

---

## Retraining the Model

Run all training scripts from `YOLO/backend/model` using `.\.venv\Scripts\python.exe`.

### Step 1 — Extract frames from video

Use ffmpeg to pull evenly-spaced frames from your footage. Aim for 150+ total
frames across varied angles, distances, and lighting.

**Calculate fps:** `frames_wanted / total_seconds`
- 80 frames from a 4-min video: `80 / 240 = 0.333`
- 30 frames from an 8-min video: `30 / 480 = 0.0625`

```powershell
ffmpeg -i "video1.mp4" -vf fps=0.333 -frames:v 80 "saladata/v1_frame_%04d.jpg"
ffmpeg -i "video2.mp4" -vf fps=0.0625 -frames:v 30 "saladata/v2_frame_%04d.jpg"
```

Use different filename prefixes per video so files do not collide.

### Step 2 — Label images in Label Studio

Label Studio draws bounding boxes and exports labels in YOLO format.

**Start Label Studio:**

```powershell
docker run -it -p 8080:8080 -v ${PWD}/data/labelstudio:/label-studio/data heartexlabs/label-studio:latest
```

Open `http://localhost:8080` and create a local account.

**Create a project:**

1. Click **Create**, give the project a name.
2. **Data Import** tab — drag in all JPGs from `saladata/`.
3. **Labeling Setup** tab — choose **Computer Vision > Object Detection with Bounding Boxes**.
4. Replace the placeholder labels with your class name (e.g. `salamander`).
5. Click **Save**.

**Label:**

Open each image, press the keyboard shortcut for your label, draw a tight box
around the object, and click **Submit**. Images with no object can be submitted
empty — YOLO treats them as negative samples.

**Export:**

1. Click **Export** from the project page.
2. Choose **YOLO with Images** (not YOLOv8 OBB or any other variant).
3. Extract the zip into `data/`. Result:

```
data/salamander-data/
  classes.txt
  images/
  labels/
```

### Step 3 — Prepare the dataset

Splits the Label Studio export into train/val folders and writes `data.yaml`.

```powershell
.\.venv\Scripts\python.exe scripts/prepare_dataset.py --export-dir ../../../data/salamander-data
```

- 80% of images → `data/dataset/images/train/` + matching labels
- 20% → `data/dataset/images/val/`
- Writes `data/dataset/data.yaml`

Re-run any time you add more labeled images — it wipes and rewrites `data/dataset/` each time.

Optional flags: `--val-fraction 0.15`, `--seed 123`

### Step 4 — Visualize augmentations

Generates a PDF showing what each YOLO augmentation looks like on your images.
Review it before training to decide which augmentations make sense.

```powershell
.\.venv\Scripts\python.exe scripts/visualize_augmentations.py --image-dir ../../../data/salamander-data/images
```

PDF is saved to `YOLO/backend/model/augmentations.pdf`. Key decisions:

- **flipud / fliplr** — flipping a salamander is fine; flipping text or asymmetric objects is not.
- **mosaic** — powerful for detecting partially visible objects; disable if you need the full object visible to trigger detection.

### Step 5 — Train

```powershell
.\.venv\Scripts\python.exe scripts/train.py --data data/dataset/data.yaml --name salamander-150 --epochs 100 --imgsz 640 --batch 8 --device cpu
```

First run downloads `yolo11n.pt` (~6 MB). Each epoch prints training losses
(`box_loss`, `cls_loss`, `dfl_loss` — should decrease) and validation accuracy
(`mAP50` — should increase, above 0.8 is good on a small dataset).

Too slow? Cut time roughly in half: `--imgsz 320 --epochs 50`

**Review results after training:**

- `runs/detect/salamander-150/results.png` — loss and accuracy curves. If `box_loss` is still falling at the last epoch, train for more epochs.
- `runs/detect/salamander-150/val_batch0_labels.jpg` — model predictions on validation images.

### Step 6 — Deploy the new weights

```powershell
Copy-Item .\runs\detect\salamander-150\weights\best.pt .\weights\salamander.pt -Force
```

Restart the backend (or Docker container) to load the new weights. No frontend
rebuild needed.

---

## Committing Training Data

All of the following should be in version control so the dataset is reproducible:

| Path | Contents |
|---|---|
| `saladata/` | Raw extracted frames |
| `data/salamander-data/` | Labeled YOLO export |
| `data/labelstudio/` | Label Studio project |
| `YOLO/backend/model/weights/salamander.pt` | Trained checkpoint |

Do **not** commit `data/labelstudio/.env` — it contains a secret key.

---

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `YOLO_WEIGHTS` | `weights/salamander.pt` | Override model checkpoint path |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Allowed frontend origins |
| `VITE_API_URL` | `http://localhost:8000` | Backend URL used by the frontend |

---

## Verification

```powershell
cd YOLO/frontend && npm run lint && npm run build
```

```powershell
cd YOLO/backend/model
.\.venv\Scripts\python.exe -m py_compile app.py analyzer.py scripts/analyze_image.py scripts/analyze_video.py scripts/train.py scripts/live_inference.py scripts/prepare_dataset.py scripts/visualize_augmentations.py
```

See `YOLO/README.md` for dataset notes, training metrics, and the color masking vs YOLO comparison.
