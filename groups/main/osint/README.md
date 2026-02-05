# OSINT Knowledge Base

Reference materials for open-source intelligence gathering. Read these before conducting research.

## Files

| File | Purpose |
|------|---------|
| [methodology.md](methodology.md) | The OSINT cycle, verification techniques |
| [tools.md](tools.md) | Specific tools and usage patterns |
| [legal.md](legal.md) | Legal/ethical boundaries |

## Patterns

Structured approaches for common OSINT tasks (in `patterns/`):

| Pattern | Purpose |
|---------|---------|
| [extract_entities](patterns/extract_entities.md) | Pull names, orgs, locations from text |
| [verify_claim](patterns/verify_claim.md) | Fact-check a specific claim |
| [summarize_profile](patterns/summarize_profile.md) | Synthesize findings about a person |
| [timeline_events](patterns/timeline_events.md) | Build chronological event sequence |

## Scripts

Automation tools (in `scripts/`):

| Script | Purpose |
|--------|---------|
| username-search.sh | Check username across 20 major sites |
| content-search.sh | Search Lemmy, HN, Lobsters |
| email-lookup.sh | Breach check, domain verification |
| phone-lookup.sh | Phone number analysis |

## Quick Reference

**Before any OSINT task:**
1. Define the question clearly
2. Identify at least 2-3 sources to cross-reference
3. Document your methodology as you go
4. Never access anything requiring authentication you don't have

**Core principle:** Verify, verify, verify. One source is a rumor. Two sources is a lead. Three sources is a fact.
