# OSINT Capability Planning for oilcloth

## Philosophy

> "Tools are important, but we shouldn't overlook the value of creativity and critical thinking." — Rae Baker

> "AI doesn't have a capabilities problem—it has an integration problem." — Daniel Miessler (Fabric)

The Bellingcat approach: **Verify, verify, verify.** Cross-reference everything. False positives are the enemy. Document your methodology so others can reproduce it.

---

## Intelligence Requirements

### Priority Targets (per user)
1. **Username enumeration** - Find accounts across platforms
2. **Content aggregation** - Lemmy, Digg, niche platforms
3. **Phone/email lookup** - Public records, carrier info, breach data
4. *(Lower priority)* Image search - Reverse lookup, EXIF, geolocation

---

## Tool Arsenal (Extracted from Rae Baker)

| Tool | Purpose | Integration Method |
|------|---------|-------------------|
| **Google Dorks** | Precision searching with operators | WebSearch with crafted queries |
| **WhatsMyName.app** | Username enumeration across 500+ sites | WebFetch API or scrape |
| **Epieos** | Email → associated accounts, breaches | WebFetch |
| **Shodan/Censys** | Infrastructure reconnaissance | API (needs keys) |
| **Wayback Machine** | Historical snapshots, deleted content | WebFetch archive.org API |
| **HaveIBeenPwned** | Breach checking | API (rate limited) |
| **OpenCorporates** | Business/corporate intelligence | WebFetch or API |
| **Whoxy** | Domain WHOIS history | WebFetch |

### Additional Resources to Evaluate
- **Holehe** - Check email registration across sites
- **Maigret** - Username search (Python tool)
- **theHarvester** - Email/subdomain enumeration
- **Maltego** - Visual link analysis (heavy, maybe overkill)
- **SpiderFoot** - Automated OSINT collection

---

## Fabric Integration Strategy

Fabric's power is **Patterns** — reusable prompts for specific tasks. We should create OSINT-specific patterns:

### Proposed Patterns for oilcloth

```
/extract_entities     - Pull names, orgs, locations, handles from text
/summarize_profile    - Synthesize findings about a person/entity
/verify_claim         - Cross-reference a claim against sources
/timeline_events      - Extract and order events chronologically
/analyze_connections  - Map relationships between entities
/assess_credibility   - Evaluate source reliability
```

### Integration Options

1. **Install Fabric in container** - oilcloth calls `fabric` CLI directly
2. **Port patterns to CLAUDE.md** - Embed the prompt patterns as instructions
3. **Hybrid** - Use Fabric for heavy processing, native for quick tasks

---

## Methodology Framework (Bellingcat-style)

### The OSINT Cycle

```
1. DEFINE      → What are we looking for? What's the question?
2. COLLECT     → Gather raw data from multiple sources
3. PROCESS     → Clean, normalize, structure the data
4. ANALYZE     → Find patterns, connections, anomalies
5. VERIFY      → Cross-reference, check provenance, eliminate false positives
6. DOCUMENT    → Record methodology, sources, confidence levels
7. REPORT      → Present findings with evidence chain
```

### Bazzell's Principles
- **Compartmentalization** - Separate research identities from personal
- **Documentation** - Screenshot everything, archive pages
- **Patience** - Real OSINT takes time; don't rush to conclusions
- **Legal boundaries** - Public information only; no unauthorized access

### Strick's Visual Methodology
- Geolocation through environmental clues (shadows, landmarks, signage)
- Chronolocation via sun position, weather data
- Metadata analysis when available
- Reverse image search across multiple engines (Google, Yandex, TinEye)

---

## Architecture Decision

### Option A: Knowledge-Based (Simplest)
Give oilcloth detailed instructions on OSINT methodology and tool usage. It uses existing WebSearch/WebFetch/Bash capabilities.

**Pros:** No new dependencies, works now, flexible
**Cons:** Relies on oilcloth's reasoning, may be inconsistent

### Option B: Script Library
Create bash/python scripts for specific lookups that oilcloth can invoke.

```bash
# Example: username_search.sh
#!/bin/bash
USERNAME="$1"
curl -s "https://whatsmyname.app/api/search/$USERNAME" | jq ...
```

**Pros:** Consistent output, can handle API auth, cacheable
**Cons:** Maintenance burden, less flexible

### Option C: MCP Tools
Build dedicated MCP server with OSINT tools.

**Pros:** Clean interface, type-safe, reusable
**Cons:** Token overhead, more complex, harder to iterate

### Option D: Fabric Integration
Install Fabric, create OSINT patterns, oilcloth calls via CLI.

**Pros:** Leverage existing patterns ecosystem, modular
**Cons:** Another dependency, requires container rebuild

### Recommendation: A + B + D

1. Start with **knowledge-based** approach (immediate)
2. Add **scripts** for reliable, repeatable lookups
3. Integrate **Fabric** for content processing patterns

---

## Content Aggregation: Lemmy & Digg

### Lemmy
- Federated Reddit alternative
- API: `https://instance.tld/api/v3/search?q=QUERY`
- Need to query multiple instances (lemmy.world, lemmy.ml, etc.)
- Consider: https://lemmyverse.net for instance discovery

### Digg (Relaunched)
- Recently relaunched as curated news aggregator
- Check if they have API or if we scrape
- RSS feeds may be available

---

## Phone/Email Intelligence

### Email
- **Epieos** - Free tier available
- **Holehe** - Python tool, checks 120+ sites
- **HaveIBeenPwned** - Breach data (API key for full access)
- **Hunter.io** - Email patterns for companies

### Phone
- **NumVerify** - Carrier lookup API
- **Twilio Lookup** - Carrier + caller name (paid)
- **OpenCNAM** - Caller ID database
- **PhoneInfoga** - OSINT tool for phone numbers

---

## Next Steps

1. [ ] Create OSINT knowledge base for oilcloth (groups/main/osint/)
2. [ ] Write initial methodology guide in CLAUDE.md
3. [ ] Build username enumeration script (WhatsMyName API)
4. [ ] Build Lemmy search aggregator script
5. [ ] Evaluate Fabric installation in container
6. [ ] Create verification checklist pattern
7. [ ] Test with real-world username search

---

## Sources

- [10 Free OSINT Tools - Rae Baker](https://www.raebaker.net/blog/10-free-osint-tools-for-beginners-and-pros)
- [Agent Skills for Codex - OSINT Team](https://osintteam.blog/agent-skills-reusable-automation-for-codex-a85b4691e520)
- [Fabric - Daniel Miessler](https://github.com/danielmiessler/fabric)
- Bellingcat methodology (implicit knowledge)
- Michael Bazzell's OSINT Techniques (implicit knowledge)
