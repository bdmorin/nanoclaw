#!/bin/bash
# Check if oilcloth is currently processing
# Usage: ./scripts/check-oilcloth.sh
# Exit 0 if idle, exit 1 if busy

CONTAINER=$(docker ps --filter "ancestor=nanoclaw-agent:latest" --format "{{.ID}}" | head -1)

if [ -n "$CONTAINER" ]; then
  echo "⚠️  oilcloth is currently processing (container: $CONTAINER)"
  echo ""
  echo "Running processes:"
  docker exec "$CONTAINER" ps aux 2>/dev/null | grep -E "node|claude|fabric" | head -5
  echo ""
  echo "To wait: watch -n2 './scripts/check-oilcloth.sh'"
  echo "To kill: docker kill $CONTAINER"
  exit 1
else
  echo "✅ oilcloth is idle - safe to rebuild/restart"
  exit 0
fi
