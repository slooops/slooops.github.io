FROM eclipse-temurin:25-jre

# Application directory
ENV APP_HOME=/server
WORKDIR $APP_HOME

# Create non-root user (system user with no shell)
RUN useradd -r -u 1001 -g root rev

# Copy pre-built jar produced by CI (ensure 'mvn package' ran before docker build)
COPY target/revenue-monitoring-server.jar app.jar

# Set ownership for least privilege runtime
RUN chown rev:root app.jar

EXPOSE 8080

# Switch to non-root user for runtime
USER rev

# Run the Spring Boot jar in foreground (no trailing ampersand)
ENTRYPOINT ["java","-jar","app.jar"]
