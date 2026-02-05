#!/bin/bash
# Analyze an existing dossier with fabric patterns
# Usage: ./analyze-dossier.sh <dossier-path>
#
# Runs appropriate patterns based on dossier type:
#   - All types: analyze_claims, extract_extraordinary_claims
#   - Person: analyze_personality, extract_predictions
#   - Organization: extract_insights, analyze_risk
#   - Incident: create_threat_scenarios

set -e

DOSSIER_PATH="$1"

if [ -z "$DOSSIER_PATH" ]; then
  echo "Usage: $0 <dossier-path>"
  echo "Example: $0 /workspace/group/osint/dossiers/2026-02-05_alex-pretti"
  exit 1
fi

if [ ! -d "$DOSSIER_PATH" ]; then
  echo "Error: Dossier not found at $DOSSIER_PATH"
  exit 1
fi

# Check for required files
if [ ! -f "$DOSSIER_PATH/report.md" ]; then
  echo "Error: No report.md found in dossier"
  exit 1
fi

if [ ! -f "$DOSSIER_PATH/metadata.json" ]; then
  echo "Error: No metadata.json found in dossier"
  exit 1
fi

# Create analysis directory
ANALYSIS_DIR="$DOSSIER_PATH/analysis"
mkdir -p "$ANALYSIS_DIR"

# Get dossier type from metadata
TYPE=$(cat "$DOSSIER_PATH/metadata.json" | grep -o '"type"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
SUBJECT=$(cat "$DOSSIER_PATH/metadata.json" | grep -o '"subject"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)

echo "=== Analyzing Dossier: $SUBJECT ==="
echo "Type: $TYPE"
echo "Output: $ANALYSIS_DIR"
echo ""

# Combine report and sources for analysis
CONTENT=$(cat "$DOSSIER_PATH/report.md")
if [ -f "$DOSSIER_PATH/sources.md" ]; then
  CONTENT="$CONTENT

---
SOURCES:
$(cat "$DOSSIER_PATH/sources.md")"
fi

# === UNIVERSAL ANALYSES ===

echo "[1/4] Analyzing claims..."
echo "$CONTENT" | fabric --pattern analyze_claims > "$ANALYSIS_DIR/claims_analysis.md" 2>/dev/null || echo "Claims analysis failed" > "$ANALYSIS_DIR/claims_analysis.md"

echo "[2/4] Checking for extraordinary claims..."
echo "$CONTENT" | fabric --pattern extract_extraordinary_claims > "$ANALYSIS_DIR/extraordinary_claims.md" 2>/dev/null || echo "No extraordinary claims found" > "$ANALYSIS_DIR/extraordinary_claims.md"

echo "[3/4] Extracting key insights..."
echo "$CONTENT" | fabric --pattern extract_insights > "$ANALYSIS_DIR/insights.md" 2>/dev/null || echo "Insights extraction failed" > "$ANALYSIS_DIR/insights.md"

# === TYPE-SPECIFIC ANALYSES ===

echo "[4/4] Running type-specific analysis ($TYPE)..."

case "$TYPE" in
  person)
    echo "$CONTENT" | fabric --pattern analyze_personality > "$ANALYSIS_DIR/personality.md" 2>/dev/null || echo "Personality analysis failed" > "$ANALYSIS_DIR/personality.md"
    echo "$CONTENT" | fabric --pattern extract_predictions > "$ANALYSIS_DIR/predictions.md" 2>/dev/null || echo "No predictions found" > "$ANALYSIS_DIR/predictions.md"
    ;;
  organization)
    echo "$CONTENT" | fabric --pattern analyze_risk > "$ANALYSIS_DIR/risk_analysis.md" 2>/dev/null || echo "Risk analysis failed" > "$ANALYSIS_DIR/risk_analysis.md"
    ;;
  incident)
    echo "$CONTENT" | fabric --pattern create_threat_scenarios > "$ANALYSIS_DIR/threat_scenarios.md" 2>/dev/null || echo "Threat analysis failed" > "$ANALYSIS_DIR/threat_scenarios.md"
    ;;
  *)
    echo "  (No type-specific analysis for '$TYPE')"
    ;;
esac

# === CREATE SUMMARY ===

cat > "$ANALYSIS_DIR/README.md" <<EOF
# Analysis Summary: $SUBJECT

**Generated:** $(date -u +%Y-%m-%dT%H:%M:%SZ)
**Type:** $TYPE

## Files

| File | Pattern | Description |
|------|---------|-------------|
| claims_analysis.md | analyze_claims | Verification of claims with evidence |
| extraordinary_claims.md | extract_extraordinary_claims | Flagged unverified/unusual claims |
| insights.md | extract_insights | Key insights extracted |
EOF

case "$TYPE" in
  person)
    cat >> "$ANALYSIS_DIR/README.md" <<EOF
| personality.md | analyze_personality | Psychological profile |
| predictions.md | extract_predictions | Predictions made by subject |
EOF
    ;;
  organization)
    cat >> "$ANALYSIS_DIR/README.md" <<EOF
| risk_analysis.md | analyze_risk | Risk assessment |
EOF
    ;;
  incident)
    cat >> "$ANALYSIS_DIR/README.md" <<EOF
| threat_scenarios.md | create_threat_scenarios | Potential threat scenarios |
EOF
    ;;
esac

cat >> "$ANALYSIS_DIR/README.md" <<EOF

## How to Use

Review each analysis file to:
1. **Verify claims** - Check claims_analysis.md for truthfulness ratings
2. **Flag concerns** - Check extraordinary_claims.md for items needing extra verification
3. **Update confidence** - Adjust dossier confidence based on analysis
4. **Add to report** - Incorporate relevant insights into main report

## Re-run Analysis

\`\`\`bash
./osint/scripts/analyze-dossier.sh "$DOSSIER_PATH"
\`\`\`
EOF

echo ""
echo "✅ Analysis complete!"
echo ""
echo "Files created in $ANALYSIS_DIR:"
ls -1 "$ANALYSIS_DIR"
echo ""
echo "Next: Review analysis files and update dossier confidence/report"
