#!/bin/sh
echo "[DIAG] Container started at $(date)"
echo "[DIAG] Node version: $(node --version)"
echo "[DIAG] Working dir: $(pwd)"
echo "[DIAG] Files in /app/dist:"
ls -la /app/dist
echo "[DIAG] Environment:"
env | grep -E "(NODE|PORT|DATABASE)" || echo "No matching env"
echo "[DIAG] ========== STARTING NODE =========="
node --trace-warnings /app/dist/index.js 2>&1
EXIT_CODE=$?
echo "[DIAG] Node exited with code: $EXIT_CODE"
exit $EXIT_CODE
