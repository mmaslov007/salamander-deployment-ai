// Preview page (display video information when clicked from videos list)

'use client';

import { useState, useEffect, useRef, use } from 'react';
import { binarizeImage } from './processor.js';
import { withJobStatus } from './withJobStatus.js';

import { Box, Typography, Slider, Button, Stack, InputLabel } from '@mui/material';
import { CircularProgress } from '@mui/material';

function PreviewPage({ params, setJobId, status, resultFile, setStatus }) {
  const { filename } = use(params);
  const [color, setColor] = useState('#000000'); // default black
  const [threshold, setThreshold] = useState(75); // default 75
  const [binarizeSettings, setBinarizeSettings] = useState(null); // color/threshold, or null
  const originalImgRef = useRef(null);
  const canvasRef = useRef(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // set canvas size and draw the binarized image
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = originalImgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');

    // set the canvas size based on the image size
    const setCanvasSize = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
    };

    const drawBinarized = () => {
      if (!binarizeSettings) {
        // clear canvas and fill with black if no binarizeSettings
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
      }

      // create offscreen canvas to get pixel data
      const offCanvas = document.createElement('canvas');
      offCanvas.width = img.naturalWidth;
      offCanvas.height = img.naturalHeight;
      const offCtx = offCanvas.getContext('2d');
      offCtx.drawImage(img, 0, 0);

      const imageData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);

      const { binarizedImageData, centroid } = binarizeImage(
        imageData,
        binarizeSettings.color,
        binarizeSettings.threshold
      );

      // put the binarized data on the canvas
      ctx.putImageData(binarizedImageData, 0, 0);

      // draw the centroid if it exists
      if (centroid) {
        ctx.beginPath();
        ctx.arc(centroid.x, centroid.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
      }
    };

    // set the canvas size and then draw the image
    if (!img.complete) {
      img.onload = () => {
        setCanvasSize();
        drawBinarized();
      };
    } else {
      setCanvasSize();
      drawBinarized();
    }

  }, [binarizeSettings, filename]); // trigger whenever binarizeSettings or filename change

  // trigger binarizeSettings update when color or threshold changes
  useEffect(() => {
    setBinarizeSettings({ color, threshold });
  }, [color, threshold]);

  // make a POST request with a given link - start processing job using saved binarizeSettings
  const handleStartProcess = async () => {
    if (!binarizeSettings) {
      alert("Please preview the binarized image first before processing.");
      return;
    }
    try {
      const hex = binarizeSettings.color.replace('#', '').toUpperCase();
      const res = await fetch(
        `${API_URL}/process/${filename}?targetColor=${hex}&threshold=${binarizeSettings.threshold}`,
        { method: 'POST' }
      );
      if (!res.ok) throw new Error("Failed to start processing");

      const data = await res.json();
      setJobId(data.jobId);
      setStatus('processing');
    } catch (err) {
      console.error("Error starting process:", err);
    }
  };

  // UI elements
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Preview Page
      </Typography>

      <Typography mb={4}>
        Now previewing: <strong>{filename}</strong>
      </Typography>

      {/* centered images */}
      <Stack direction="row" justifyContent="center" spacing={4} mb={3}>
        <Box>
          <Typography variant="h6" mb={1} textAlign="center">
            Original Thumbnail
          </Typography>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={originalImgRef}
            src={`${API_URL}/thumbnail/${filename}`}
            alt={`Original ${filename}`}
            style={{ maxWidth: 440, maxHeight: 440, display: 'block' }}
            crossOrigin="anonymous"
          />
        </Box>

        <Box>
          <Typography variant="h6" mb={1} textAlign="center">
            Binarized Thumbnail
          </Typography>
          <canvas
            ref={canvasRef}
            style={{ border: '1px solid black', maxWidth: 440, maxHeight: 440, display: 'block' }}
          />
        </Box>
      </Stack>

      {/* centered controls */}
      <Stack direction="row" spacing={6} justifyContent="center" alignItems="center" mb={3}>
        {/* color picker */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
            Target Color
          </Typography>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{ cursor: 'pointer' }}
          />
        </Box>

        {/* threshold slider */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 400 }}>
          <Typography sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
            Threshold: {threshold}
          </Typography>
          <Slider
            value={threshold}
            onChange={(e, val) => setThreshold(val)}
            min={0}
            max={100}
            valueLabelDisplay="off"
            color="success"
            sx={{ flexGrow: 1 }}
          />
        </Box>
      </Stack>


      {/* centered button */}
      <Box textAlign="center" mb={2}>
        <Button variant="contained" onClick={handleStartProcess} color="success">
          Process Video with These Settings
        </Button>
      </Box>

      {/* status display */}
      <Box textAlign="center" mt={2}>
        {status === 'processing' && (
          <Stack alignItems="center" spacing={1}>
            <CircularProgress />
            <Typography>Processing video...</Typography>
          </Stack>
        )}

        {status && status !== 'processing' && (
          <Typography>
            Status: <strong>{status}</strong>
          </Typography>
        )}
      </Box>

      {/* download link */}
      {status === 'done' && resultFile && (
        <Typography textAlign="center">
          <a href={`${API_URL}/results/${resultFile}`}>Download CSV result</a>
        </Typography>
      )}
    </Box>
  );
}

export default withJobStatus(PreviewPage); // wrap the PreviewPage with the HOC