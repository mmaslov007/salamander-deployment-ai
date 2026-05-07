package io.github.humagitgud.centroidfinder;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class DfsBinaryGroupFinder implements BinaryGroupFinder {
   /**
    * Finds connected pixel groups of 1s in an integer array representing a binary image.
    * 
    * The input is a non-empty rectangular 2D array containing only 1s and 0s.
    * If the array or any of its subarrays are null, a NullPointerException
    * is thrown. If the array is otherwise invalid, an IllegalArgumentException
    * is thrown.
    *
    * Pixels are considered connected vertically and horizontally, NOT diagonally.
    * The top-left cell of the array (row:0, column:0) is considered to be coordinate
    * (x:0, y:0). Y increases downward and X increases to the right. For example,
    * (row:4, column:7) corresponds to (x:7, y:4).
    *
    * The method returns a list of sorted groups. The group's size is the number 
    * of pixels in the group. The centroid of the group
    * is computed as the average of each of the pixel locations across each dimension.
    * For example, the x coordinate of the centroid is the sum of all the x
    * coordinates of the pixels in the group divided by the number of pixels in that group.
    * Similarly, the y coordinate of the centroid is the sum of all the y
    * coordinates of the pixels in the group divided by the number of pixels in that group.
    * The division should be done as INTEGER DIVISION.
    *
    * The groups are sorted in DESCENDING order according to Group's compareTo method
    * (size first, then x, then y). That is, the largest group will be first, the 
    * smallest group will be last, and ties will be broken first by descending 
    * y value, then descending x value.
    * 
    * @param image a rectangular 2D array containing only 1s and 0s
    * @return the found groups of connected pixels in descending order
    */
    @Override
    public List<Group> findConnectedGroups(int[][] image) {
        if (image == null) throw new NullPointerException();
        if (image.length == 0 || image[0] == null || image[0].length == 0) {
            throw new IllegalArgumentException();
        }

        boolean[][] visited = new boolean[image.length][image[0].length];
        List<Group> groups = new ArrayList<Group>();

        for (int r = 0; r < image.length; r++) {
            for (int c = 0; c < image[0].length; c++) {
                if (image[r][c] == 1 && !visited[r][c]) {
                    List<int[]> pixelGroup = new ArrayList<>();
                    DFS(image, r, c, visited, pixelGroup);
                    Group group = new Group(pixelGroup.size(), centroidFinder(pixelGroup));
                    groups.add(group);
                }
            }
        }
        
        Collections.sort(groups, Collections.reverseOrder());
        return groups;
    }
    
    // performs DFS adding coordinates to pixelGroup list
    private void DFS(int[][] grid, int row, int col, boolean[][] visited, List<int[]> pixelGroup) {
        // throw errors if invalid input
        if (grid == null) throw new NullPointerException();
        if (grid.length == 0) throw new IllegalArgumentException();
        
        // base cases: if visited skip, if cell is 0 skip
        if (visited[row][col]) return;
        if (grid[row][col] == 0) return;

        // mark cell as visited
        visited[row][col] = true;
        
        // add coordinate to list
        pixelGroup.add(new int[]{row, col});

        // using helper method get possible moves in the grid
        List<int[]> moves = possibleMoves(grid, new int[]{row, col});

        // perform DFS recursively move[0] = newRow, move[1] = newCol from the returned moves
        for (int[] move : moves) {
            DFS(grid, move[0], move[1], visited, pixelGroup);
        }
    }

    // possible moves explorer method
    private List<int[]> possibleMoves(int[][] grid, int[] current) {
        int curRow = current[0];
        int curCol = current[1];

        List<int[]> moves = new ArrayList<>();

        int[][] directions = new int[][] {
            {-1, 0},
            {1, 0},
            {0, -1},
            {0, 1}
        };

        for (int[] dir : directions) {
            int newRow = curRow + dir[0];
            int newCol = curCol + dir[1];

            if (newRow >= 0 && newRow < grid.length &&
                newCol >= 0 && newCol < grid[0].length &&
                grid[newRow][newCol] != 0) {
                    moves.add(new int[]{newRow, newCol});
                }
        }
        
        return moves;
    }
    
    // finds centroid
    private Coordinate centroidFinder(List<int[]> pixelGroup) {
        int x = 0;
        int y = 0;

        for (int[] pixel : pixelGroup) {
            y += pixel[0]; // row = y
            x += pixel[1]; // col = x
        }

        int centroidX = x / pixelGroup.size();
        int centroidY = y / pixelGroup.size();
        
        return new Coordinate(centroidX, centroidY);
    }

}