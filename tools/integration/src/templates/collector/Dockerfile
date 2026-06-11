# Global ARG for Python version (can be overridden with --build-arg)
ARG PYTHON_VERSION=3.9

# Multi-stage build for Python collector
FROM python:${PYTHON_VERSION}-slim as builder

# Re-declare ARG inside builder stage
ARG PYTHON_VERSION=3.9

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN mkdir -p /root/.local && \
    pip install --no-cache-dir --user -r requirements.txt || true

# Final stage
FROM python:${PYTHON_VERSION}-slim

# Re-declare ARG inside final stage
ARG PYTHON_VERSION=3.9

WORKDIR /app

# Copy installed dependencies from builder
COPY --from=builder /root/.local /root/.local
COPY {{COLLECTOR_NAME}}_collector.py .
COPY config.json .

# Make sure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

# Run the collector
CMD ["python", "{{COLLECTOR_NAME}}_collector.py"]
