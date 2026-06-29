FROM eclipse-temurin:25-jre

# Application directory
ENV APP_HOME=/server \
	HOME=/tmp
WORKDIR $APP_HOME

# Prepare runtime directories for non-root / arbitrary UID environments
RUN mkdir -p "$APP_HOME" /tmp \
	&& chgrp -R 0 "$APP_HOME" /tmp \
	&& chmod -R g=u "$APP_HOME" /tmp

# Copy pre-built jar produced by CI (ensure 'mvn package' ran before docker build)
COPY --chown=1001:0 target/revenue-monitoring-server.jar app.jar

EXPOSE 8080

# TEMPORARY: run as root to unblock Jenkins/runtime permission issues
USER root

# Run the Spring Boot jar in foreground (no trailing ampersand)
ENTRYPOINT ["java","-jar","app.jar"]
