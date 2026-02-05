#!/bin/bash
# List research issues (research-* prefix)
# Usage: ./list.sh [status]
# Examples:
#   ./list.sh           # All research issues
#   ./list.sh open      # Only open issues
#   ./list.sh in_progress

# Find beads file (works in container or on host)
if [ -f "/workspace/project/.beads/issues.jsonl" ]; then
  BEADS_FILE="/workspace/project/.beads/issues.jsonl"
elif [ -f "$(git rev-parse --show-toplevel 2>/dev/null)/.beads/issues.jsonl" ]; then
  BEADS_FILE="$(git rev-parse --show-toplevel)/.beads/issues.jsonl"
else
  echo "No beads database found"
  exit 1
fi
STATUS_FILTER="${1:-}"

if [ ! -f "$BEADS_FILE" ]; then
  echo "No beads database found"
  exit 1
fi

echo "# Research Issues"
echo ""

# Use jq slurp to handle both compact and multiline JSON
if [ -n "$STATUS_FILTER" ]; then
  jq -rs --arg status "$STATUS_FILTER" \
    '.[] | select(.id | startswith("research-")) | select(.status == $status) | "[\(.id)] \(.status) - \(.title)"' "$BEADS_FILE"
else
  jq -rs \
    '.[] | select(.id | startswith("research-")) | "[\(.id)] \(.status) - \(.title)"' "$BEADS_FILE"
fi
