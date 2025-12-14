#!/bin/bash

# Function to cleanup
cleanup() {
    echo "Stopping services..."
    if [ ! -z "$BACKEND_PID" ]; then kill $BACKEND_PID 2>/dev/null; fi
    if [ ! -z "$FRONTEND_PID" ]; then kill $FRONTEND_PID 2>/dev/null; fi
    exit
}

# Trap signals
trap cleanup SIGINT SIGTERM

# Kill any existing processes on ports 8000 and 5173
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

UV_PATH="/Users/ganeshanarumuganainar/Library/Python/3.9/bin/uv"

echo "Starting Backend..."
cd backend
# Ensure venv exists
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    $UV_PATH venv .venv
    $UV_PATH pip install -r requirements.txt --python .venv
fi

# Start backend in background
$UV_PATH run uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
cd ..

echo "Starting Frontend..."
cd frontend
# Ensure node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    pnpm install
fi

# Start frontend
pnpm dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
cd ..

echo "Application started!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "Press CTRL+C to stop both."

# Monitor processes
while kill -0 $BACKEND_PID 2>/dev/null && kill -0 $FRONTEND_PID 2>/dev/null; do
    sleep 1
done

echo "One of the processes exited unexpectedly."
cleanup
