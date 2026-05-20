# Multi-stage build for Python collector
FROM python:3.9-slim as builder

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final stage
FROM python:3.9-slim

WORKDIR /app

# Copy installed dependencies from builder
COPY --from=builder /root/.local /root/.local
COPY {{COLLECTOR_NAME}}_collector.py .
COPY config.json .

# Make sure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

# Run the collector
CMD ["python", "{{COLLECTOR_NAME}}_collector.py"]
