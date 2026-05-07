# Salamander Server

## Objective
Build an express server that implements the Salamander API. Server will:
- List video files
- Generate a thumbnail (first frame of video)
- Kick off async video processing using Java JAR
- Report status of processing jobs

## Architecture (high level)
```text
[ React Frontend ]
        |
        v
[ Express Server ]
   |      |      |
   v      v      v
List  Thumbnail  Process Video
Files   Frame     (spawn Java)
                |
                v
        [ Java Video Processor (JAR) ]
                |
                v
        CSV Result File in /results
```

## Environment variables
    JAR_PATH=../target/videoProcessor.jar
    VIDEO_DIR=server/videos
    RESULTS_DIR=server/results
    THUMBNAIL_DIR=server/thumbnails

## Hints:

- **Use `.env` + `dotenv`:**  
  Store paths like the `videos/` directory and the `videoProcessor.jar` in a `.env` file.  
  Load them using the `dotenv` package in your Express server.

- **Generate Unique Job IDs:**  
  Use the `uuid` package to generate a unique `jobId` for each video processing request.

- **Spawn Java in Background (Non-blocking):**  
  Use Node’s `child_process.spawn()` to run the Java JAR asynchronously with the following settings:
  - `detached: true`
  - `stdio: 'ignore'`
  - Call `.unref()` on the child process  
  This prevents blocking the main thread and allows Express to return immediately.

- **Generate Thumbnails with `ffmpeg`:**  
  Use `ffmpeg` to extract the first frame of a video and return it as a JPEG image.

- **Keep Processing Logic in JAR:**  
  Dont implement centroid finding or graph search in Express.  
  Server should only coordinate the job. All logic must remain in the Java JAR.

- **Serve Static Files with `express.static`:**  
  Use `express.static()` to serve:
  - `/videos` (input video files)
  - `/results` (CSV output files)
  - `/thumbnails` (generated images)

- **Track Job Status:**  
  Keep job statuses either by:
  - Writing to a simple `jobs.json` file
  - Or using a lightweight database like SQLite  



## Salamander API - Endpoints

### List Videos
`GET /api/videos`  
Returns a list of available video files.  
**200 OK**: `["intro.mp4", "demo.mov"]`  
**500 Error**: `{ "error": "Error reading video directory" }`

### Generate Thumbnail
`GET /thumbnail/{filename}`  
Returns first video frame as JPEG.  
**200 OK**: JPEG binary  
**500 Error**: `{ "error": "Error generating thumbnail" }`

### Start Processing Job
`POST /process/{filename}?targetColor=<hex>&threshold=<int>`  
Begins video analysis.  
**202 Accepted**: `{ "jobId": "uuid" }`  
**400 Error**: Missing params  
**500 Error**: `{ "error": "Error starting job" }`

### Job Status
`GET /process/{jobId}/status`  
Checks job progress.  
**200 OK**: `"processing"` | `"done"` + result | `"error"`  
**404**: Job not found  
**500 Error**: `{ "error": "Error fetching job status" }`