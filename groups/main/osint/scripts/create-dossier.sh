#!/bin/bash
# Create a new OSINT dossier
# Usage: ./create-dossier.sh "Subject Name" "type"
# Types: person, organization, incident, domain, other

set -e

SUBJECT="$1"
TYPE="${2:-other}"
DATE=$(date +%Y-%m-%d)
SLUG=$(echo "$SUBJECT" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
DOSSIER_ID="${DATE}_${SLUG}"
DOSSIER_PATH="/workspace/group/osint/dossiers/${DOSSIER_ID}"

if [ -z "$SUBJECT" ]; then
  echo "Usage: $0 'Subject Name' [type]"
  echo "Types: person, organization, incident, domain, other"
  exit 1
fi

if [ -d "$DOSSIER_PATH" ]; then
  echo "Error: Dossier already exists at $DOSSIER_PATH"
  exit 1
fi

echo "Creating dossier: $DOSSIER_ID"
mkdir -p "$DOSSIER_PATH/media"

# Create metadata.json
cat > "$DOSSIER_PATH/metadata.json" <<EOF
{
  "id": "$DOSSIER_ID",
  "subject": "$SUBJECT",
  "type": "$TYPE",
  "created": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "updated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "active",
  "confidence": "low",
  "tags": [],
  "summary": "",
  "sources_count": 0,
  "related_dossiers": []
}
EOF

# Create report.md
cat > "$DOSSIER_PATH/report.md" <<EOF
# OSINT Report: $SUBJECT

**Date of Research:** $(date +%Y-%m-%d)
**Researcher:** oilcloth
**Subject:** $SUBJECT
**Type:** $TYPE
**Confidence:** LOW

---

## Executive Summary

[Brief overview of findings]

---

## Key Findings

### Finding 1: [Title]

**Confidence:** [Low/Medium/High]

**Sources:**
1. [URL] - accessed [date]

**Evidence:**
[What you found and why it matters]

---

## Gaps & Unverified Information

**What Remains Unclear:**

1. [Item]

---

## Methodology

**Search Queries Used:**
- [Query]

**Source Types:**
- [Type]

---

**Research completed:** $(date -u +%Y-%m-%dT%H:%M:%SZ)
**Methodology:** OSINT Cycle with Bellingcat-style verification
EOF

# Create sources.md
cat > "$DOSSIER_PATH/sources.md" <<EOF
# Sources - $SUBJECT

**Research Date:** $(date +%Y-%m-%d)
**Total Sources:** 0

---

## Sources

1. **[Source Name]**
   - [URL]
   - Accessed: $(date +%Y-%m-%d)

---

## Search Queries Used

1. \`"query"\`

**Research Method:** OSINT Cycle with Bellingcat-style three-source verification
EOF

echo "✅ Dossier created at: $DOSSIER_PATH"
echo ""
echo "Files created:"
echo "  - metadata.json"
echo "  - report.md"
echo "  - sources.md"
echo "  - media/ (directory)"
echo ""
echo "Next steps:"
echo "  1. Edit $DOSSIER_PATH/report.md"
echo "  2. Add sources to $DOSSIER_PATH/sources.md"
echo "  3. Update metadata.json when complete"
