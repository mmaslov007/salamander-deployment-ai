package io.github.humagitgud.centroidfinder;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import java.awt.image.BufferedImage;

public class DistanceImageBinarizerTest {

    private static class FakeColorDistanceFinder implements ColorDistanceFinder {
        private final double[][] distances;

        public FakeColorDistanceFinder(double[][] distances) {
            this.distances = distances;
        }

        @Override
        public double distance(int a, int b) {
            // Simply return pre-defined distance from the matrix for each pixel
            int y = (a >> 8) & 0xFF;
            int x = a & 0xFF;
            return distances[y][x];
        }
    }

    @Test
    public void testToBinaryArray_WithThreshold() {
        int[][] expectedBinary = {
            {1, 0},
            {0, 1}
        };

        // Create a fake image with pixel colors as (y << 8 | x) so we can track them
        BufferedImage image = new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB);
        image.setRGB(0, 0, (0 << 8) | 0); // distance = 5
        image.setRGB(1, 0, (0 << 8) | 1); // distance = 10
        image.setRGB(0, 1, (1 << 8) | 0); // distance = 15
        image.setRGB(1, 1, (1 << 8) | 1); // distance = 2

        double[][] fakeDistances = {
            {5, 10},
            {15, 2}
        };

        FakeColorDistanceFinder fakeFinder = new FakeColorDistanceFinder(fakeDistances);
        DistanceImageBinarizer binarizer = new DistanceImageBinarizer(fakeFinder, 0, 6);

        int[][] actual = binarizer.toBinaryArray(image);

        assertArrayEquals(expectedBinary, actual);
    }

    @Test
    public void testToBufferedImage() {
        int[][] binaryArray = {
            {1, 0},
            {0, 1}
        };

        DistanceImageBinarizer binarizer = new DistanceImageBinarizer(null, 0, 0); // finder not used

        BufferedImage result = binarizer.toBufferedImage(binaryArray);

        assertEquals(0xFFFFFF, result.getRGB(0, 0) & 0xFFFFFF);
        assertEquals(0x000000, result.getRGB(1, 0) & 0xFFFFFF);
        assertEquals(0x000000, result.getRGB(0, 1) & 0xFFFFFF);
        assertEquals(0xFFFFFF, result.getRGB(1, 1) & 0xFFFFFF);
    }

    // --- Additional edge-case tests ---

    /** All distances below threshold ⇒ every pixel white (1). */
    @Test
    void testAllBelowThresholdYieldsAllOnes() {
        BufferedImage img = new BufferedImage(3, 2, BufferedImage.TYPE_INT_RGB);
        for (int y = 0; y < 2; y++)
            for (int x = 0; x < 3; x++)
                img.setRGB(x, y, (y << 8) | x);

        double[][] distances = {
            {0.0, 1.0, 2.0},
            {0.5, 1.5, 1.9}
        };
        DistanceImageBinarizer bin = new DistanceImageBinarizer(
            new FakeColorDistanceFinder(distances),
            /*targetColor*/ 0,
            /*threshold*/ 5
        );

        int[][] expected = {
            {1, 1, 1},
            {1, 1, 1}
        };
        assertArrayEquals(expected, bin.toBinaryArray(img));
    }

    /** All distances at or above threshold ⇒ every pixel black (0). */
    @Test
    void testAllAtOrAboveThresholdYieldsAllZeros() {
        BufferedImage img = new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB);
        for (int y = 0; y < 2; y++)
            for (int x = 0; x < 2; x++)
                img.setRGB(x, y, (y << 8) | x);

        double[][] distances = {
            {10.0, 6.0},
            {5.0, 6.0}
        };
        DistanceImageBinarizer bin = new DistanceImageBinarizer(
            new FakeColorDistanceFinder(distances),
            0,
            5
        );

        int[][] expected = {
            {0, 0},
            {0, 0}
        };
        assertArrayEquals(expected, bin.toBinaryArray(img));
    }

    /** Distance exactly equal to threshold stays black (0). */
    @Test
    void testEqualToThresholdYieldsBlack() {
        BufferedImage img = new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB);
        img.setRGB(0, 0, 0);  // only one pixel

        double[][] distances = {{ 7.0 }};
        DistanceImageBinarizer bin = new DistanceImageBinarizer(
            new FakeColorDistanceFinder(distances),
            0,
            7
        );

        int[][] actual = bin.toBinaryArray(img);
        assertEquals(0, actual[0][0], "distance == threshold should map to black (0)");
    }

    /** Non-square images (e.g. 1×4) are handled correctly. */
    @Test
    void testNonSquareImageDimensions() {
        BufferedImage img = new BufferedImage(4, 1, BufferedImage.TYPE_INT_RGB);
        for (int x = 0; x < 4; x++)
            img.setRGB(x, 0, x);

        double[][] distances = {{0.0, 10.0, 0.0, 10.0}};
        DistanceImageBinarizer bin = new DistanceImageBinarizer(
            new FakeColorDistanceFinder(distances),
            0, 5
        );

        int[][] expected = {{1, 0, 1, 0}};
        assertArrayEquals(expected, bin.toBinaryArray(img));
    }

    /** Passing null to toBinaryArray should throw a NullPointerException. */
    @Test
    void testNullImageThrowsNPE() {
        DistanceImageBinarizer bin = new DistanceImageBinarizer((a, b) -> 0.0, 0, 1);
        assertThrows(NullPointerException.class, () -> bin.toBinaryArray(null));
    }
}
