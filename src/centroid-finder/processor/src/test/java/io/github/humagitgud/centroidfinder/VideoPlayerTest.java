package io.github.humagitgud.centroidfinder;

import org.bytedeco.javacv.FFmpegFrameGrabber;
import org.bytedeco.javacv.Frame;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.io.File;
import static org.junit.jupiter.api.Assertions.*;

public class VideoPlayerTest {

    private String videoFile;

    @BeforeEach
    public void setUp() {
        // Initialize the video file path, can be modified for other video files for tests
        videoFile = "sampleInput/sampleVideo.mp4";
    }

    @Test
    public void testVideoPlayerCoreLogic() throws Exception {
        // Arrange: Ensure the video file exists
        File video = new File(videoFile);
        assertTrue(video.exists(), "Input video file should exist.");

        // Set up the FFmpegFrameGrabber with the valid video file
        try (FFmpegFrameGrabber grabber = new FFmpegFrameGrabber(videoFile)) {
            grabber.start();
            
            // Ensure the frame rate is greater than zero (indicating a valid video file)
            double frameRate = grabber.getFrameRate();
            assertTrue(frameRate > 0, "Frame rate should be a positive number.");

            // Grab the first frame to ensure video grabbing works
            Frame frame = grabber.grabImage();
            assertNotNull(frame, "First frame should not be null.");
            
            // Grab the second frame to test the loop and frame grabbing
            frame = grabber.grabImage();
            assertNotNull(frame, "Second frame should not be null.");
            
            // Ensure that the grabber can continue grabbing frames (e.g., not an empty video)
            int totalFrames = grabber.getLengthInFrames();
            assertTrue(totalFrames > 0, "The video should have more than 0 frames.");
        }
    }

    @Test
    public void testInvalidVideoFile() {
        // Arrange: Path to an invalid video file
        String invalidVideoFile = "sampleInput/nonexistentVideo.mp4";
        File invalidVideo = new File(invalidVideoFile);
        
        // Ensure the invalid file doesn't exist
        assertFalse(invalidVideo.exists(), "Invalid video file should not exist.");
        
        // Try to grab from an invalid video file and ensure it throws an exception
        assertThrows(Exception.class, () -> {
            try (FFmpegFrameGrabber grabber = new FFmpegFrameGrabber(invalidVideoFile)) {
                grabber.start();
            }
        }, "Expected exception when trying to open an invalid video file.");
    }

    @Test
    public void testFrameRate() throws Exception {
        // Set up the FFmpegFrameGrabber with a valid video file
        try (FFmpegFrameGrabber grabber = new FFmpegFrameGrabber(videoFile)) {
            grabber.start();
            
            // Get and verify the frame rate of the video
            double frameRate = grabber.getFrameRate();
            assertTrue(frameRate > 0, "Frame rate should be positive.");
            
            // Verify that frame rate makes sense (e.g., 24 fps or 30 fps are typical)
            assertTrue(frameRate >= 10 && frameRate <= 60, "Frame rate should be reasonable (between 10 and 60).");
        }
    }

    @Test
    public void testResourceCleanup() throws Exception {
        // Set up the FFmpegFrameGrabber with the valid video file
        try (FFmpegFrameGrabber grabber = new FFmpegFrameGrabber(videoFile)) {
            grabber.start();
            
            // Grab a frame and ensure it's valid
            Frame frame = grabber.grabImage();
            assertNotNull(frame, "Frame should be non-null.");
            
            // Manually close the grabber to ensure proper cleanup
            grabber.close();
        }
    }
}