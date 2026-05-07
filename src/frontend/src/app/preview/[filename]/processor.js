// Java Centroid Finder image processor translated to JavaScript

/**
 * Convert a hex color string (e.g. "#FF0000") into an RGB array [R, G, B].
 * @param {string} hex - Color string in hex format with or without '#'
 * @returns {number[]} - Array of three numbers representing Red, Green, Blue components
 */
export function hexToRgb(hex) {
  // Parse the hex string to an integer number
  const bigint = parseInt(hex.replace('#', ''), 16);
  // Extract the red, green, and blue components by bit shifting and masking
  return [
    (bigint >> 16) & 255,  // Red component (highest 8 bits)
    (bigint >> 8) & 255,   // Green component (middle 8 bits)
    bigint & 255           // Blue component (lowest 8 bits)
  ];
}

/**
 * Calculate the Euclidean distance between two RGB colors.
 * This measures how "far apart" two colors are in RGB space.
 * @param {number[]} c1 - First color [R, G, B]
 * @param {number[]} c2 - Second color [R, G, B]
 * @returns {number} - Distance between colors
 */
export function colorDistance(c1, c2) {
  return Math.sqrt(
    (c1[0] - c2[0]) ** 2 + // Red difference squared
    (c1[1] - c2[1]) ** 2 + // Green difference squared
    (c1[2] - c2[2]) ** 2   // Blue difference squared
  );
}

/**
 * Find the centroid (center point) of the largest connected group of pixels marked as '1' in a binary array.
 * This uses a Breadth-First Search (BFS) flood-fill to find connected groups.
 * @param {Uint8Array} binaryArray - 1D array representing pixel inclusion (1 = in group, 0 = out)
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @returns {object|null} - Coordinates {x, y} of the centroid, or null if none found
 */
export function findLargestConnectedGroupCentroid(binaryArray, width, height) {
  // Keep track of visited pixels so we don't count the same pixel multiple times
  const visited = new Array(width * height).fill(false);

  // Possible neighbor offsets (up, down, left, right)
  const neighbors = [
    [0, -1], // Up
    [0, 1],  // Down
    [-1, 0], // Left
    [1, 0]   // Right
  ];

  let largestSize = 0;      // Size of the largest connected group found so far
  let largestCentroid = null; // Centroid of the largest group

  // Helper function to check if coordinates are inside the image bounds
  const isValid = (x, y) => x >= 0 && x < width && y >= 0 && y < height;

  // Iterate over each pixel in the image
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x; // 1D index for the pixel

      // If this pixel is part of a group (1) and not visited yet, start BFS
      if (binaryArray[idx] === 1 && !visited[idx]) {
        let queue = [[x, y]]; // Initialize queue with current pixel
        let sumX = 0, sumY = 0; // To accumulate x and y positions for centroid calculation
        let size = 0;           // Number of pixels in this group

        visited[idx] = true;

        // Process the queue until empty (BFS)
        while (queue.length > 0) {
          const [cx, cy] = queue.shift();

          sumX += cx;
          sumY += cy;
          size++;

          // Check all 4 neighbors
          for (const [dx, dy] of neighbors) {
            const nx = cx + dx;
            const ny = cy + dy;

            if (isValid(nx, ny)) {
              const nIdx = ny * width + nx;

              // If neighbor pixel is also part of group and not visited, add to queue
              if (binaryArray[nIdx] === 1 && !visited[nIdx]) {
                visited[nIdx] = true;
                queue.push([nx, ny]);
              }
            }
          }
        }

        // After BFS, check if this group is the largest found so far
        if (size > largestSize) {
          largestSize = size;
          // Calculate centroid as average of all pixel coordinates in this group
          largestCentroid = { x: sumX / size, y: sumY / size };
        }
      }
    }
  }

  // Return the centroid of the largest connected group (or null if none found)
  return largestCentroid;
}

/**
 * Convert image pixels to black-and-white (binarized) based on how close each pixel's color
 * is to a target color within a given threshold.
 * Also finds the centroid of the largest connected white region.
 * @param {ImageData} imageData - Original image pixel data
 * @param {string} targetHexColor - Target color to match (e.g. "#FF0000")
 * @param {number} threshold - Distance threshold for color matching
 * @returns {object} - { binarizedImageData: ImageData, centroid: {x, y} | null }
 */
export function binarizeImage(imageData, targetHexColor, threshold) {
  // Convert hex target color to RGB array
  const targetColor = hexToRgb(targetHexColor);

  const width = imageData.width;
  const height = imageData.height;

  // Create a copy of pixels to modify (RGBA, 4 bytes per pixel)
  const pixels = new Uint8ClampedArray(imageData.data);

  // Create binary mask array: 1 for pixels close to target, 0 otherwise
  const binaryArray = new Uint8Array(width * height);

  for (let i = 0; i < width * height; i++) {
    // Extract original pixel RGB components
    const r = pixels[i * 4];
    const g = pixels[i * 4 + 1];
    const b = pixels[i * 4 + 2];

    // Calculate distance from target color
    const dist = colorDistance([r, g, b], targetColor);

    // Determine if pixel is close enough to target color
    const isClose = dist < threshold ? 1 : 0;
    binaryArray[i] = isClose;

    // Set pixel to white (255) if close, black (0) if not
    const value = isClose ? 255 : 0;
    pixels[i * 4] = value;       // Red
    pixels[i * 4 + 1] = value;   // Green
    pixels[i * 4 + 2] = value;   // Blue
    pixels[i * 4 + 3] = 255;   // Alpha (fully opaque)
  }

  // Find centroid of the largest white connected group in the binary image
  const centroid = findLargestConnectedGroupCentroid(binaryArray, width, height);

  // Return new ImageData for binarized image and centroid coordinates
  return {
    binarizedImageData: new ImageData(pixels, width, height),
    centroid,
  };
}
