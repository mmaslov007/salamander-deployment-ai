import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import ffmpegPath from 'ffmpeg-static';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: '../.env' });

const listVideos = (req, res) => {
    const videoDir = process.env.VIDEO_DIR;
    console.log('Video directory:', videoDir);
    if (!videoDir) {
        console.error('VIDEO_DIR not set in environment');
        return res.status(500).json({ error: 'VIDEO_DIR not set in environment' });
    }
    // read list of files in videoDir
    fs.readdir(videoDir, (err, files) => {
        if (err) {
            console.error('Error reading video directory:', err);
            return res.status(500).json({ error: 'Error reading video directory' });
        }
        console.log('Files found:', files);
        // filter for video files only
        const videoFiles = files.filter(f => /\.(mp4|mov|avi|mkv|webm)$/i.test(f));
        console.log('Video files:', videoFiles);
        res.json(videoFiles);
    });
};

const getThumbnail = (req, res) => {
    const videoDir = process.env.VIDEO_DIR; // file env location
    const { filename } = req.params; // url filename
    const videoPath = path.join(videoDir, filename); // construct filepath

    // check for file name and video existence
    if (!filename) {
        return res.status(400).json({ error: "Filename is required" });
    }
    if (!fs.existsSync(videoPath)) {
        return res.status(404).json({ error: "Video not found" });
    }

    try {
        // set response content-type to jpeg
        res.setHeader('Content-Type', 'image/jpeg');

        // run ffmpeg to extract the first frame as a JPEG using fluent-ffmpeg
        const ffmpeg = spawn(ffmpegPath, [
            '-i', videoPath,   // input video
            '-frames:v', '1',  // only 1 frame
            '-f', 'image2',    // force image format
            '-q:v', '2',       // set image quality
            '-update', '1',    // update the output pipe with 1 frame
            'pipe:1',          // output to stdout
            '-loglevel', 'quiet' // suppress all output except errors
        ]);

        // pipe ffmpeg output to response (pipe streams image directly to response)
        ffmpeg.stdout.pipe(res);

        // capture any stderr (error) output from ffmpeg
        ffmpeg.stderr.on('data', (data) => {
            console.error('ffmpeg stderr:', data.toString());
        });

        // handle errors when spawning the ffmpeg process
        ffmpeg.on('error', (err) => {
            console.error("Failed to start ffmpeg:", err);
            res.status(500).json({ error: "Error generating thumbnail" });
        });

        // handle ffmpeg process exit status
        ffmpeg.on('close', (code) => {
            if (code !== 0) {
                console.error(`ffmpeg exited with code ${code}`);
                if (!res.headersSent) {
                    res.status(500).json({ error: "Error generating thumbnail" });
                }
            }
        });

    } catch (err) {
        console.error("Thumbnail generation failed:", err);
        res.status(500).json({ error: "Error generating thumbnail" });
    }
};

const processVideo = async (req, res) => {
    const { filename } = req.params;
    const { targetColor, threshold } = req.query;
    const videoDir = process.env.VIDEO_DIR;
    const jarPath = process.env.JAR_PATH;
    const resultsDir = process.env.RESULTS_DIR;

    const videoPath = path.resolve(videoDir, filename);
    console.log('Video path:', videoPath);

    // Validate inputs
    if (!filename || !targetColor || !threshold) {
        return res.status(400).json({ error: 'Missing filename, targetColor, or threshold' });
    }
    if (!fs.existsSync(videoPath)) {
        console.error('Video file not found:', videoPath);
        return res.status(400).json({ error: 'Video file does not exist' });
    }
    if (!fs.existsSync(jarPath)) {
        console.error('JAR file not found:', jarPath);
        return res.status(500).json({ error: 'JAR file not found' });
    }
    if (!fs.existsSync(resultsDir)) {
        console.log('Creating results directory:', resultsDir);
        fs.mkdirSync(resultsDir, { recursive: true });
    }

    const jobId = uuidv4();  // Unique job ID
    const jobs = readJobs();  // Current jobs
    jobs[jobId] = { status: 'processing', filename, result: null };  // Add job
    writeJobs(jobs);  // Save updated jobs

    // Prepare args for the JAR
    const resultFile = path.resolve(resultsDir, `${jobId}.csv`);
    const args = [
        '-jar', jarPath,
        videoPath,
        resultFile,
        targetColor,
        threshold
    ];

    // Run the JAR asynchronously and capture output for debugging
    const javaProcess = spawn('java', args, {
        detached: false,
        stdio: ['ignore', 'pipe', 'pipe']
    });

    // Pipe stdout and stderr to server logs so we can see Java errors
    if (javaProcess.stdout) {
        javaProcess.stdout.on('data', (data) => {
            console.log(`java stdout: ${data.toString()}`);
        });
    }
    if (javaProcess.stderr) {
        javaProcess.stderr.on('data', (data) => {
            console.error(`java stderr: ${data.toString()}`);
        });
    }

    javaProcess.on('error', (err) => {
        console.error('Failed to start java process:', err);
    });

    javaProcess.on('exit', (code, signal) => {
        console.log(`java process exited with code=${code} signal=${signal}`);
    });

    // Poll for result file and check file size stability
    let lastSize = 0;
    const checkInterval = setInterval(() => {
        if (fs.existsSync(resultFile)) {
            const stats = fs.statSync(resultFile);
            const currentSize = stats.size;

            if (currentSize === lastSize) {
                // File size is stable, consider it done
                clearInterval(checkInterval);
                const jobs = readJobs();
                jobs[jobId] = { status: 'done', filename, result: path.basename(resultFile) };
                writeJobs(jobs);
            } else {
                // File size has changed, keep polling
                lastSize = currentSize;
            }
        }
    }, 2000);  // Check every 2 seconds

    res.status(202).json({ jobId });
};

const processJobStatus = (req, res) => {
    const { jobId } = req.params;
    const jobs = readJobs();
    if (!jobs[jobId]) {
        return res.status(404).json({ error: 'Job not found' });
    }
    res.json(jobs[jobId]);
}

// Helper functions to read and write jobs
const JOBS_FILE = process.env.JOBS_FILE;
const readJobs = () => {
    try {
        if (!fs.existsSync(JOBS_FILE)) return {};
        return JSON.parse(fs.readFileSync(JOBS_FILE, 'utf-8'));
    } catch (e) {
        return {};
    }
};
const writeJobs = (jobs) => {
    fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));
};

export default {
    listVideos,
    getThumbnail,
    processVideo,
    processJobStatus
};
