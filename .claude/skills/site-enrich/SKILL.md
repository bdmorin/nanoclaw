---
name: site-enrich
description: Enrich MkDocs pages with photos, better formatting, and visual appeal. Improves readability and human impact. Triggers on "enrich", "improve page", "add photos", "make it pop".
---

# Site Enricher — The Deportation Machine

Make pages visually compelling and human-readable. The intelligence is oilcloth's — the presentation is ours.

## Key Paths

| What | Path |
|------|------|
| Site docs | `groups/main/site/docs/` |
| Custom CSS | `groups/main/site/docs/stylesheets/extra.css` |
| MkDocs config | `groups/main/site/mkdocs.yml` |
| Build script | `groups/main/site/build.sh` |

## What This Skill Does

When the user says "enrich" a page, "improve" a page, "add photos", or "make it pop":

1. Read the target page
2. Apply Material theme features for visual impact
3. Optionally find and add relevant images
4. Rebuild the site

## Available Material Features

### Admonitions

Use for callouts, warnings, key findings:

```markdown
!!! danger "CRITICAL FINDING"
    ME ruled this death a homicide.

!!! warning "Pattern Alert"
    Third death at this facility in 6 months.

!!! info "Timeline"
    Events reconstructed from public records.

!!! quote ""
    *Direct quotes from sources in italics.*

!!! success "Verified"
    Confirmed by 3 independent sources.
```

Collapsible version (use for long details):
```markdown
??? details "Full Source List"
    Source details here...
```

### Content Tabs

Use for organizing parallel information:

```markdown
=== "Official Account"
    DHS says...

=== "Witness Statements"
    Neighbors report...

=== "Physical Evidence"
    Autopsy findings...
```

### Status Badges

CSS classes available in `extra.css`:

```markdown
<span class="status-verified">VERIFIED</span>
<span class="status-pending">PENDING</span>
<span class="status-disputed">DISPUTED</span>
```

### Dossier Cards

```markdown
<div class="dossier-card" markdown>
**Key finding summary here**

Brief details...
</div>
```

### Typography

- `==highlighted text==` for key phrases
- `^^superscript^^` for annotations
- `~~strikethrough~~` for corrections

## Adding Images

When adding photos to pages:

1. **Search for relevant Creative Commons or public domain images** using WebSearch
2. **Verify license** — only CC0, CC-BY, CC-BY-SA, or public domain
3. **Download to** `groups/main/site/docs/assets/images/`
4. **Reference in markdown:** `![Alt text](../assets/images/filename.jpg)`
5. **Add attribution** if required by license

Image guidelines:
- Relevant to the subject matter (facilities, locations, protests, memorials)
- Respectful — no gratuitous imagery
- Compressed — reasonable file size for web
- Alt text is descriptive and meaningful

## Enrichment Patterns

### For Dossier Pages

- Add admonitions for critical findings, cause of death, pattern alerts
- Use content tabs for "Official Account" vs "Evidence" comparisons
- Add status badges for confidence levels
- Convert bullet lists into more readable formats where appropriate
- Add horizontal rules between major sections

### For Index Pages

- Ensure tables are complete and sorted by date
- Add section descriptions where missing
- Use dossier cards for featured/highlighted cases

### For Case Studies

- Use admonitions for threat assessments
- Content tabs for legal analysis sections
- Timeline formatting with clear date markers

## Procedure

1. Ask which page(s) to enrich (or accept from user's request)
2. Read the current page content
3. Identify enrichment opportunities
4. Apply changes — preserve all factual content, only enhance presentation
5. Rebuild: `bash groups/main/site/build.sh`
6. Report what was changed

## Rules

- **NEVER alter facts** — enrichment is presentation only
- **NEVER remove content** — only add formatting and visual elements
- **NEVER add editorial commentary** — oilcloth's words stand as written
- **ALWAYS preserve source citations** — these are evidence
- If adding CSS classes, add them to `extra.css` if they don't exist
