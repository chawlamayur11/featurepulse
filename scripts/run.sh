#!/usr/bin/env bash
set -e

echo "=== Starting FeaturePulse ==="
if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    echo "Running with Docker Compose..."
    docker compose up --build
else
    echo "Docker not found, starting local development servers..."
    cd backend && python -m uvicorn app.main:app --reload --port 8000 &
    cd ../frontend && npm run dev &
    wait
fi
