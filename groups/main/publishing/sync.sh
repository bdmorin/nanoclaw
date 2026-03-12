#!/bin/bash
# Publishing Sync Script
# Assembles intelligence content into the Codeberg publishing repo
#
# Usage:
#   bash sync.sh                    # Sync content to codeberg repo
#   bash sync.sh --push             # Sync and push to codeberg
#
# Codeberg is our only publishing target (authorized 2026-02-11).
# GitHub rejected the repo. GitLab is unnecessary. Codeberg is home.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTENT_DIR="$SCRIPT_DIR/content"
# Support both container (/workspace/group/osint) and host paths
OSINT_DIR="${OSINT_DIR:-/Users/bdmorin/cowork/nanoclaw/groups/main/osint}"
EVENTS_DIR="${EVENTS_DIR:-${OSINT_DIR}/events}"

PUSH=false

# Parse args
for arg in "$@"; do
    case $arg in
        --push) PUSH=true ;;
    esac
done

echo "=== Publishing Sync (Codeberg) ==="
echo ""

sync_content() {
    local REPO_DIR="$1"

    echo "[*] Syncing content to codeberg..."

    # Create directory structure
    mkdir -p "$REPO_DIR"/{dossiers,geographic-sweep/reports,events,camps,flights,methodology,reports}

    # Copy shared content
    cp "$CONTENT_DIR/README.md" "$REPO_DIR/"
    cp "$CONTENT_DIR/LICENSE" "$REPO_DIR/"
    cp "$CONTENT_DIR/CONTRIBUTING.md" "$REPO_DIR/"

    # Copy methodology from OSINT knowledge base
    cp "$OSINT_DIR/methodology.md" "$REPO_DIR/methodology/osint-framework.md" 2>/dev/null || true
    cp "$OSINT_DIR/legal.md" "$REPO_DIR/methodology/legal-ethical.md" 2>/dev/null || true
    cp "$OSINT_DIR/tools.md" "$REPO_DIR/methodology/tools.md" 2>/dev/null || true

    # Copy dossiers — PUBLIC VERSIONS ONLY per public-private separation policy
    # See /workspace/group/infrastructure/public-private-separation.md
    DOSSIER_COUNT=0
    SKIPPED_COUNT=0
    for dir in "$OSINT_DIR"/dossiers/20*; do
        if [ -d "$dir" ]; then
            name=$(basename "$dir")
            mkdir -p "$REPO_DIR/dossiers/$name"

            # ONLY copy report-public.md (the scrubbed publishable version)
            # NEVER copy report-findings.md or report.md (internal research)
            if [ -f "$dir/report-public.md" ]; then
                cp "$dir/report-public.md" "$REPO_DIR/dossiers/$name/"
                DOSSIER_COUNT=$((DOSSIER_COUNT + 1))

                # Copy i18n translated versions (report-public.{lang}.md)
                for lang_file in "$dir"/report-public.*.md; do
                    if [ -f "$lang_file" ] && [ "$lang_file" != "$dir/report-public.md" ]; then
                        cp "$lang_file" "$REPO_DIR/dossiers/$name/"
                    fi
                done
            else
                SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
            fi

            # Copy sources (usually safe, but review first)
            [ -f "$dir/sources.md" ] && cp "$dir/sources.md" "$REPO_DIR/dossiers/$name/"

            # Copy event reports and org profiles (public content)
            [ -f "$dir/event-report.md" ] && cp "$dir/event-report.md" "$REPO_DIR/dossiers/$name/"
            [ -f "$dir/symbolism-analysis.md" ] && cp "$dir/symbolism-analysis.md" "$REPO_DIR/dossiers/$name/"
            [ -d "$dir/organization-profiles" ] && cp -r "$dir/organization-profiles" "$REPO_DIR/dossiers/$name/"

            # NEVER copy analysis/ subdirectories (internal threat assessments)
            # NEVER copy metadata.json (may contain operational tags)
        fi
    done
    echo "[+] Synced $DOSSIER_COUNT dossiers ($SKIPPED_COUNT skipped — no public version)"

    # Copy dossier index files (+ translations)
    [ -f "$OSINT_DIR/dossiers/VICTIMS-TRACKING.md" ] && cp "$OSINT_DIR/dossiers/VICTIMS-TRACKING.md" "$REPO_DIR/dossiers/"
    [ -f "$OSINT_DIR/dossiers/DECEMBER-2025-ANALYSIS.md" ] && cp "$OSINT_DIR/dossiers/DECEMBER-2025-ANALYSIS.md" "$REPO_DIR/dossiers/"
    [ -f "$OSINT_DIR/dossiers/index.md" ] && cp "$OSINT_DIR/dossiers/index.md" "$REPO_DIR/dossiers/"
    # Copy translated index files
    for lang_idx in "$OSINT_DIR"/dossiers/index.*.md; do
        [ -f "$lang_idx" ] && cp "$lang_idx" "$REPO_DIR/dossiers/"
    done

    # Copy geographic sweep reports
    SWEEP_COUNT=0
    for report in "$OSINT_DIR"/reports/geographic/*.md; do
        if [ -f "$report" ]; then
            cp "$report" "$REPO_DIR/geographic-sweep/reports/"
            SWEEP_COUNT=$((SWEEP_COUNT + 1))
        fi
    done
    echo "[+] Synced $SWEEP_COUNT geographic sweep reports"

    # Copy pattern/analytical reports (top-level .md files in reports/) + translations
    REPORT_COUNT=0
    for report in "$OSINT_DIR"/reports/*.md; do
        if [ -f "$report" ]; then
            cp "$report" "$REPO_DIR/reports/"
            REPORT_COUNT=$((REPORT_COUNT + 1))
        fi
    done
    [ $REPORT_COUNT -gt 0 ] && echo "[+] Synced $REPORT_COUNT analytical reports (including translations)"

    # Copy event intelligence
    [ -f "$EVENTS_DIR/EVENT-INDEX.md" ] && cp "$EVENTS_DIR/EVENT-INDEX.md" "$REPO_DIR/events/"

    # Copy camp data
    for camp in "$OSINT_DIR"/camps/*.md; do
        [ -f "$camp" ] && cp "$camp" "$REPO_DIR/camps/"
    done

    # Copy policy trackers
    POLICY_COUNT=0
    if [ -d "$OSINT_DIR/policy" ]; then
        mkdir -p "$REPO_DIR/policy"
        for policy in "$OSINT_DIR"/policy/*.md; do
            [ -f "$policy" ] && cp "$policy" "$REPO_DIR/policy/" && POLICY_COUNT=$((POLICY_COUNT + 1))
        done
        [ $POLICY_COUNT -gt 0 ] && echo "[+] Synced $POLICY_COUNT policy trackers"
    fi

    # Copy public profiles (NOT osint/personal/ — that's internal only)
    PROFILE_COUNT=0
    if [ -d "$OSINT_DIR/profiles" ]; then
        mkdir -p "$REPO_DIR/profiles"
        for profile in "$OSINT_DIR"/profiles/*.md; do
            [ -f "$profile" ] && cp "$profile" "$REPO_DIR/profiles/" && PROFILE_COUNT=$((PROFILE_COUNT + 1))
        done
        [ $PROFILE_COUNT -gt 0 ] && echo "[+] Synced $PROFILE_COUNT profiles"
    fi

    # Copy daily briefs
    BRIEF_COUNT=0
    if [ -d "$OSINT_DIR/daily-briefs" ]; then
        mkdir -p "$REPO_DIR/daily-briefs"
        for brief in "$OSINT_DIR"/daily-briefs/*.md; do
            [ -f "$brief" ] && cp "$brief" "$REPO_DIR/daily-briefs/" && BRIEF_COUNT=$((BRIEF_COUNT + 1))
        done
        [ $BRIEF_COUNT -gt 0 ] && echo "[+] Synced $BRIEF_COUNT daily briefs"
    fi

    # Copy service-specific files (codeberg overrides)
    local SERVICE_DIR="$SCRIPT_DIR/codeberg"
    if [ -d "$SERVICE_DIR" ]; then
        cp -r "$SERVICE_DIR"/. "$REPO_DIR/" 2>/dev/null || true
        echo "[+] Applied codeberg-specific config"
    fi

    echo "[+] Codeberg repo ready at $REPO_DIR"
}

push_repo() {
    local REPO_DIR="$1"

    if [ ! -d "$REPO_DIR/.git" ]; then
        echo "[!] No git repo at $REPO_DIR — skipping push"
        return
    fi

    cd "$REPO_DIR"
    git add -A
    if git diff --cached --quiet; then
        echo "[=] No changes to push"
    else
        git commit -m "Intelligence update $(date -u +%Y-%m-%dT%H:%M:%SZ)

Automated sync from oilcloth intelligence system.
"
        git push
        echo "[+] Pushed to Codeberg"
    fi
    cd "$SCRIPT_DIR"
}

CODEBERG_REPO="$SCRIPT_DIR/repos/codeberg"

sync_content "$CODEBERG_REPO"
[ "$PUSH" = true ] && push_repo "$CODEBERG_REPO"

echo ""
echo "=== Sync Complete ==="
