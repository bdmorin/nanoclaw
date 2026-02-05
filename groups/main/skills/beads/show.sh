#!/bin/bash
# Show details of an issue
# Usage: ./show.sh <issue-id>

# Find beads file (works in container or on host)
if [ -f "/workspace/project/.beads/issues.jsonl" ]; then
  BEADS_FILE="/workspace/project/.beads/issues.jsonl"
elif [ -f "$(git rev-parse --show-toplevel 2>/dev/null)/.beads/issues.jsonl" ]; then
  BEADS_FILE="$(git rev-parse --show-toplevel)/.beads/issues.jsonl"
else
  echo "No beads database found"
  exit 1
fi
ISSUE_ID="$1"

if [ -z "$ISSUE_ID" ]; then
  echo "Usage: $0 <issue-id>"
  exit 1
fi

# Use jq slurp to handle both compact and multiline JSON
ISSUE=$(jq -rs --arg id "$ISSUE_ID" '.[] | select(.id == $id)' "$BEADS_FILE")

if [ -z "$ISSUE" ] || [ "$ISSUE" = "null" ]; then
  echo "Error: Issue $ISSUE_ID not found"
  exit 1
fi

echo "$ISSUE" | jq -r '
"# \(.title)

**ID:** \(.id)
**Status:** \(.status)
**Priority:** P\(.priority)
**Owner:** \(.owner)
**Created:** \(.created_at) by \(.created_by)
**Updated:** \(.updated_at)
" + (if .closed_at then "**Closed:** \(.closed_at)\n**Reason:** \(.close_reason)" else "" end) + "

## Description

\(.description)"'
