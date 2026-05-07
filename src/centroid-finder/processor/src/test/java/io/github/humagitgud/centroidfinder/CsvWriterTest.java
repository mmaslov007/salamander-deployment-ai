package io.github.humagitgud.centroidfinder;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class CsvWriterTest {

    @TempDir
    Path tempDir;

    @Test
    public void testWriteRow_WithCoordinate() throws IOException {
        // Arrange
        Path csvPath = tempDir.resolve("test.csv");
        Coordinate coordinate = new Coordinate(10, 20);
        
        // Act
        try (CsvWriter writer = new CsvWriter(csvPath.toString())) {
            writer.writeRow(1.5, coordinate);
        }
        
        // Assert
        List<String> lines = Files.readAllLines(csvPath);
        assertEquals(1, lines.size());
        assertEquals("1.50,10,20", lines.get(0));
    }
    
    @Test
    public void testWriteRow_WithNullCoordinate() throws IOException {
        // Arrange
        Path csvPath = tempDir.resolve("test.csv");
        
        // Act
        try (CsvWriter writer = new CsvWriter(csvPath.toString())) {
            writer.writeRow(2.75, null);
        }
        
        // Assert
        List<String> lines = Files.readAllLines(csvPath);
        assertEquals(1, lines.size());
        assertEquals("2.75,-1,-1", lines.get(0));
    }
    
    @Test
    public void testWriteMultipleRows() throws IOException {
        // Arrange
        Path csvPath = tempDir.resolve("test.csv");
        Coordinate coord1 = new Coordinate(5, 10);
        Coordinate coord2 = new Coordinate(15, 20);
        
        // Act
        try (CsvWriter writer = new CsvWriter(csvPath.toString())) {
            writer.writeRow(0.0, coord1);
            writer.writeRow(0.5, null);
            writer.writeRow(1.0, coord2);
        }
        
        // Assert
        List<String> lines = Files.readAllLines(csvPath);
        assertEquals(3, lines.size());
        assertEquals("0.00,5,10", lines.get(0));
        assertEquals("0.50,-1,-1", lines.get(1));
        assertEquals("1.00,15,20", lines.get(2));
    }
} 