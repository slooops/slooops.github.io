# Use Python 3.11 slim image
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Create a non-root user for security
RUN addgroup --gid 1001 appgroup && \
    adduser --disabled-password --gecos "" --uid 1001 --gid 1001 appuser

# Set proper permissions for OpenShift compatibility
RUN chgrp -R 0 /app && \
    chmod -R g=u /app

# Switch to non-root user
USER 1001

# Expose the port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
