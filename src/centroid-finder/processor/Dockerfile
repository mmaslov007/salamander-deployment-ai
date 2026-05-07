FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build

# Copy pom and sources then build the assembly jar
COPY pom.xml ./
COPY src ./src
RUN mvn -B clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy the assembled jar from the builder stage
COPY --from=builder /build/target/videoprocessor.jar ./processor.jar

CMD ["java", "-jar", "/app/processor.jar"]
