# Salamander Deployment

A full-stack application for video processing and centroid detection. Upload videos, apply color-based binarization, detect centroids, and download results as CSV.

## Project Structure

- **Frontend** (`src/frontend/`): Next.js React UI for video upload, preview, and result download
- **Server** (`src/centroid-finder/server/`): Express.js backend API for video management and job orchestration
- **Processor** (`src/centroid-finder/processor/`): Java application for video frame processing and centroid detection

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Git

### Build & Run

```bash
cd src/
docker compose build
docker compose up
```

Access the app at:
Localhost: **http://localhost:3000**
VM: **http://vm-ip:3000**

### Check Logs

```bash
docker compose logs -f server
docker compose logs -f frontend
```

### Stop

```bash
docker compose down
```

## How It Works

1. **Upload/Select**: Choose a video from the frontend
2. **Preview**: View thumbnail, adjust target color and threshold
3. **Process**: Submit for processing (spawns Java centroid finder)
4. **Download**: Once complete, download the CSV with centroid coordinates

## Tech Stack

- **Frontend**: Next.js, Material-UI, React
- **Backend**: Express.js, Node.js
- **Processor**: Java 21, Maven, JavaCV
- **DevOps**: Docker, Docker Compose

## Environment Variables

See `.env` in `src/centroid-finder/` for configuration (paths, ports, etc.).

## Testing

### Run Tests Locally

```bash
# Java tests
cd src/centroid-finder/processor && mvn test

# Node.js backend tests
cd src/centroid-finder/server && npm test

# Cypress E2E tests (requires Docker running)
cd src/frontend && npm run cypress:run
```

### Test Coverage

- **Java Processor**: 45 unit tests covering image processing logic
- **Node.js Backend**: 4 API integration tests
- **Frontend E2E**: 6 Cypress end-to-end tests
- **Total**: 55+ tests ensuring reliability

## CI/CD Pipeline

Automated workflows handle testing and deployment:

- **Test Workflow**: Runs on push/PR to `main` or `dev` - executes all 55+ tests (Java, Node.js, E2E)
- **Deploy Workflow**: Runs on push to `main` (after tests pass) - builds and deploys to VM

### Setting Up Deployment

To enable auto-deployment to your VM, add these GitHub Secrets (Settings → Secrets and variables → Actions):

| Secret | Example |
|--------|---------|
| `VM_HOST` | `<your IP>` |
| `VM_USER` | `<your username>` |
| `VM_SSH_PRIVATE_KEY` | (your SSH private key) |
| `VM_DEPLOY_PATH` | `/root/salamander-deployment` |

Ensure your SSH public key is in `~/.ssh/authorized_keys` on the VM.

### Manual Deployment

To deploy manually to an Ubuntu VM:

```bash
# On VM:
git clone https://github.com/HumaGitGud/salamander-deployment.git
cd salamander-deployment/src
docker compose build
docker compose up -d
```

Then access at `http://<vm-ip>:3000`