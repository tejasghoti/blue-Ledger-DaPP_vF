#!/usr/bin/env bash
# ==============================================================================
# Blue Ledger - Development Environment Launcher
# ==============================================================================

echo "🌊 Starting Blue Ledger Enterprise Web3 Platform..."

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Start AI Verifier Backend
echo "🤖 Starting AI Verifier Backend on http://localhost:3001..."
cd "$ROOT_DIR/blue-ledger-ai-verifier/backend"
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi
node server.js &
BACKEND_PID=$!

# Start Vite Frontend
echo "💻 Starting Frontend dApp..."
cd "$ROOT_DIR/blue-ledger-ai-verifier"
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi
npm run dev &
FRONTEND_PID=$!

echo "=================================================================="
echo "✅ Blue Ledger Platform active!"
echo "   - Frontend dApp:  http://localhost:5173"
echo "   - AI Backend API: http://localhost:3001"
echo "=================================================================="

# Handle shutdown
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM EXIT
wait
