# Video Libraries

## Options:

### 1. JavaCV
JavaCV is a wrapper for OpenCV and FFmpeg allowing you to work with video and computer vision tasks.
Pros:
- Read and write video files
- Capture video from a camera
- Encode/Decode multiple formats
Cons:
- Steep learning curve
- VLC required to be installed
- Not pure Java

### 2. VLCJ
VLCJ provides bindings to VLC media player. It can be used to play, stream, and process video and audio making it a simple solution for video playback and metadata extraction.
Pros:
- Play audio and video
- Control playback (pause, resume, etc.)
- Capture web cam input
Cons:
- Memory intensive due to VLC dependencies
- Playback might not be the fastest
- Might be difficult to use in non-GUI apps without VLC support

### 3. GStreamer
GStreamer is a multimedia framework written in C, widely used in professional and open-source projects. It allows complex media processing. 
Pros:
- Wide format and protocol support
- Professional grade features
- Good community
Cons:
- Native library install (not 100% Java)
- Steep learning curve
- Limited java-specific documentation