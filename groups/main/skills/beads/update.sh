#!/bin/bash
# Update a research issue status
# Usage: ./update.sh <issue-id> <status> [close-reason]
# Statuses: open, in_progress, completed, blocked
# Example: ./update.sh research-abc in_progress
#          ./update.sh research-abc completed "Dossier created at osint/dossiers/..."

set -e

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
NEW_STATUS="$2"
CLOSE_REASON="$3"

if [ -z "$ISSUE_ID" ] || [ -z "$NEW_STATUS" ]; then
  echo "Usage: $0 <issue-id> <status> [close-reason]"
  echo "Statuses: open, in_progress, completed, blocked"
  exit 1
fi

# Verify issue exists and is a research issue
EXISTS=$(jq -rs --arg id "$ISSUE_ID" '[.[] | select(.id == $id)] | length' "$BEADS_FILE")
if [ "$EXISTS" = "0" ]; then
  echo "Error: Issue $ISSUE_ID not found"
  exit 1
fi

if [[ ! "$ISSUE_ID" =~ ^research- ]]; then
  echo "Error: Can only update research-* issues"
  exit 1
fi

TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%S.000000000Z)
TEMP_FILE=$(mktemp)

# Update the issue using jq slurp
if [ "$NEW_STATUS" = "completed" ]; then
  jq -rs --arg id "$ISSUE_ID" --arg status "$NEW_STATUS" --arg ts "$TIMESTAMP" --arg reason "${CLOSE_REASON:-Completed}" \
    '[.[] | if .id == $id then .status = $status | .updated_at = $ts | .closed_at = $ts | .close_reason = $reason else . end] | .[] | @json' \
    "$BEADS_FILE" | while read -r line; do echo "$line" | jq -c .; done > "$TEMP_FILE"
else
  jq -rs --arg id "$ISSUE_ID" --arg status "$NEW_STATUS" --arg ts "$TIMESTAMP" \
    '[.[] | if .id == $id then .status = $status | .updated_at = $ts else . end] | .[] | @json' \
    "$BEADS_FILE" | while read -r line; do echo "$line" | jq -c .; done > "$TEMP_FILE"
fi

mv "$TEMP_FILE" "$BEADS_FILE"

echo "✅ Updated $ISSUE_ID → $NEW_STATUS"
