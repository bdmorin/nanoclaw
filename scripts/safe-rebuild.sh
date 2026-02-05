#!/bin/bash
# Safely rebuild container only if oilcloth is idle
# Usage: ./scripts/safe-rebuild.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Check if oilcloth is busy
if ! "$SCRIPT_DIR/check-oilcloth.sh"; then
  echo ""
  read -p "oilcloth is busy. Wait for completion? [y/N] " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Waiting for oilcloth to finish..."
    while ! "$SCRIPT_DIR/check-oilcloth.sh" 2>/dev/null; do
      sleep 5
    done
    echo ""
  else
    echo "Aborted. Run again when oilcloth is idle."
    exit 1
  fi
fi

echo "Building container..."
cd "$PROJECT_DIR/container" && ./build.sh

echo ""
echo "Rebuilding nanoclaw..."
cd "$PROJECT_DIR" && npm run build

echo ""
echo "Restarting service..."
sudo systemctl restart nanoclaw

echo ""
echo "✅ Done! Check status with: systemctl status nanoclaw"
