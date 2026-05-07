package io.github.humagitgud.centroidfinder;

import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;

/**
 * Utility class for writing centroid tracking data to a CSV file.
 * The CSV format is: timestamp,x,y
 * Where timestamp is in seconds since the start of the video,
 * and x,y are the coordinates of the largest centroid.
 * If no centroid is found, coordinates of (-1, -1) are used.
 */
public class CsvWriter implements AutoCloseable {
    private PrintWriter writer;
    
    /**
     * Creates a new CsvWriter that writes to the specified file.
     * 
     * @param filePath path to the output CSV file
     * @throws IOException if an error occurs opening the file
     */
    public CsvWriter(String filePath) throws IOException {
        this.writer = new PrintWriter(new FileWriter(filePath));
    }
    
    /**
     * Writes a data row to the CSV file.
     * 
     * @param timestamp time in seconds since the start of the video
     * @param coordinate coordinates of the centroid, or null if no centroid found
     */
    public void writeRow(double timestamp, Coordinate coordinate) {
        int x = -1;
        int y = -1;
        
        if (coordinate != null) {
            x = coordinate.x();
            y = coordinate.y();
        }
        
        writer.printf("%.2f,%d,%d%n", timestamp, x, y);
    }
    
    /**
     * Flushes any buffered data to the file.
     */
    public void flush() {
        writer.flush();
    }
    
    /**
     * Closes the writer and releases any system resources associated with it.
     */
    @Override
    public void close() {
        writer.close();
    }
} 