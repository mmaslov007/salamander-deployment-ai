package io.github.humagitgud.centroidfinder;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.util.List;

import org.bytedeco.javacv.FFmpegFrameGrabber;
import org.bytedeco.javacv.Frame;
import org.bytedeco.javacv.Java2DFrameConverter;

/**
 * Processes video files frame by frame to track the largest centroid over time.
 */
public class VideoProcessor {
    private final String inputPath;
    private final String outputPath;
    private final int targetColor;
    private final int threshold;
    private final ImageGroupFinder groupFinder;

    /**
     * Creates a new VideoProcessor.
     *
     * @param inputPath   path to the input video file
     * @param outputPath  path to the output CSV file
     * @param targetColor target color as an RGB integer
     * @param threshold   threshold for color distance
     */
    public VideoProcessor(String inputPath, String outputPath, int targetColor, int threshold) {
        this.inputPath = inputPath;
        this.outputPath = outputPath;
        this.targetColor = targetColor;
        this.threshold = threshold;
        
        // Initialize components for finding centroids
        ColorDistanceFinder distanceFinder = new EuclideanColorDistance();
        ImageBinarizer binarizer = new DistanceImageBinarizer(distanceFinder, targetColor, threshold);
        this.groupFinder = new BinarizingImageGroupFinder(binarizer, new DfsBinaryGroupFinder());
    }

    /**
     * Processes the video file and writes centroid data to the output file.
     *
     * @throws IOException if an error occurs during processing
     */
    public void process() throws IOException {
        try (FFmpegFrameGrabber grabber = new FFmpegFrameGrabber(inputPath);
             CsvWriter writer = new CsvWriter(outputPath)) {
            
            // Initialize video frame grabber
            grabber.start();
            double frameRate = grabber.getFrameRate();
            double secondsPerFrame = 1.0 / frameRate;
            
            // Converter to convert frames to BufferedImage
            try (Java2DFrameConverter converter = new Java2DFrameConverter()) {
                // Process frames
                Frame frame;
                int frameCount = 0;
                
                System.out.println("Processing video: " + inputPath);
                System.out.println("Frame rate: " + frameRate + " fps");
                
                // Supresses unneeded warnings about pixel formatting.
                org.bytedeco.ffmpeg.global.avutil.av_log_set_level(org.bytedeco.ffmpeg.global.avutil.AV_LOG_ERROR);
                
                while ((frame = grabber.grabImage()) != null) {
                    double timestamp = frameCount * secondsPerFrame;
                    
                    // Convert frame to BufferedImage
                    BufferedImage bufferedImage = converter.convert(frame);
                    if (bufferedImage == null) {
                        writer.writeRow(timestamp, null);
                        frameCount++;
                        continue;
                    }
                    
                    // Find connected groups in the frame
                    List<Group> groups = groupFinder.findConnectedGroups(bufferedImage);
                    
                    // Get the largest centroid (if any)
                    Coordinate largestCentroid = null;
                    if (!groups.isEmpty()) {
                        // Groups are sorted in descending order, so the first one is the largest
                        largestCentroid = groups.get(0).centroid();
                    }
                    
                    // Write to CSV
                    writer.writeRow(timestamp, largestCentroid);
                    
                    frameCount++;
                    if (frameCount % 100 == 0) {
                        System.out.printf("Processed %d frames (%.1f seconds)%n", frameCount, timestamp);
                        writer.flush();
                    }
                }
                
                System.out.println("Total frames processed: " + frameCount);
            }
            
            System.out.println("Output written to: " + outputPath);
        }
    }
} 