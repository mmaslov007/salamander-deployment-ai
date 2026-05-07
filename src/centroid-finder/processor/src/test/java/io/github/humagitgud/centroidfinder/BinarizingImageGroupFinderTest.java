package io.github.humagitgud.centroidfinder;

import org.junit.jupiter.api.Test;
import java.awt.image.BufferedImage;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

public class BinarizingImageGroupFinderTest {

    private static class DummyBinarizer implements ImageBinarizer {
        private final int[][] binary;

        public DummyBinarizer(int[][] binary) {
            this.binary = binary;
        }

        @Override
        public int[][] toBinaryArray(BufferedImage image) {
            return binary;
        }

        @Override
        public BufferedImage toBufferedImage(int[][] image) {
            return null; // not needed for these tests
        }
    }

    private static class DummyGroupFinder implements BinaryGroupFinder {
        private final List<Group> groups;

        public DummyGroupFinder(List<Group> groups) {
            this.groups = groups;
        }

        @Override
        public List<Group> findConnectedGroups(int[][] image) {
            return groups;
        }
    }

    // Test 1: Single group
    @Test
    public void testFindConnectedGroups_SingleGroup() {
        int[][] binary = new int[][] {
            {0, 1},
            {1, 1}
        };

        // Manually create the expected group
        Coordinate centroid = new Coordinate(1, 0); // (1+0+1)/3 = 0, (1+1+0)/3 = 0.66 => (0,0) due to int division
        Group group = new Group(3, centroid);

        ImageBinarizer binarizer = new DummyBinarizer(binary);
        BinaryGroupFinder groupFinder = new DummyGroupFinder(List.of(group));
        ImageGroupFinder finder = new BinarizingImageGroupFinder(binarizer, groupFinder);

        List<Group> result = finder.findConnectedGroups(new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB));

        assertEquals(1, result.size());
        assertEquals(group, result.get(0));
    }

    // Test 2: Multiple groups sorted
    @Test
    public void testFindConnectedGroups_MultipleGroupsSorted() {
        int[][] binary = new int[][] {
            {1, 0},
            {1, 1},
            {0, 1},
        };

        Group largeGroup = new Group(4, new Coordinate(1, 1));
        Group smallGroup = new Group(1, new Coordinate(0, 0));

        List<Group> unsortedGroups = Arrays.asList(smallGroup, largeGroup);

        ImageBinarizer binarizer = new DummyBinarizer(binary);
        BinaryGroupFinder groupFinder = new DummyGroupFinder(unsortedGroups);
        ImageGroupFinder finder = new BinarizingImageGroupFinder(binarizer, groupFinder);

        List<Group> result = finder.findConnectedGroups(new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB));

        assertEquals(2, result.size());
        assertEquals(smallGroup, result.get(0));
        assertEquals(largeGroup, result.get(1));
    }

    // Test 3: Empty binary image
    @Test
    public void testFindConnectedGroups_EmptyBinaryImage() {
        int[][] binary = new int[][] {{0, 0}, {0, 0}};

        ImageBinarizer binarizer = new DummyBinarizer(binary);
        BinaryGroupFinder groupFinder = new DummyGroupFinder(new ArrayList<>());
        ImageGroupFinder finder = new BinarizingImageGroupFinder(binarizer, groupFinder);

        List<Group> result = finder.findConnectedGroups(new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB));

        assertTrue(result.isEmpty());
    }

    // Test 4: Null binary array throws exception
    @Test
    public void testFindConnectedGroups_NullBinaryArrayThrows() {
        ImageBinarizer binarizer = new DummyBinarizer(null);

        BinaryGroupFinder groupFinder = new BinaryGroupFinder() {
            @Override
            public List<Group> findConnectedGroups(int[][] image) {
                throw new NullPointerException("Binary array is null");
            }
        };

        ImageGroupFinder finder = new BinarizingImageGroupFinder(binarizer, groupFinder);

        assertThrows(NullPointerException.class, () -> finder.findConnectedGroups(new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB)));
    }

    // Test 5: Isolated white pixels
    @Test
    public void testFindConnectedGroups_IsolatedWhitePixels() {
        int[][] binary = new int[][] {
            {0, 1, 0},
            {1, 0, 1},
            {0, 1, 0}
        };

        // Expecting 5 groups, each with one white pixel
        Group group1 = new Group(1, new Coordinate(1, 0));
        Group group2 = new Group(1, new Coordinate(0, 1));
        Group group3 = new Group(1, new Coordinate(2, 1));
        Group group4 = new Group(1, new Coordinate(1, 2));
        Group group5 = new Group(1, new Coordinate(0, 2));

        List<Group> expectedGroups = Arrays.asList(group2, group1, group5, group3, group4);

        ImageBinarizer binarizer = new DummyBinarizer(binary);
        BinaryGroupFinder groupFinder = new DummyGroupFinder(expectedGroups);
        ImageGroupFinder finder = new BinarizingImageGroupFinder(binarizer, groupFinder);

        List<Group> result = finder.findConnectedGroups(new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB));

        assertEquals(5, result.size());
        assertEquals(expectedGroups, result);
    }

    // Test 6: Complex shape (L-shaped white pixels)
    @Test
    public void testFindConnectedGroups_ComplexShape() {
        int[][] binary = new int[][] {
            {0, 0, 0, 0},
            {0, 1, 1, 0},
            {0, 1, 0, 0},
            {0, 1, 1, 0}
        };

        // Expecting a single group with size 6, as the white pixels are all connected
        Group group = new Group(6, new Coordinate(1, 1));  // Centroid is roughly (1, 1)

        List<Group> expectedGroups = Arrays.asList(group);

        ImageBinarizer binarizer = new DummyBinarizer(binary);
        BinaryGroupFinder groupFinder = new DummyGroupFinder(expectedGroups);
        ImageGroupFinder finder = new BinarizingImageGroupFinder(binarizer, groupFinder);

        List<Group> result = finder.findConnectedGroups(new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB));

        assertEquals(1, result.size());
        assertEquals(group, result.get(0));
    }

    // Test 7: Mixed black and white pixels
    @Test
    public void testFindConnectedGroups_MixedBlackWhitePixels() {
        int[][] binary = new int[][] {
            {1, 0, 0, 0},
            {0, 1, 1, 0},
            {0, 1, 0, 0},
            {0, 0, 0, 1}
        };

        Group group1 = new Group(1, new Coordinate(0, 0)); // Isolated single pixel
        Group group2 = new Group(3, new Coordinate(1, 1)); // A 3-pixel connected group
        Group group3 = new Group(1, new Coordinate(3, 3)); // Another isolated pixel

        List<Group> expectedGroups = Arrays.asList(group1, group2, group3);

        ImageBinarizer binarizer = new DummyBinarizer(binary);
        BinaryGroupFinder groupFinder = new DummyGroupFinder(expectedGroups);
        ImageGroupFinder finder = new BinarizingImageGroupFinder(binarizer, groupFinder);

        List<Group> result = finder.findConnectedGroups(new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB));

        assertEquals(3, result.size());
        assertTrue(result.contains(group1));
        assertTrue(result.contains(group2));
        assertTrue(result.contains(group3));
    }

    // Test 8: All white pixels
    @Test
    public void testFindConnectedGroups_AllWhitePixels() {
        int[][] binary = new int[][] {
            {1, 1},
            {1, 1}
        };

        // Expecting a single group with 4 white pixels
        Group group = new Group(4, new Coordinate(1, 1));  // Centroid would be (1, 1)

        List<Group> expectedGroups = Arrays.asList(group);

        ImageBinarizer binarizer = new DummyBinarizer(binary);
        BinaryGroupFinder groupFinder = new DummyGroupFinder(expectedGroups);
        ImageGroupFinder finder = new BinarizingImageGroupFinder(binarizer, groupFinder);

        List<Group> result = finder.findConnectedGroups(new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB));

        assertEquals(1, result.size());
        assertEquals(group, result.get(0));
    }

    // Test 9: Large image (stress test)
    @Test
    public void testFindConnectedGroups_LargeImage() {
        int[][] binary = new int[1000][1000];
        // Set a large connected block of white pixels
        for (int i = 0; i < 500; i++) {
            for (int j = 0; j < 500; j++) {
                binary[i][j] = 1;
            }
        }

        // One large group expected
        Group largeGroup = new Group(500 * 500, new Coordinate(249, 249));  // Rough centroid

        List<Group> expectedGroups = Arrays.asList(largeGroup);

        ImageBinarizer binarizer = new DummyBinarizer(binary);
        BinaryGroupFinder groupFinder = new DummyGroupFinder(expectedGroups);
        ImageGroupFinder finder = new BinarizingImageGroupFinder(binarizer, groupFinder);

        List<Group> result = finder.findConnectedGroups(new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB));

        assertEquals(1, result.size());
        assertEquals(largeGroup, result.get(0));
    }
}