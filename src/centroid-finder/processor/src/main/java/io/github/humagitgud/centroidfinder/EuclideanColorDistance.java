package io.github.humagitgud.centroidfinder;

public class EuclideanColorDistance implements ColorDistanceFinder {
    /**
     * Returns the euclidean color distance between two hex RGB colors.
     * 
     * Each color is represented as a 24-bit integer in the form 0xRRGGBB, where
     * RR is the red component, GG is the green component, and BB is the blue component,
     * each ranging from 0 to 255.
     * 
     * The Euclidean color distance is calculated by treating each color as a point
     * in 3D space (red, green, blue) and applying the Euclidean distance formula:
     * 
     * sqrt((r1 - r2)^2 + (g1 - g2)^2 + (b1 - b2)^2)
     * 
     * This gives a measure of how visually different the two colors are.
     * 
     * @param colorA the first color as a 24-bit hex RGB integer
     * @param colorB the second color as a 24-bit hex RGB integer
     * @return the Euclidean distance between the two colors
     */
    @Override
    public double distance(int colorA, int colorB) {
        // red data is stored in bits 23-16
        // green data is stored in bits 15-8
        // blue data is stored in bits 7-0

        int r1 = (colorA >> 16) & 0xFF; // shifts bits 23-16 down to 7-0, masks remaining
        int g1 = (colorA >> 8) & 0xFF; // shifts bits 15-8 down to 7-0, masks remaining
        int b1 = colorA & 0xFF; // no shift is required since bits are already 7-0, masks remaining

        // same process for the second color
        int r2 = (colorB >> 16) & 0xFF;
        int g2 = (colorB >> 8) & 0xFF;
        int b2 = colorB & 0xFF;

        // distance variables created to be used in the formula for simplicity
        int dr = r1 - r2; // red distance
        int dg = g1 - g2; // green distance
        int db = b1 - b2; // blue distance

        // sqrt((r1 - r2)^2 + (g1 - g2)^2 + (b1 - b2)^2) original formula
        // sqrt((dr)^2 + (dg)^2 + (db)^2) new formula with distance variables
        return Math.sqrt(dr * dr + dg * dg + db * db);
    }
}
