# Docker Implementation Plan for Centroid Finder Server

## Base Image Selection
- We will use a multi-stage build approach to keep the final image size small
- Base image: `node:20-slim` for the Node.js environment
- Second stage: `eclipse-temurin:17-jre-alpine` for Java runtime
- This combination ensures we have both Node.js and Java available while keeping the image size minimal

## Multi-stage Build Strategy
1. **Build Stage**
   - Use Node.js base image
   - Copy package.json and install dependencies
   - Build the Node.js application
   - Copy Java source files and compile them

2. **Runtime Stage**
   - Use Java JRE Alpine image
   - Copy only necessary files from build stage
   - Set up environment variables
   - Configure volume mounts

## Environment Setup
- Environment Variables:
  - `VIDEO_DIRECTORY`: Path to mounted video directory
  - `RESULTS_DIRECTORY`: Path to mounted results directory
  - `PORT`: Server port (default: 3000)

## Volume Configuration
- Mount points:
  - `/videos`: For input video files
  - `/results`: For output results
- These will be mounted from the host system using Docker volumes

## Port Configuration
- Expose port 3000 for the server
- Map to host port 3000 using `-p 3000:3000`

## Testing Strategy
1. **Local Testing**
   - Build image locally: `docker build -t centroid-finder .`
   - Test with sample data:
     ```bash
     docker run -p 3000:3000 \
       -v "$(pwd)/videos:/videos" \
       -v "$(pwd)/results:/results" \
       centroid-finder
     ```
   - Use Postman to test endpoints
   - Verify file access and processing

2. **Integration Testing**
   - Test with frontend application
   - Verify video processing
   - Check results generation

## Image Optimization
- Use multi-stage builds to reduce final image size
- Only copy necessary files to runtime image
- Use Alpine-based images where possible
- Implement proper layer caching
- Remove build dependencies in final image

## Security Considerations
- Run as non-root user
- Only expose necessary ports
- Use environment variables for configuration
- Implement proper file permissions

## Dockerfile Structure
```dockerfile
# Build stage
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm install --production

ENV PORT=3000
ENV VIDEO_DIRECTORY=/videos
ENV RESULTS_DIRECTORY=/results

EXPOSE 3000
CMD ["npm", "start"]
```

## Publishing Strategy
1. Build image with GHCR tag
2. Push to GitHub Container Registry
3. Make package public
4. Document usage instructions

## Future Improvements
- Add health checks
- Implement automated testing in CI/CD
- Add monitoring and logging
- Optimize build caching
- Add documentation for different deployment scenarios
