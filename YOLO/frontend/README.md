# Salamander YOLO Frontend

React/Vite UI for the salamander YOLO tracker. It talks to the FastAPI backend
in `../backend/model`, launches video analysis jobs, plays the annotated result,
and renders detection metrics.

## Run

PowerShell or Git Bash:

```bash
npm install
npm run dev -- --host 127.0.0.1
```

The app expects the backend at `http://localhost:8000`. Override with
`VITE_API_URL` if needed.

PowerShell:

```powershell
$env:VITE_API_URL="http://127.0.0.1:8000"
npm run dev -- --host 127.0.0.1
```

Git Bash:

```bash
VITE_API_URL="http://127.0.0.1:8000" npm run dev -- --host 127.0.0.1
```

## Scripts

- `npm run dev` - start Vite locally
- `npm run build` - production build
- `npm run lint` - ESLint check
- `npm run preview` - preview a production build

Keep the frontend focused on the workflow: choose a video, run analysis, review
the annotated output, and inspect metrics.
