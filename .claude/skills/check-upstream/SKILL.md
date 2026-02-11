---
name: check-upstream
description: Check upstream nanoclaw repo for changes, assess impact, and recommend upgrades
triggers:
  - check upstream
  - upstream changes
  - nanoclaw updates
  - check for updates
---

# Check Upstream NanoClaw Changes

Compare local nanoclaw against upstream gavrielc/nanoclaw and produce an upgrade assessment.

## Steps

### 1. Fetch and Compare

```bash
cd /home/bdmorin/nanoclaw
git fetch origin 2>&1
```

Find the divergence point:
```bash
git merge-base HEAD origin/main
```

### 2. Enumerate Changes

List commits since divergence:
```bash
MERGE_BASE=$(git merge-base HEAD origin/main)
git log --format="%h %ai %s" ${MERGE_BASE}..origin/main --reverse
```

Get diff stats:
```bash
git diff --stat ${MERGE_BASE}..origin/main
```

Count new vs changed files:
```bash
git diff --diff-filter=A --name-only ${MERGE_BASE}..origin/main   # New files
git diff --diff-filter=M --name-only ${MERGE_BASE}..origin/main   # Modified files
```

### 3. Identify Conflicts

Check which upstream-changed files we've also modified locally:
```bash
# Files we changed locally (tracked, modified)
git diff --name-only HEAD

# Compare against upstream changes
git diff --name-only ${MERGE_BASE}..origin/main
```

Any file appearing in BOTH lists is a potential merge conflict. Read the upstream diff for those files carefully.

### 4. Assess Impact

For each significant change, classify:

| Category | Description |
|----------|-------------|
| **Architecture** | New systems, major refactors, data model changes |
| **Capabilities** | New features agents can use, new skills, new tools |
| **Reliability** | Bug fixes, error handling, race conditions |
| **Quality of Life** | Logging, debugging, developer experience |
| **Breaking** | Changes that require local code adaptation |

### 5. Check Development Tempo

```bash
git log origin/main --format="%ad" --date=format:"%Y-%m-%d" | sort | uniq -c | sort -rn | head -10
```

Assess: Is the project accelerating, steady, or decelerating? Are there active feature branches?

```bash
git branch -r | grep -v HEAD
```

### 6. Produce Report

Output a structured assessment:

```
## Upstream Report - [date]

**Commits behind:** N
**Files changed:** N
**Merge complexity:** LOW / MODERATE / HIGH
**Recommendation:** UPGRADE NOW / WAIT / SKIP

### Changes by Impact
[table of changes with impact ratings]

### Conflict Zones
[files we've both modified, with notes on resolution approach]

### Development Tempo
[commits/week trend, active branches, trajectory assessment]

### Upgrade Plan
[if recommending upgrade: step-by-step merge plan]
```

### 7. Update Memory

After producing the report, update `/home/bdmorin/.claude/projects/-home-bdmorin-nanoclaw/memory/MEMORY.md` with:
- Date of last upstream check
- Current divergence (commits behind)
- Notable upcoming features

## Notes

- Our local changes are in: `container-runner.ts` (Slack webhook, SDK logging), `index.ts` (Discord, dashboard), `ipc-mcp.ts` (Slack tool), `config.ts` (timeout), `dashboard.ts` (new file)
- Origin is gavrielc/nanoclaw - we have no push access
- Always assess merge complexity honestly - some upstream changes may conflict with our Discord/Docker adaptations
- When in doubt, recommend waiting for a natural break point in upstream development
