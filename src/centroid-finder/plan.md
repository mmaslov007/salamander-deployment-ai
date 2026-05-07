# Video Processor Extension Plan

## Overview
Extend the centroid-finder project to process videos frame by frame, tracking the largest color centroid over time. Output results as a CSV file with timestamps and coordinates.

## Architecture

### Existing Components (to reuse)
- `ImageBinarizer` interface and `DistanceImageBinarizer` implementation
- `BinaryGroupFinder` interface and `DfsBinaryGroupFinder` implementation
- `ImageGroupFinder` interface and `BinarizingImageGroupFinder` implementation
- `ColorDistanceFinder` interface and `EuclideanColorDistance` implementation
- `Group` and `Coordinate` classes

### New Components
1. **VideoProcessor** - Core class to process video files
   - Takes a video file path, processes frames, and tracks centroids
   - Uses existing centroid finder components
   - Outputs CSV with timestamps and coordinates

2. **VideoProcessorApp** - Main application class
   - Parses command line arguments
   - Validates input
   - Instantiates VideoProcessor and runs the processing

3. **CentroidTracker** - Optional class to track centroids between frames
   - Ensures continuity in centroid tracking
   - Handles cases where centroids disappear/reappear

4. **CsvWriter** - Utility class for writing CSV output
   - Creates and writes to the output CSV file
   - Formats timestamp and centroid data correctly

### Diagram

```
┌───────────────────┐     ┌────────────────┐
│ VideoProcessorApp │─────┤ VideoProcessor │
└───────────────────┘     └────────┬───────┘
                                   │
                                   │ uses
                                   ▼
┌────────────────────────────────────────────────────┐
│               Existing Components                  │
│                                                    │
│  ┌─────────────────┐      ┌───────────────────┐    │
│  │ ImageBinarizer  │      │ BinaryGroupFinder │    │
│  └─────────────────┘      └───────────────────┘    │
│                                                    │
│  ┌─────────────────┐      ┌───────────────────┐    │
│  │ ImageGroupFinder│      │ColorDistanceFinder│    │
│  └─────────────────┘      └───────────────────┘    │
└────────────────────────────────────────────────────┘
        │                           │
        │ produces                  │ used by
        ▼                           ▼
┌──────────────┐             ┌────────────────┐
│ CsvWriter    │◄────────────┤CentroidTracker │
└──────────────┘             └────────────────┘
```

## Implementation Plan

### 1. Setup Maven Assembly Plugin
- Configure pom.xml to create an executable JAR
- Set main class to the new VideoProcessorApp
- Include all dependencies in the JAR

### 2. Create VideoProcessorApp
- Parse command line arguments (inputPath, outputCsv, targetColor, threshold)
- Validate inputs
- Set up VideoProcessor with appropriate parameters

### 3. Implement VideoProcessor
- Use JavaCV/FFmpegFrameGrabber to read video frames
- Process each frame using existing centroid finder components
- Track largest centroid over time
- Generate CSV output with timestamp, x, y coordinates
- Handle errors gracefully

### 4. Implement CsvWriter
- Create utility for writing CSV data
- Format timestamp as seconds since start
- Format x, y coordinates
- Use (-1, -1) when no centroid is found

### 5. (Optional) Implement CentroidTracker
- Track centroids between frames for better continuity

### 6. Testing
- Create unit tests for each new component
- Test with sample videos
- Validate CSV output format

### 7. Packaging
- Build executable JAR with Maven Assembly Plugin
- Ensure all dependencies are included

## Validation Strategy
- Use a sample video with known color regions
- Compare tracked centroids with expected positions
- Test edge cases:
  - No centroids in frame
  - Multiple similarly-sized centroids
  - Fast-moving centroids
- Test with actual salamander video and validate results visually

## Salamander Video Validation
For validating with the salamander video, we will:

1. Use a video player to visually identify the salamander's color
2. Extract a sample frame and use an image editor to get the RGB value of the salamander
3. Test different threshold values to find the optimal setting that isolates the salamander
4. Run our video processor on the salamander video with the identified color and threshold
5. Visualize the results by:
   - Plotting the centroid coordinates over time
   - Checking if the tracked path matches the salamander's movement
   - Verifying that the centroid is consistently tracking the salamander and not other objects
6. Refine the color and threshold values if needed based on the results