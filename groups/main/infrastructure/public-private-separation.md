# Public/Private Research Separation Architecture

**Date:** 2026-02-10
**Status:** Active policy
**Purpose:** Keep personal security analysis, operational details, and emotional context OUT of published intelligence

---

## The Problem

Our dossiers contain two kinds of content:

1. **Public intelligence** — The research itself. Verifiable facts, source analysis, legal frameworks, pattern identification. This is what we publish. This is journalism.

2. **Private operational content** — Threat assessments for brahn specifically, OPSEC recommendations, personal security details, emotional reactions, references to specific tools/capabilities, family details. This is INTERNAL ONLY.

When these get mixed (like in the Kyle Wagner dossier), we can't publish without exposing the operator.

---

## The Rule

**Every dossier gets TWO files:**

| File | Contents | Publishable? |
|------|----------|-------------|
| `report-findings.md` | Full internal research including personal threat assessments, OPSEC notes, operator-specific analysis | **NO — NEVER PUBLISH** |
| `report-public.md` | Scrubbed version — facts, analysis, sources, general activist guidance only | **YES — publish freely** |

The publishing pipeline (sync.sh, publisher agent, GitLab, GitHub Pages) should **ONLY** sync `report-public.md` files.

---

## What Gets Scrubbed

### ALWAYS REMOVE from public versions:

| Category | Examples | Why |
|----------|----------|-----|
| **Operator identity** | "brahn", real name, any identifying details | Exposes the operator |
| **Family members** | Andrea, Ashlynn, Griffin, any family names | Targets family |
| **Tools/capabilities** | Hak5, SIGINT equipment, specific devices | Evidence of capabilities |
| **Operational methods** | How we track agents, specific SIGINT techniques | Reveals TTP |
| **Infrastructure** | nanoclaw, homelab details, server names, hexxa.dev | Reveals infrastructure |
| **AI identity details** | oilcloth@posteo.us (in operational context), specific integration details | Reveals architecture |
| **Personal threat assessments** | "This is your future", risk comparisons to operator | Connects research to specific person |
| **OPSEC recommendations** | Specific advice to operator about behavior changes | Reveals current vulnerabilities |
| **Emotional content** | Our reactions, fears, personal notes | Not intelligence |
| **Location specifics** | Home address, regular locations, protest attendance details | Reveals patterns of life |

### KEEP in public versions:

| Category | Examples | Why |
|----------|----------|-----|
| **Verified facts** | Dates, charges, legal proceedings, official statements | This is the intelligence |
| **Source analysis** | Verification matrices, confidence levels, source reliability | This is methodology |
| **Legal framework** | First Amendment analysis, statute interpretation, precedent | This is public interest |
| **Pattern analysis** | Targeting patterns, charging strategies, escalation timeline | This helps everyone |
| **General activist guidance** | OPSEC lessons (generic), legal rights, what to expect | This protects the movement |
| **Historical context** | COINTELPRO, Red Scares, speech criminalization pattern | This is education |

---

## File Naming Convention

```
dossier/
├── report-findings.md      # INTERNAL — full research with personal analysis
├── report-public.md        # PUBLIC — scrubbed for publication
├── sources.md              # PUBLIC (usually safe, review before publishing)
├── metadata.json           # INTERNAL (may contain operational tags)
├── metadata-public.json    # PUBLIC (scrubbed version if needed)
└── analysis/               # INTERNAL (threat assessments, OPSEC notes)
```

---

## Publishing Pipeline Rules

### sync.sh / Publisher Agent

The sync script and publisher agent must follow these rules:

1. **ONLY copy `report-public.md`** to publishing repos (GitLab, GitHub, Codeberg)
2. **NEVER copy `report-findings.md`** to any public-facing repo
3. **NEVER copy files from `analysis/` subdirectories**
4. **Review `sources.md`** before publishing — usually safe, but check for internal references
5. **NEVER copy `metadata.json`** if it contains operational tags — create `metadata-public.json` if needed
6. **Strip any path references** that reveal internal directory structure

### .gitignore for publishing repos

```
# Never publish internal research
report-findings.md
analysis/
metadata.json
*.internal.md
```

### Pre-publish checklist

Before any dossier goes public, grep for:

```bash
# Run this against report-public.md before publishing
grep -i -E "brahn|andrea|ashlynn|griffin|hak5|sigint|homelab|nanoclaw|hexxa|posteo|oilcloth@|pepper ball.*took|my (mask|shirt|megaphone)" report-public.md
```

If ANYTHING matches, the file is not clean. Fix it.

---

## Existing Dossiers — Audit Status

| Dossier | Has public version? | Needs scrub? |
|---------|-------------------|-------------|
| Kyle Wagner | ✅ `report-public.md` created | Done |
| Alex Pretti | ❓ Check | Likely yes |
| Renée Good | ❓ Check | Likely yes |
| All 2025 death dossiers | ❓ Check | Probably clean (pre-date operator analysis) |
| All 2026 violence dossiers | ❓ Check | Likely need review |

**Action:** Audit all dossiers before next publish cycle. Create `report-public.md` for any that contain personal content.

---

## The Events Directory

**`/workspace/group/events/`** — NEVER PUBLISH. This is brahn's personal protest log. Contains:
- Which protests attended
- Physical engagements (pepper balls, clashes)
- Contacts made
- OPSEC observations

This directory must NEVER appear in any publishing repo.

---

## The Investigations Directory

**`/workspace/group/osint/investigations/`** — MIXED.
- Investigation facts and monitoring protocols → can be published
- Personal notes, theories tagged UNPROVEN → review before publishing
- References to operator or personal context → scrub

**Rule:** Create `INDEX-public.md` if the investigation index references personal operations.

---

## Conversations Directory

**`/workspace/group/conversations/`** — NEVER PUBLISH. Session transcripts contain everything.

---

## Summary

```
INTERNAL ONLY (never publish):
├── events/                  # Personal protest log
├── conversations/           # Session transcripts
├── infrastructure/          # Server specs, deployment details
├── brahn-context.md         # Operator profile
├── oilcloth-context.md      # Agent profile (operational details)
├── */report-findings.md     # Full internal research
├── */analysis/              # Threat assessments
└── */metadata.json          # If contains operational tags

PUBLISHABLE (after review):
├── */report-public.md       # Scrubbed research
├── */sources.md             # Usually safe
├── alerts/                  # Generally safe
├── sweeps/                  # Generally safe
├── reports/                 # Generally safe
├── skills/                  # Methodology (safe)
└── RESEARCH-QUEUE.md        # Review — may reference personal operations
```

---

## Enforcement

This isn't optional. One leaked reference to operator identity, capabilities, or family in a published dossier could:

1. Connect published intelligence to a specific person
2. Provide evidence of "sophisticated surveillance capabilities"
3. Endanger family members
4. Provide prosecution with a roadmap of the operation

**Every publish action gets a grep check. No exceptions.**

---

*Policy established by oilcloth. 2026-02-10.*
*"The government counts on us making mistakes. We don't make that one."*
