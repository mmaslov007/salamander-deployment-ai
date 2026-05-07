package io.github.humagitgud.centroidfinder;

import org.bytedeco.javacv.FFmpegFrameGrabber;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class VideoProcessorTest {

    @TempDir
    Path tempDir;

    @Test
    public void testProcessVideo_WritesCSV() throws IOException {
        // Arrange: Path to the real sample video file in the sampleInput folder
        Path inputVideoPath = Path.of("sampleInput/sampleVideo.mp4");
        Path outputCsvPath = Path.of("sampleOutput/output.csv");

        // Ensure the input video exists
        assertTrue(Files.exists(inputVideoPath), "Input video file does not exist: " + inputVideoPath);

        try (// Set up the grabber with the real video path
        FFmpegFrameGrabber grabber = new FFmpegFrameGrabber(inputVideoPath.toString())) {
            grabber.start();
        }
        // Create the VideoProcessor with the paths
        VideoProcessor processor = new VideoProcessor(inputVideoPath.toString(), outputCsvPath.toString(), 0xFF0000, 100);

        // Act: Process the video and generate the CSV
        processor.process();

        // Assert: Check that the CSV file is created in the sampleOutput folder
        assertTrue(Files.exists(outputCsvPath), "CSV file should be created.");
        File outputCsv = outputCsvPath.toFile();
        assertTrue(outputCsv.length() > 0, "CSV file should not be empty.");
    }
    
    @Test
    public void testProcessVideo_NonExistentInputFile() {
        // Arrange: Path to a non-existent video file
        Path inputVideoPath = Path.of("sampleInput/nonExistentVideo.mp4");
        Path outputCsvPath = tempDir.resolve("output.csv");

        // Act & Assert: Ensure that an exception is thrown when the input video does not exist
        Exception exception = assertThrows(IOException.class, () -> {
            VideoProcessor processor = new VideoProcessor(inputVideoPath.toString(), outputCsvPath.toString(), 0xFF0000, 100);
            processor.process();
        });

        assertFalse(exception.getMessage().contains("Error processing video"), "Expected error message not found");
    }

    @Test
    public void testProcessVideo_InvalidTargetColor() {
        // Arrange: Path to a valid input video
        Path inputVideoPath = Path.of("sampleInput/sampleVideo.mp4");
        Path outputCsvPath = tempDir.resolve("output.csv");

        // Act & Assert: Ensure that an exception is thrown for an invalid target color (invalid hex color)
        String invalidHexColor = "ZZZZZZ"; // Invalid hex color string

        // Simulating the invalid hex color parsing
        Exception exception = assertThrows(NumberFormatException.class, () -> {
            // Try to parse the invalid hex color string to an integer (this should fail)
            int targetColor = Integer.parseInt(invalidHexColor, 16); // This will throw an exception
            VideoProcessor processor = new VideoProcessor(inputVideoPath.toString(), outputCsvPath.toString(), targetColor, 100);
            processor.process();
        });

        assertTrue(exception.getMessage().contains("For input string: \"" + invalidHexColor + "\""), "Expected error message not found");
    }

    @Test
    public void testProcessVideo_CSVContentFormat() throws IOException {
        // Arrange: Path to a valid input video
        Path inputVideoPath = Path.of("sampleInput/sampleVideo.mp4");
        Path outputCsvPath = tempDir.resolve("output.csv");

        // Ensure the video file exists
        assertTrue(Files.exists(inputVideoPath), "Input video file does not exist: " + inputVideoPath);

        // Act: Process the video and generate the CSV
        VideoProcessor processor = new VideoProcessor(inputVideoPath.toString(), outputCsvPath.toString(), 0xFF0000, 100);
        processor.process();

        // Assert: Check that the CSV file content has the correct format
        List<String> lines = Files.readAllLines(outputCsvPath);
        assertFalse(lines.isEmpty(), "CSV should not be empty");

        for (String line : lines) {
            String[] parts = line.split(",");
            assertEquals(3, parts.length, "CSV line should have two parts (timestamp, centroid (x, y))");
        }
    }
}