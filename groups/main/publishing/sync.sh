#!/bin/bash
# Publishing Sync Script
# Assembles intelligence content into push-ready repos for GitHub/GitLab/Codeberg
#
# Usage:
#   bash sync.sh                    # Sync content to all repos
#   bash sync.sh --target github    # Sync to specific target
#   bash sync.sh --push             # Sync and push to all remotes
#   bash sync.sh --push --target github  # Sync and push to specific target

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTENT_DIR="$SCRIPT_DIR/content"
OSINT_DIR="/workspace/group/osint"
EVENTS_DIR="/workspace/group/osint/events"

TARGET="${2:-all}"  # github, gitlab, codeberg, or all
PUSH=false

# Parse args
for arg in "$@"; do
    case $arg in
        --push) PUSH=true ;;
        --target) ;; # value handled by $2
    esac
done

echo "=== Publishing Sync ==="
echo "Target: $TARGET"
echo ""

sync_content() {
    local REPO_DIR="$1"
    local SERVICE="$2"

    echo "[*] Syncing content to $SERVICE..."

    # Create directory structure
    mkdir -p "$REPO_DIR"/{dossiers,geographic-sweep/reports,events,camps,flights,methodology}

    # Copy shared content
    cp "$CONTENT_DIR/README.md" "$REPO_DIR/"
    cp "$CONTENT_DIR/LICENSE" "$REPO_DIR/"
    cp "$CONTENT_DIR/CONTRIBUTING.md" "$REPO_DIR/"

    # Copy methodology from OSINT knowledge base
    cp "$OSINT_DIR/methodology.md" "$REPO_DIR/methodology/osint-framework.md" 2>/dev/null || true
    cp "$OSINT_DIR/legal.md" "$REPO_DIR/methodology/legal-ethical.md" 2>/dev/null || true
    cp "$OSINT_DIR/tools.md" "$REPO_DIR/methodology/tools.md" 2>/dev/null || true

    # Copy dossiers (reports only — not internal metadata)
    DOSSIER_COUNT=0
    for dir in "$OSINT_DIR"/dossiers/20*; do
        if [ -d "$dir" ]; then
            name=$(basename "$dir")
            mkdir -p "$REPO_DIR/dossiers/$name"

            # Copy report (prefer report.md, fall back to report-findings.md)
            if [ -f "$dir/report.md" ]; then
                cp "$dir/report.md" "$REPO_DIR/dossiers/$name/"
                DOSSIER_COUNT=$((DOSSIER_COUNT + 1))
            elif [ -f "$dir/report-findings.md" ]; then
                cp "$dir/report-findings.md" "$REPO_DIR/dossiers/$name/"
                DOSSIER_COUNT=$((DOSSIER_COUNT + 1))
            fi

            # Copy sources
            [ -f "$dir/sources.md" ] && cp "$dir/sources.md" "$REPO_DIR/dossiers/$name/"

            # Copy event reports and org profiles
            [ -f "$dir/event-report.md" ] && cp "$dir/event-report.md" "$REPO_DIR/dossiers/$name/"
            [ -f "$dir/symbolism-analysis.md" ] && cp "$dir/symbolism-analysis.md" "$REPO_DIR/dossiers/$name/"
            [ -d "$dir/organization-profiles" ] && cp -r "$dir/organization-profiles" "$REPO_DIR/dossiers/$name/"

            # Copy analysis subdirectories
            [ -d "$dir/analysis" ] && cp -r "$dir/analysis" "$REPO_DIR/dossiers/$name/"
        fi
    done
    echo "[+] Synced $DOSSIER_COUNT dossiers"

    # Copy dossier index files
    [ -f "$OSINT_DIR/dossiers/VICTIMS-TRACKING.md" ] && cp "$OSINT_DIR/dossiers/VICTIMS-TRACKING.md" "$REPO_DIR/dossiers/"
    [ -f "$OSINT_DIR/dossiers/DECEMBER-2025-ANALYSIS.md" ] && cp "$OSINT_DIR/dossiers/DECEMBER-2025-ANALYSIS.md" "$REPO_DIR/dossiers/"
    [ -f "$OSINT_DIR/dossiers/index.md" ] && cp "$OSINT_DIR/dossiers/index.md" "$REPO_DIR/dossiers/"

    # Copy geographic sweep reports
    SWEEP_COUNT=0
    for report in "$OSINT_DIR"/reports/geographic/*.md; do
        if [ -f "$report" ]; then
            cp "$report" "$REPO_DIR/geographic-sweep/reports/"
            SWEEP_COUNT=$((SWEEP_COUNT + 1))
        fi
    done
    echo "[+] Synced $SWEEP_COUNT geographic sweep reports"

    # Copy event intelligence
    [ -f "$EVENTS_DIR/EVENT-INDEX.md" ] && cp "$EVENTS_DIR/EVENT-INDEX.md" "$REPO_DIR/events/"

    # Copy camp data (when it exists)
    for camp in "$OSINT_DIR"/camps/*.md; do
        [ -f "$camp" ] && cp "$camp" "$REPO_DIR/camps/"
    done

    # Copy service-specific files
    local SERVICE_DIR="$SCRIPT_DIR/$SERVICE"
    if [ -d "$SERVICE_DIR" ]; then
        cp -r "$SERVICE_DIR"/. "$REPO_DIR/" 2>/dev/null || true
        echo "[+] Applied $SERVICE-specific config"
    fi

    echo "[+] $SERVICE repo ready at $REPO_DIR"
}

push_repo() {
    local REPO_DIR="$1"
    local SERVICE="$2"

    if [ ! -d "$REPO_DIR/.git" ]; then
        echo "[!] No git repo at $REPO_DIR — skipping push"
        return
    fi

    cd "$REPO_DIR"
    git add -A
    if git diff --cached --quiet; then
        echo "[=] No changes to push for $SERVICE"
    else
        git commit -m "Intelligence update $(date -u +%Y-%m-%dT%H:%M:%SZ)

Automated sync from oilcloth intelligence system.
"
        git push
        echo "[+] Pushed to $SERVICE"
    fi
    cd "$SCRIPT_DIR"
}

# Build targets — repos live directly inside each service dir
GITHUB_REPO="$SCRIPT_DIR/repos/github"
GITLAB_REPO="$SCRIPT_DIR/repos/gitlab"
CODEBERG_REPO="$SCRIPT_DIR/repos/codeberg"

if [ "$TARGET" = "all" ] || [ "$TARGET" = "github" ]; then
    sync_content "$GITHUB_REPO" "github"
    [ "$PUSH" = true ] && push_repo "$GITHUB_REPO" "github"
fi

if [ "$TARGET" = "all" ] || [ "$TARGET" = "gitlab" ]; then
    sync_content "$GITLAB_REPO" "gitlab"
    [ "$PUSH" = true ] && push_repo "$GITLAB_REPO" "gitlab"
fi

if [ "$TARGET" = "all" ] || [ "$TARGET" = "codeberg" ]; then
    sync_content "$CODEBERG_REPO" "codeberg"
    [ "$PUSH" = true ] && push_repo "$CODEBERG_REPO" "codeberg"
fi

echo ""
echo "=== Sync Complete ==="
