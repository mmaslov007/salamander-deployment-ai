package io.github.humagitgud.centroidfinder;

import java.io.File;
import java.io.IOException;

/**
 * Main application class for the video processor.
 * 
 * Usage:
 * java -jar videoprocessor.jar inputPath outputCsv targetColor threshold
 * 
 * Where:
 * - inputPath: Path to the input video file
 * - outputCsv: Path to the output CSV file
 * - targetColor: Target hex color in the format RRGGBB
 * - threshold: Integer threshold for color distance
 */
public class VideoProcessorApp {
    public static void main(String[] args) {
        if (args.length != 4) {
            printUsage("Invalid number of args!");
            return;
        }
        
        String inputPath = args[0];
        String outputCsv = args[1];
        String hexTargetColor = args[2];
        int threshold, targetColor;
        
        // Validate input path
        File inputFile = new File(inputPath);
        if (!inputFile.exists() || !inputFile.isFile()) {
            System.err.println("Error: Input video file not found: " + inputPath);
            return;
        }
        
        // Validate and parse threshold
        try {
            threshold = Integer.parseInt(args[3]);
        } catch (NumberFormatException e) {
            System.err.println("Error: Threshold must be an integer");
            return;
        }
        
        // Validate and parse target color
        try {
            targetColor = Integer.parseInt(hexTargetColor, 16);
        } catch (NumberFormatException e) {
            System.err.println("Error: Invalid hex target color. Please provide a color in RRGGBB format.");
            return;
        }
        
        // Create and run the video processor
        try {
            VideoProcessor processor = new VideoProcessor(inputPath, outputCsv, targetColor, threshold);
            processor.process();
        } catch (IOException e) {
            System.err.println("Error processing video: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private static void printUsage(String errorMessage) {
        System.out.println("Usage: java -jar videoprocessor.jar <inputPath> <outputCsv> <targetColor> <threshold>");
        System.out.println("Where:");
        System.out.println("  inputPath: Path to the input video file");
        System.out.println("  outputCsv: Path to the output CSV file");
        System.out.println("  targetColor: Target hex color in the format RRGGBB (e.g., FF0000 for red)");
        System.out.println("  threshold: Integer threshold for color distance");
    }
} 