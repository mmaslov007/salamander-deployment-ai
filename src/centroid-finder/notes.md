# Notes:
 
## ImageSummaryApp.java
- Capture CLI args to variables `inputImagePath` (photo.png), `hexTargetColor` (FF0000), and `threshold` (how close color pixels must be to target color) from `java ImageSummaryApp <input_image> <hex_target_color> <threshold>`
- Validate input image, threshold integer, and parse `hexTargetColor` from RGB to 24-bit integer (0xRRGGBB)
- Using EuclideanColorDistance class get distance between target color pixels
- Using DistanceImageBinarizer check if a pixel is within threshold (white) or out of threshold (black)
- Binarize image into a matrix of 1s (white) and 0s (black), then convert into a black and white `BufferedImage`
- Save binarized.png
- Using `DfsBinaryGroupFinder` find connected white pixel groups (4 directional, horiz and vert, no diagonals). Calc size (num of pixels) and centroid (avg x and y using int division)
- Write a CSV file with group size and centroid coordinates (size, x, y)
### Summary
- Finds areas in an image that are visually similar to target color and provides binary image and csv report

## EuclidianColorDistance.java
- Returns the euclidian color distance between 2 hex RGB colors in 24-bit integer form (0XRRGGBB)
- Euclidean distance formula `sqrt((r1 - r2)^2 + (g1 - g2)^2 + (b1 - b2)^2)` is applied to calculate distance
- This gives a measure of how visually different the 2 colors are.
- A good approach to this problem would be to separate each of the 2 colors into 3 individual color values for red, green, and blue. That way the formula can be applied to each individual value.

## DistanceImageBinarizer.java
- Use the result of EuclidianColorDistance.java distance to determine whether each pixel should be black or white in the binary image
- Binarization is based on distance between a pixel's color and reference target color. If distance is less than threshold = pixel is white (1), else it is black (0)
- Color distance is computed using ColorDistanceFinder.java which defines how to compare 2 colors numerically. The targetColor is represented as 24-bit RGB integer in the form 0xRRGGBB
- Class has following methods:
    - DistanceImageBinarizer: determintes Euclidian distance between pixel colors
    - toBinaryArray: converts BufferedImage into a binary 2D array
    - toBufferedImage: converts a binary 2D array into BufferedImage in black (0) and white (1)

## DfsBinaryGroupFinder.java
- Find connected pixel groups of 1s in an integer array representing a binary image
- Input: 2D rectangular array/Matrix
- Output: `List<Group>` of connected groups of 1s with size being the number of pixels in the group and centroid being avg (x, y) position of those pixels  
- Uses Group.java

## Group.java
- Record class that holds info about connected pixels of 1s in a 2D matrix 
- Stores size (amount of 1s) and centroid (avg x,y position of groups pixels)