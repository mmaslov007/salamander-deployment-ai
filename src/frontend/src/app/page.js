// Home page

'use client';

import { useEffect, useRef } from 'react';
import { Box, Typography, Container } from '@mui/material';

// lizards floating animation
export default function Home() {
  // create a reference for the canvas element
  const canvasRef = useRef(null);

  useEffect(() => {
    // access the canvas and its context for drawing
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // resize function to adjust canvas size based on window size
    const resize = () => {
      canvas.width = window.innerWidth;  // set canvas width to window width
      canvas.height = window.innerHeight;  // set canvas height to window height
    };
    resize();  // call resize to set the initial canvas size
    window.addEventListener('resize', resize);  // update canvas size when the window is resized

    // create an array of emojis (lizards) with random positions, sizes, and movement directions
    const emojis = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width, // random x position
      y: Math.random() * canvas.height, // random y position
      dx: (Math.random() - 0.5) * 0.5, // random horizontal speed
      dy: (Math.random() - 0.5) * 0.5, // random vertical speed
      size: 20 + Math.random() * 20, // random size between 20 and 40
      symbol: '🐊',
    }));

    let animationFrameId; // variable to store the animation frame ID for cancelling later

    // function to animate the emojis on the canvas
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);  // clear the canvas before each frame
      emojis.forEach(e => {
        e.x += e.dx;  // update x position
        e.y += e.dy;  // update y position
        // bounce off the edges by reversing the speed when hitting a wall
        if (e.x < 0 || e.x > canvas.width) e.dx *= -1;
        if (e.y < 0 || e.y > canvas.height) e.dy *= -1;
        // draw each emoji at its new position
        ctx.font = `${e.size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(e.symbol, e.x, e.y); // draw the emoji at (x, y)
      });
      // request the next animation frame for smooth animation
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();  // start the animation loop

    // clean up when the component is unmounted
    return () => {
      cancelAnimationFrame(animationFrameId); // cancel the animation
      window.removeEventListener('resize', resize); // remove the resize event listener
    };
  }, []);  // empty dependency array means this effect runs only once after the initial render

  return (
    <>
    {/* the canvas with floating emojis */}
    <Box
      component="canvas"
      ref={canvasRef}  // assign the canvas reference
      sx={{
        position: 'fixed',  // position it as fixed background
        top: 0,
        left: 0,
        width: '100%',  // fill the entire screen width
        height: '100%',  // fill the entire screen height
        zIndex: -1  // place the canvas behind other elements
      }}
    />

    <Container>
      <Box 
        component="video" 
        src="/salamander.mp4"
        autoPlay 
        muted
        loop 
        playsInline
        sx={{
          width: 400,
          height: 'auto',
          display: 'block',
          margin: 'auto',
          borderRadius: 10,
          mb: 2,
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1, color: 'text.primary' }}>
        <Typography variant="h1" gutterBottom>
          Centroid Finder App
        </Typography>

        <Typography variant="body1" mb={4}>
          An easy-to-use tool for detecting, analyzing, and tracking centroids in images and videos based on chosen color thresholds
        </Typography>

        <Box component="section" mb={4}>
          <Typography variant="h2" gutterBottom>Key Features:</Typography>
          <ul>
            <li><strong>Binarize and Analyze Images:</strong> Access any thumbnail image and choose a color to find connected regions based on color similarity</li>
            <li><strong>Video Frame Processing:</strong> Select a video and let Centroid Finder process each frame, tracking the largest centroid and generating real-time results that can be saved to CSV</li>
            <li><strong>Real-Time Visualization:</strong> Preview a video thumbnail with desired color and threshold in real-time interactively</li>
            <li><strong>Export Results:</strong> Save centroid data to CSV files for further analysis or use in other settings</li>
          </ul>
        </Box>

        <Box component="section">
          <Typography variant="h2" gutterBottom>How It Works:</Typography>
          <ol>
            <li><strong>Select videos from directory:</strong> Detect your media files to get started</li>
            <li><strong>Set Parameters:</strong> Define your target color and the threshold for color similarity</li>
            <li><strong>Get Results:</strong> Process a video by detecting connected regions and calculating centroids</li>
          </ol>
        </Box>

      </Box>
    </Container>
    </>
  );
}