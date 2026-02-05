#!/bin/bash
# Create a new research issue
# Usage: ./create.sh "Title" "Description"
# Example: ./create.sh "Research Alex Jones network" "Map connections and funding sources"

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
TITLE="$1"
DESCRIPTION="$2"

if [ -z "$TITLE" ]; then
  echo "Usage: $0 'Title' 'Description'"
  exit 1
fi

# Generate random ID (research-xxx)
ID="research-$(head -c 100 /dev/urandom | tr -dc 'a-z0-9' | head -c 3)"

# Check for collision (unlikely but safe)
while grep -q "\"id\":\"$ID\"" "$BEADS_FILE" 2>/dev/null; do
  ID="research-$(head -c 100 /dev/urandom | tr -dc 'a-z0-9' | head -c 3)"
done

TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%S.000000000Z)

# Create issue JSON (compact, single line)
ISSUE=$(jq -cn \
  --arg id "$ID" \
  --arg title "$TITLE" \
  --arg desc "${DESCRIPTION:-}" \
  --arg ts "$TIMESTAMP" \
  '{
    id: $id,
    title: $title,
    description: $desc,
    status: "open",
    priority: 2,
    issue_type: "task",
    owner: "oilcloth",
    created_at: $ts,
    created_by: "oilcloth",
    updated_at: $ts
  }')

# Append to beads file
echo "$ISSUE" >> "$BEADS_FILE"

echo "✅ Created issue: $ID"
echo "   Title: $TITLE"
echo ""
echo "Next: ./skills/beads/update.sh $ID in_progress"
