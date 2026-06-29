#!/usr/bin/env python3
# (c) Copyright IBM Corp. 2026
"""
{{COLLECTOR_NAME}} Collector

This is a template collector that demonstrates how to build a custom collector
using the Instana Extension Base Library.

NOTE: This template uses a low-level approach (direct config loading and endpoint iteration).
Future versions of the Extension Base Library may provide higher-level abstractions
(e.g., ExtensionBase class with automatic endpoint management).

Replace this implementation with your actual collection logic.
"""

import os
import sys
import time
import json
from typing import Dict, Any

# Import extension base library (pre-installed in base image)
from extension_base.logging import setup_logging, get_logger


def load_config() -> Dict[str, Any]:
    """
    Load extension runtime configuration from mounted file.
    
    The Supervisor generates and mounts the runtime configuration at:
    /opt/instana/custom-collector/config/extension-config.json
    
    This runtime configuration includes:
    - Extension metadata (extension_id, extension_name, extension_version)
    - Base configuration (interval, timeout, batch_size, log_level)
    - Endpoints array (with credentials, tags, custom_params)
    - OTLP configuration (endpoint, protocol, compression)
    
    Returns:
        Configuration dictionary with runtime settings.
    """
    config_file = os.environ.get(
        "INSTANA_EXTENSION_CONFIG",
        "/opt/instana/custom-collector/config/extension-config.json"
    )
    
    logger = get_logger(__name__)
    
    try:
        with open(config_file, 'r') as f:
            config = json.load(f)
            logger.info(f"Configuration loaded from {config_file}")
            return config
    except FileNotFoundError:
        logger.warning(f"Configuration file not found: {config_file}")
        logger.warning("Using default configuration for development")
        # Fallback configuration for local development/testing
        return {
            "extension_id": "{{PACKAGE_NAME}}-dev",
            "extension_name": "{{PACKAGE_NAME}}",
            "extension_version": "1.0.0",
            "configuration": {
                "interval": 60,
                "timeout": 30,
                "log_level": "INFO",
                "endpoints": []
            },
            "otlp": {
                "endpoint": "localhost:4317",
                "protocol": "grpc"
            }
        }
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in configuration file: {e}")
        sys.exit(1)


def collect_metrics(endpoint: Dict[str, Any], logger: Any) -> None:
    """
    Collect metrics from a single endpoint.
    
    This is where you implement your actual collection logic.
    
    Args:
        endpoint: Endpoint configuration from runtime config
        logger: Logger instance for structured logging
    
    Example endpoint structure (from runtime configuration):
        {
            "id": "endpoint-1",
            "url": "https://example.com:8000",
            "credentials_ref": "example.endpoint.1",
            "interval": 60,
            "enabled": true,
            "tags": {
                "environment": "production",
                "region": "us-east-1"
            },
            "custom_params": {
                "timeout": 30,
                "max_retries": 3
            }
        }
    
    Implementation Steps:
        1. Extract endpoint details (url, credentials_ref, custom_params)
        2. Fetch data from endpoint (HTTP, database, API, etc.)
        3. Parse and transform data
        4. Emit metrics using OpenTelemetry SDK
        5. Handle errors and implement retry logic
    """
    endpoint_id = endpoint.get("id", "unknown")
    endpoint_url = endpoint.get("url", "unknown")
    
    logger.info(
        f"Collecting metrics from endpoint",
        extra={
            "extra_fields": {
                "endpoint_id": endpoint_id,
                "endpoint_url": endpoint_url
            }
        }
    )
    
    # TODO: Implement your collection logic here
    # Example implementation:
    #
    # import requests
    # from opentelemetry import metrics
    # from opentelemetry.sdk.metrics import MeterProvider
    # from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
    #
    # # 1. Get credentials (if needed)
    # credentials_ref = endpoint.get("credentials_ref")
    # # Note: Credentials are resolved by Supervisor and available in config
    #
    # # 2. Fetch data from endpoint
    # timeout = endpoint.get("custom_params", {}).get("timeout", 30)
    # response = requests.get(endpoint_url, timeout=timeout)
    # data = response.json()
    #
    # # 3. Emit metrics
    # meter = metrics.get_meter(__name__)
    # counter = meter.create_counter("custom.metric.count")
    # counter.add(data["count"], {"endpoint_id": endpoint_id})
    
    # Placeholder implementation
    logger.debug(f"Metrics collected from {endpoint_id}")


def main():
    """
    Main entry point for the collector.
    
    This function:
    1. Sets up structured logging (JSON format)
    2. Loads runtime configuration from mounted file
    3. Initializes OpenTelemetry SDK (if needed)
    4. Starts collection loop for each endpoint
    5. Handles graceful shutdown on SIGTERM/SIGINT
    """
    # Setup logging (JSON format for container environments)
    log_level = os.environ.get("INSTANA_LOG_LEVEL", "INFO")
    logger = setup_logging(level=log_level, json_format=True)
    
    logger.info("=== {{COLLECTOR_NAME}} Collector Starting ===")
    logger.info(f"Python version: {sys.version}")
    
    # Load runtime configuration
    config = load_config()
    
    extension_id = config.get("extension_id", "unknown")
    extension_name = config.get("extension_name", "unknown")
    extension_version = config.get("extension_version", "unknown")
    
    logger.info(f"Extension: {extension_name} v{extension_version} (ID: {extension_id})")
    
    # Get configuration settings
    configuration = config.get("configuration", {})
    interval = configuration.get("interval", 60)
    endpoints = configuration.get("endpoints", [])
    
    # Get OTLP configuration
    otlp_config = config.get("otlp", {})
    otlp_endpoint = otlp_config.get("endpoint", "localhost:4317")
    
    logger.info(f"Collection interval: {interval}s")
    logger.info(f"OTLP endpoint: {otlp_endpoint}")
    logger.info(f"Configured endpoints: {len(endpoints)}")
    
    if not endpoints:
        logger.warning("No endpoints configured. Running in idle mode.")
        logger.warning("Waiting for configuration to be mounted by Supervisor...")
    
    # TODO: Initialize OpenTelemetry SDK with OTLP exporter
    # Example:
    # from opentelemetry.sdk.metrics import MeterProvider
    # from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
    # from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
    #
    # exporter = OTLPMetricExporter(endpoint=otlp_endpoint)
    # reader = PeriodicExportingMetricReader(exporter, export_interval_millis=60000)
    # provider = MeterProvider(metric_readers=[reader])
    # metrics.set_meter_provider(provider)
    
    # Main collection loop
    try:
        while True:
            logger.debug(f"Starting collection cycle at {time.time()}")
            
            # Collect from each enabled endpoint
            for endpoint in endpoints:
                if not endpoint.get("enabled", True):
                    logger.debug(f"Skipping disabled endpoint: {endpoint.get('id')}")
                    continue
                
                try:
                    collect_metrics(endpoint, logger)
                except Exception as e:
                    logger.error(
                        f"Error collecting from endpoint {endpoint.get('id')}: {e}",
                        exc_info=True
                    )
            
            # Wait for next collection cycle
            logger.debug(f"Sleeping for {interval}s until next collection")
            time.sleep(interval)
            
    except KeyboardInterrupt:
        logger.info("Received shutdown signal, stopping collector...")
    except Exception as e:
        logger.error(f"Unexpected error in main loop: {e}", exc_info=True)
        sys.exit(1)
    
    logger.info("Collector stopped")
    return 0


if __name__ == "__main__":
    sys.exit(main())
