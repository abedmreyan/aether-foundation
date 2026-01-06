#!/bin/sh
set -e  # Exit on any error
set -x  # Print commands as they execute

echo "=== Container Starting ==="
echo "Node version: $(node --version)"
echo "Working directory: $(pwd)"
echo "Directory contents:"
ls -la /app
echo "Dist contents:"
ls -la /app/dist
echo "Environment variables:"
env | grep -E '(NODE_ENV|PORT|DATABASE)'
echo "=== Starting Node Application ==="

# Run node with explicit error reporting
node dist/index.js 2>&1 || {
  echo "=== NODE PROCESS FAILED WITH EXIT CODE $? ==="
  exit 1
}
