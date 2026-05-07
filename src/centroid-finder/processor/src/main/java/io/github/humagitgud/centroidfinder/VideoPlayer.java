package io.github.humagitgud.centroidfinder;

import org.bytedeco.javacv.FFmpegFrameGrabber;
import org.bytedeco.javacv.Frame;
import org.bytedeco.javacv.CanvasFrame;

public class VideoPlayer {
    public static void main(String[] args) throws Exception {
        // Get video file path
        String videoFile = "sampleInput/sampleVideo.mp4";

        // Set up the grabber
        try (FFmpegFrameGrabber grabber = new FFmpegFrameGrabber(videoFile)) {
            grabber.start();

            // Create a window to show frames
            CanvasFrame canvas = new CanvasFrame("JavaCV Video");
            canvas.setDefaultCloseOperation(CanvasFrame.EXIT_ON_CLOSE);

            // Read & display frames in a loop
            Frame frame;
            double frameRate = grabber.getFrameRate(); // e.g. 24, 30, etc.
            long delay = (long)(1000 / frameRate);

            while (canvas.isVisible() && (frame = grabber.grabImage()) != null) {
                canvas.showImage(frame);
                Thread.sleep(delay);
            }
        }
    }
}