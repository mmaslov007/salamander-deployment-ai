package io.github.humagitgud.centroidfinder;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for EuclideanColorDistance.distance(...).
 */
public class EuclideanColorDistanceTest {
    private final EuclideanColorDistance finder = new EuclideanColorDistance();

    @Test
    void testSameColorReturnsZero() {
        int color = 0x1A2B3C;
        assertEquals(0.0, finder.distance(color, color), 
            "Distance between identical colors should be zero");
    }

    @Test
    void testBlackToWhite() {
        double expected = Math.sqrt(3 * 255 * 255);
        assertEquals(expected, finder.distance(0x000000, 0xFFFFFF), 1e-6,
            "Distance between black and white should be sqrt(3*255^2)");
    }

    @Test
    void testRedToGreen() {
        double expected = Math.sqrt(255 * 255 + 255 * 255);
        assertEquals(expected, finder.distance(0xFF0000, 0x00FF00), 1e-6,
            "Distance between red and green should be sqrt(255^2 + 255^2)");
    }

    @Test
    void testBlueToGreen() {
        double expected = Math.sqrt(255 * 255 + 255 * 255);
        assertEquals(expected, finder.distance(0x0000FF, 0x00FF00), 1e-6,
            "Distance between blue and green should be sqrt(255^2 + 255^2)");
    }

    @Test
    void testArbitraryColors() {
        int c1 = 0x123456;
        int c2 = 0x654321;
        int r1 = (c1 >> 16) & 0xFF;
        int g1 = (c1 >> 8) & 0xFF;
        int b1 = c1 & 0xFF;
        int r2 = (c2 >> 16) & 0xFF;
        int g2 = (c2 >> 8) & 0xFF;
        int b2 = c2 & 0xFF;
        double expected = Math.sqrt(
            (r1 - r2) * (r1 - r2) +
            (g1 - g2) * (g1 - g2) +
            (b1 - b2) * (b1 - b2)
        );
        assertEquals(expected, finder.distance(c1, c2), 1e-6,
            "Distance between arbitrary colors should match manual calculation");
    }
}
