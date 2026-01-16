#!/bin/bash

# Startup script for CodeGuard Nexus Backend

# Activate virtual environment
source venv/bin/activate

# Start the FastAPI server
echo "Starting CodeGuard Nexus Backend API..."
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
