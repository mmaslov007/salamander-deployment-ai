## Stage 1: build Java processor using Maven
FROM maven:3.9-eclipse-temurin-21 AS java-builder
WORKDIR /build

# copy processor sources (build context must include parent path)
COPY processor/pom.xml ./
COPY processor/src ./src
RUN mvn -B clean package -DskipTests

## Stage 2: final Node runtime image
FROM eclipse-temurin:21-jre
WORKDIR /app

# Install Node 20 (from NodeSource), ffmpeg, and other utilities
RUN apt-get update && apt-get install -y curl ca-certificates gnupg \
  && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y nodejs ffmpeg && rm -rf /var/lib/apt/lists/*

# Install Node dependencies
COPY server/package*.json ./
RUN npm ci --only=production

# Copy server source
COPY server/ ./

# Copy the assembled processor JAR from the builder stage
COPY --from=java-builder /build/target/videoprocessor.jar ./processor.jar

# Install ffmpeg and Java runtime
# (Java runtime already provided by this base image)


# Create runtime directories for persisted data
RUN mkdir -p /app/videos /app/results /app/thumbnails

ENV PORT=3000 \
    RESULTS_DIR=/app/results \
    VIDEO_DIR=/app/videos \
    THUMBNAIL_DIR=/app/thumbnails \
    JOBS_FILE=/app/jobs.json \
    JAR_PATH=/app/processor.jar

EXPOSE 3000

CMD ["node", "server.js"]
