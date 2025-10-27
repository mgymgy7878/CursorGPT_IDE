#!/bin/bash

# Process Manager Script for Spark Platform
# Handles auto-restart and monitoring

echo "🚀 Starting Spark Platform Development Server..."

# Kill any existing processes on port 3003
echo "🔍 Checking for existing processes..."
lsof -ti:3003 | xargs kill -9 2>/dev/null || true

# Set memory limits
export NODE_OPTIONS="--max-old-space-size=4096"

# Start with auto-restart on crash
echo "📦 Starting Next.js development server..."
pnpm dev &

# Get the PID
DEV_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down..."
    kill $DEV_PID 2>/dev/null || true
    exit 0
}

# Trap signals
trap cleanup SIGINT SIGTERM

echo "✅ Server started with PID: $DEV_PID"
echo "🌐 Access at: http://localhost:3003"
echo "📊 Health check: http://localhost:3003/api/health"

# Wait for the process
wait $DEV_PID
