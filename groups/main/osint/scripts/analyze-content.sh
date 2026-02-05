#!/bin/bash
# Analyze content with fabric patterns
# Usage: ./analyze-content.sh [pattern] < content.txt
#        ./analyze-content.sh [pattern] content.txt
#        echo "content" | ./analyze-content.sh [pattern]
#
# Common OSINT patterns:
#   analyze_claims        - Verify claims, rate truthfulness
#   analyze_personality   - Psychological profile from content
#   extract_extraordinary_claims - Flag conspiracy/misinfo
#   extract_insights      - Key insights from content
#   summarize            - Concise summary
#   extract_references   - Extract all references/citations
#   extract_predictions  - Find predictions made

set -e

PATTERN="${1:-analyze_claims}"
INPUT_FILE="$2"

# Check if fabric is available
if ! command -v fabric &> /dev/null; then
  echo "Error: fabric not found. Is it installed?" >&2
  exit 1
fi

# Read content from file or stdin
if [ -n "$INPUT_FILE" ] && [ -f "$INPUT_FILE" ]; then
  CONTENT=$(cat "$INPUT_FILE")
elif [ ! -t 0 ]; then
  CONTENT=$(cat)
else
  echo "Usage: $0 [pattern] < content.txt"
  echo "       $0 [pattern] content.txt"
  echo ""
  echo "OSINT-relevant patterns:"
  echo "  analyze_claims           - Verify claims, rate truthfulness"
  echo "  analyze_personality      - Psychological profile"
  echo "  extract_extraordinary_claims - Flag misinfo/conspiracy"
  echo "  extract_insights         - Key insights"
  echo "  summarize               - Concise summary"
  echo "  extract_references      - Extract citations"
  echo "  extract_predictions     - Find predictions"
  echo "  analyze_email_headers   - Email security analysis"
  echo "  create_threat_scenarios - Threat modeling"
  echo ""
  echo "List all patterns: fabric --listpatterns"
  exit 1
fi

# Run fabric
echo "$CONTENT" | fabric --pattern "$PATTERN"
