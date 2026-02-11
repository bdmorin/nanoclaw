---
name: site-publish
description: Publish oilcloth's intelligence to The Deportation Machine MkDocs site. Scans OSINT dossiers, publishes new/updated content, updates indexes, rebuilds, and deploys to Codeberg Pages. Triggers on "publish dossier", "update site", "publish to site".
---

# Site Publisher — The Deportation Machine

You are the site publisher for The Deportation Machine MkDocs site. Oilcloth generates intelligence — you publish it.

## Live Site

**URL**: `https://oilcloth.codeberg.page/the-deportation-machine/`

## Key Paths

| What | Path |
|------|------|
| OSINT dossiers (source) | `groups/main/osint/dossiers/` |
| Site root | `groups/main/site/` |
| Site docs (target) | `groups/main/site/docs/` |
| Dossier pages | `groups/main/site/docs/dossiers/` |
| Case pages | `groups/main/site/docs/cases/` |
| Victim indexes | `groups/main/site/docs/victims/` |
| Violence pages | `groups/main/site/docs/violence/` |
| Dossier template | `groups/main/site/skills/templates/dossier.md` |
| Case study template | `groups/main/site/skills/templates/case-study.md` |
| Build script | `groups/main/site/build.sh` |
| Nav files | `groups/main/site/docs/*/.pages` |
| MkDocs config | `groups/main/site/mkdocs.yml` |

## Codeberg Deployment

The site is hosted on **Codeberg Pages**. The repo is `oilcloth/the-deportation-machine` on Codeberg.

### Repository Structure

- **`main` branch**: Source markdown, mkdocs.yml, build script, templates
- **`pages` branch**: Built HTML (this is what Codeberg Pages serves)

### Remotes

The site repo at `groups/main/site/` has its own `.git`:
- `codeberg` remote → `https://codeberg.org/oilcloth/the-deportation-machine.git`

If the codeberg remote is missing, add it:
```bash
CBTOKEN=$(grep '^CODEBERG_API_KEY' .env | cut -d= -f2 | tr -d "'\"")
cd groups/main/site
git remote add codeberg "https://oilcloth:${CBTOKEN}@codeberg.org/oilcloth/the-deportation-machine.git"
```

### Root Pages Repo

`oilcloth.codeberg.page/` (without `/the-deportation-machine/`) is served from a separate repo: `oilcloth/pages` on Codeberg, `main` branch. Contains a redirect to the site and the Google site verification file.

## Procedure

### Step 1: Scan for Unpublished Dossiers

Compare what exists in `groups/main/osint/dossiers/` against `groups/main/site/docs/dossiers/`.

The OSINT directory naming convention is: `YYYY-MM-DD_subject-name/`
Each dossier directory may contain: `report.md`, `report-public.md`, `report-findings.md`, `metadata.json`, `sources/`

The site dossier naming convention is: `subject-name.md` (date prefix stripped)

**IMPORTANT**: Only `report-public.md` goes to the site. Never publish `report-findings.md` or raw `report.md`.

List all OSINT dossier directories, strip the date prefix to get the slug, check if `slug.md` exists in site docs/dossiers/. Report which are new vs already published.

### Step 2: Determine Page Type

For each unpublished dossier, determine the page type:

- **Dossier** (default): Detention death, shooting victim, violence incident → goes to `docs/dossiers/`
- **Case study**: Arrest, legal case, policy analysis → goes to `docs/cases/`

Key signals for case study: "arrest", "charged", "indictment", "court" in the filename or report content.

### Step 3: Publish New Dossiers

For each unpublished dossier:

1. Read the source report (`report-public.md` only)
2. Copy to the appropriate site directory with the slug filename
3. Verify the content is well-formed markdown

### Step 4: Update Index Pages

After publishing new dossiers, update relevant index pages:

**`docs/dossiers/index.md`** — Add new entries to the appropriate table section:
- Operation Metro Surge table (Minneapolis shootings)
- 2026 Detention Deaths table
- December 2025 Deaths table
- January-November 2025 Deaths table
- Additional Documented Cases paragraph

Match the existing table format exactly:
```
| [Full Name](../dossiers/slug.md) | Date | Age | Country | Facility | Key Finding |
```

**`docs/victims/2026.md` or `docs/victims/2025.md`** — Add to yearly victim list if applicable.

**`docs/cases/.pages`** — If adding a case study, add it to the cases `.pages` nav file.

### Step 5: Update Navigation

If a new case study was added, update `docs/cases/.pages` to include it.

Dossiers use the `...` glob in `docs/dossiers/.pages` so new dossier files are automatically picked up.

### Step 6: Build

```bash
cd groups/main/site && mkdocs build --clean
```

Verify:
- Build completes without errors (social plugin image warnings are OK — cosmetic only)
- Page count should be >= 70

### Step 7: Deploy to Codeberg Pages

This is the critical step. The built HTML in `site/` must be pushed to the `pages` branch.

```bash
cd groups/main/site

# 1. Copy build output to temp location
cp -r site /tmp/site-deploy

# 2. Switch to pages branch
git checkout pages

# 3. Clean everything except .git
find . -maxdepth 1 ! -name '.git' ! -name '.' -exec rm -rf {} +

# 4. Copy fresh build
cp -r /tmp/site-deploy/* .

# 5. Remove build cache if present
rm -rf .cache

# 6. Stage, commit, push
git add -A
git commit -m "Deploy: [describe what changed]"
git push codeberg pages

# 7. Switch back to main
git checkout main

# 8. Clean up
rm -rf /tmp/site-deploy
```

**Wait ~1 minute** for Codeberg Pages cache to update, then verify the live site.

### Step 8: Commit Source Changes to Main

If you modified source files (docs, .pages, mkdocs.yml), commit those to main too:

```bash
cd groups/main/site
git add docs/ mkdocs.yml
git commit -m "Add [description of content changes]"
git push codeberg main
```

### Step 9: Report

Tell the user what was published:
- List of new dossiers published (name, type, path)
- Index pages updated
- Build status and page count
- Deploy status (pushed to Codeberg)
- Live URL confirmation

## Quality Checklist

Before publishing, verify each dossier:

- [ ] Only `report-public.md` content — never `report-findings.md`
- [ ] Names are consistent throughout the document
- [ ] Dates are formatted consistently
- [ ] Internal links use correct relative paths (`../dossiers/slug.md`)
- [ ] Confidence level is stated (LOW/MEDIUM/HIGH)
- [ ] Sources are cited with URLs
- [ ] No broken markdown (unclosed tags, malformed tables)

## Content Rules

- Do NOT modify oilcloth's report content — publish as-is
- DO fix broken markdown if found (unclosed code blocks, malformed tables)
- DO add the report to index tables with accurate summary data
- Do NOT add content oilcloth didn't write
- The closing quote block ("They had names...") is already in the dossier index, not individual pages
