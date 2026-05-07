# Build stage for Node.js application
FROM node:20-slim AS node-builder
WORKDIR /app

# Copy package files into server directory and install dependencies
COPY server/package*.json server/
RUN npm install --prefix server

# Copy server source files
COPY server/ server/

# Build stage for Java application
FROM maven:3.9-eclipse-temurin-21 AS java-builder
WORKDIR /app
COPY processor/pom.xml ./
COPY processor/src ./src
RUN mvn clean package -DskipTests

# Final runtime stage
FROM eclipse-temurin:21-jre

# Set working directory to /app
WORKDIR /app

# Install Node.js, npm, and ffmpeg using apt-get
RUN apt-get update && \
    apt-get install -y nodejs npm ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Copy Node.js application and modules
COPY --from=node-builder /app/server ./server
COPY --from=node-builder /app/server/node_modules ./server/node_modules

# Copy Java application JAR to root of /app
COPY --from=java-builder /app/target/*.jar ./processor.jar

# Copy environment file into root directory
COPY .env ./

# Create directories for persistent volumes
RUN mkdir -p server/videos server/results server/thumbnails

# Set environment variables
ENV PORT=3000 \
    JAR_PATH=/app/processor.jar \
    VIDEO_DIR=/app/server/videos \
    RESULTS_DIR=/app/server/results \
    THUMBNAIL_DIR=/app/server/thumbnails \
    JOBS_FILE=/app/server/jobs.json \
    JAVA_HOME=/opt/java/openjdk \
    PATH="${JAVA_HOME}/bin:${PATH}"

# Create non-root user and adjust ownership
RUN addgroup --system appgroup && adduser --system appuser --ingroup appgroup && \
    chown -R appuser:appgroup /app
USER appuser

# Expose the server port
EXPOSE 3000

# Start the application from the server directory
WORKDIR /app/server
CMD ["node", "server.js"]
