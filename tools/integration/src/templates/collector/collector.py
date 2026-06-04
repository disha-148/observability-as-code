#!/usr/bin/env python3
"""
Minimal collector template for testing build command.
This is a placeholder that will be replaced with actual collector logic.
"""

import sys
import time
import json

def main():
    # Flush output immediately (unbuffered)
    print("Collector started", flush=True)
    print("Configuration: placeholder", flush=True)
    
    # Simple loop to keep container running
    while True:
        print(f"Collecting metrics at {time.time()}", flush=True)
        sys.stdout.flush()  # Force flush
        time.sleep(60)

if __name__ == "__main__":
    main()

# Made with Bob
