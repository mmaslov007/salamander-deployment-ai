# Salamander Frontend

A Next.js application for processing and analyzing video content, specifically designed for tracking salamander movements.
Slides: https://docs.google.com/presentation/d/18HyPZrTLjIWKlpEwyTjyAyKp1GxyvM-kpJRVWsPVF1o/edit?slide=id.gcb9a0b074_1_103#slide=id.gcb9a0b074_1_103

## Project Overview

This application provides a user interface for:
- Viewing and selecting videos for processing
- Previewing video frames with customizable color tracking
- Processing videos to track specific colors
- Downloading analysis results in CSV format

## Prerequisites

- Node.js (v20.17.0 or higher)
- npm (comes with Node.js)
- Git
- Docker (for backend setup)
- Backend server (either via Docker or downloaded zip)

## Setup Instructions

### Backend Setup

You have two options to set up the backend:

1. Using Docker (Recommended):
```bash
# Pull and run the backend container
docker run -p 3000:3000 \
  -v "${winpath}/server/videos:/app/server/videos" \
  -v "${winpath}/server/results:/app/server/results" \
  ghcr.io/mmaslov007/centroid-finder:latest
```

2. Using the zip file:
- Download the backend zip file from https://github.com/HumaGitGud/centroid-finder/tree/server
- Extract the contents
- Follow the backend's README instructions for setup

The backend server must be running at `http://localhost:3000` for the frontend to work properly.

### Frontend Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd salamander-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3001`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run cypress:open` - Open Cypress test runner
- `npm run cypress:run` - Run Cypress tests in headless mode

## Testing

The project uses Cypress for end-to-end testing. To run the tests:

1. Ensure the backend server is running
2. Start the development server:
```bash
npm run dev
```

3. In a separate terminal, run the tests:
```bash
npm run cypress:open  # For interactive mode
# or
npm run cypress:run   # For headless mode
```

## API Endpoints

The application communicates with a backend server at `http://localhost:3000`:

- `GET /thumbnail/:filename` - Get video thumbnail
- `POST /process/:filename` - Start video processing
  - Query parameters:
    - `targetColor`: Hex color code (e.g., FF0000)
    - `threshold`: Number between 0-100
- `GET /results/:filename` - Download processed results

## Special Notes

- The application requires a running backend server at `http://localhost:3000`
- Video processing may take some time depending on the video length
- Color tracking is sensitive to lighting conditions and video quality
- Results are provided in CSV format with timestamp and coordinate data
- Make sure both frontend and backend servers are running before using the application

## Project Structure

```
salamander-frontend/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── preview/      # Preview page components
│   │   └── ...
│   └── ...
├── cypress/             # Cypress test files
│   ├── e2e/            # End-to-end tests
│   └── support/        # Test support files
├── public/             # Static assets
└── ...
```
