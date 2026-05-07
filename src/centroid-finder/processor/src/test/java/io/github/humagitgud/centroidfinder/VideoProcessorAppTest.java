package io.github.humagitgud.centroidfinder;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;

import java.io.*;

import static org.junit.jupiter.api.Assertions.*;

class VideoProcessorAppTest {

    private final PrintStream originalOut = System.out;
    private final PrintStream originalErr = System.err;
    private ByteArrayOutputStream outContent;
    private ByteArrayOutputStream errContent;

    @BeforeEach
    void setUpStreams() {
        outContent = new ByteArrayOutputStream();
        errContent = new ByteArrayOutputStream();
        System.setOut(new PrintStream(outContent));
        System.setErr(new PrintStream(errContent));
    }

    @AfterEach
    void restoreStreams() {
        System.setOut(originalOut);
        System.setErr(originalErr);
    }

    @Test
    void testMissingArgsPrintsUsage() {
        String[] args = {};  // no args
        VideoProcessorApp.main(args);
        String output = outContent.toString();
        assertTrue(output.contains("Usage"), "Should print usage instructions");
    }

    @Test
    void testInvalidInputFilePrintsError() {
        String[] args = {"nonexistent.mp4", "out.csv", "FF0000", "50"};
        VideoProcessorApp.main(args);
        String error = errContent.toString();
        assertTrue(error.contains("Input video file not found"), "Should report missing input file");
    }

    @Test
    void testInvalidThresholdPrintsError() {
        String[] args = {"input.mp4", "out.csv", "FF0000", "notANumber"};
        File fakeInput = new File("input.mp4");
        try {
            fakeInput.createNewFile(); // create empty dummy video file
            VideoProcessorApp.main(args);
            String error = errContent.toString();
            assertTrue(error.contains("Threshold must be an integer"), "Should reject non-integer threshold");
        } catch (IOException e) {
            fail("Couldn't create dummy input file");
        } finally {
            fakeInput.delete();
        }
    }

    @Test
    void testInvalidColorPrintsError(@TempDir File tempDir) throws IOException {
        File fakeInput = new File(tempDir, "input.mp4");
        fakeInput.createNewFile();

        String[] args = {
            fakeInput.getAbsolutePath(),
            new File(tempDir, "output.csv").getAbsolutePath(),
            "NOTHEX",
            "50"
        };

        VideoProcessorApp.main(args);
        String error = errContent.toString();
        assertTrue(error.contains("Invalid hex target color"), "Should detect bad hex input");
    }
}