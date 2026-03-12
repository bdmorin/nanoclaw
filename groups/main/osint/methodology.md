# OSINT Methodology

## The OSINT Cycle

Every investigation follows this cycle:

```
1. DEFINE      → What exactly are we looking for?
2. COLLECT     → Gather raw data from multiple sources
3. PROCESS     → Clean, normalize, structure the data
4. ANALYZE     → Find patterns, connections, anomalies
5. VERIFY      → Cross-reference, check provenance
6. DOCUMENT    → Record methodology, sources, confidence
7. REPORT      → Present findings with evidence chain
```

## Verification Techniques (Bellingcat Style)

### The Three-Source Rule

Never report a finding based on a single source. Aim for:
- **Minimum:** 2 independent sources
- **Confident:** 3+ sources
- **High confidence:** Sources from different platforms/types

### Source Evaluation

Rate each source on:
- **Provenance:** Where did this come from? Can you trace it?
- **Corroboration:** Do other sources support this?
- **Timeliness:** Is this current or outdated?
- **Bias:** Does the source have motivation to mislead?

### Cross-Platform Verification

If you find a claim on Twitter:
1. Search for the same claim on other platforms
2. Look for the original source
3. Check if "confirmations" are just re-shares of the same source
4. Reverse image search any photos

### Chronolocation & Geolocation

For images/videos:
- **Shadows:** Sun angle indicates time of day and rough latitude
- **Landmarks:** Distinctive buildings, signs, natural features
- **Signage:** Language, store names, street signs
- **Weather:** Cross-reference with historical weather data
- **Metadata:** EXIF data if available (often stripped)

### Red Flags

Be suspicious when:
- Only one source exists for a claim
- Source appeared recently with no history
- Claim is emotionally charged but lacks specifics
- Image quality is suspiciously low (hiding manipulation)
- Account has unusual follower/following patterns

## Documentation Standards

Always record:
- **Query:** Exact search terms used
- **Source URL:** Full URL (use archive.org if ephemeral)
- **Timestamp:** When you accessed it
- **Screenshot:** If the content might disappear
- **Confidence level:** Low/Medium/High with reasoning

## Confidence Levels

| Level | Meaning | Evidence Required |
|-------|---------|-------------------|
| **Low** | Possible but unverified | Single source, unconfirmed |
| **Medium** | Likely accurate | 2+ sources, some corroboration |
| **High** | Confident | 3+ independent sources, verified |
| **Confirmed** | Factual | Official records, direct evidence |

## Source Reliability Tiers

Not all outlets are equally trustworthy. Rate sources according to these tiers:

### Tier 1 — Gold Standard (Primary source, use freely)
- **Court filings, PACER records, official government documents**
- **ACLU, Brennan Center** — legal analysis with citations
- **Bellingcat** — open-source verification methodology
- **ProPublica** — investigative journalism with document access
- **AP, Reuters** — wire services with editorial independence
- **The Marshall Project** — criminal justice specialty
- **The Intercept** — national security / immigration reporting
- **SPLC, ADL** — extremism tracking (verify specifics independently)

### Tier 2 — Reliable (Good journalism, use with normal verification)
- **New York Times, Washington Post** — note editorial board ≠ reporting
- **NPR, PBS** — publicly funded, editorial independence intact (as of 2026)
- **Scripps News** — 147-year history (E.W. Scripps Co., est. 1878). duPont-Columbia winner, ProPublica partnership, formal Ad Fontes content auditing. ICE Inc. investigation series is gold. MBFC: Left-Center/HIGH factual. Zero failed fact checks in 5 years. ⚠️ MONITOR: Sinclair Broadcast Group holds 8.2% stake after failed hostile takeover (Q4 2025). Scripps family retains 93% voting control. If Sinclair ever acquires, immediate review for downgrade.
- **The Guardian** — strong international coverage
- **Local newspapers / TV** (Idaho Statesman, KIVI, etc.) — closest to events
- **Common Dreams, The Real News** — progressive outlets, verify specific claims
- **Migrant Insider (Pablo Manríquez)** — specialized immigration reporting
- **Some More News (@SMN)** — investigative commentary with named researchers, detailed show notes. Covers ICE/CBP extensively.
- **WTF Just Happened Today** — daily curated brief with 5-10 mainstream source citations per item. CC BY-NC-SA licensed.
- **Margaret Killjoy** — anarchist journalist, on-ground Minneapolis reporting. Access via YouTube/podcast, not Substack (see platform note below).

### Tier 3 — Use With Caution (Verify everything independently)
- **CNN** — still producing journalism but corporate pressures increasing
- **NBC, ABC** — network news, verify against primary sources
- **Zeteo** — newer outlet, verify claims independently
- **Social media accounts** (even verified) — screenshots, not sources

### Tier 4 — COMPROMISED (Never use as primary source)
- **CBS News** — ⚠️ DOWNGRADED Feb 2026. Trump administration pressured CBS into compliance; 60 Minutes collapsed. CBS editorial independence is no longer reliable. Existing CBS citations in dossiers are acceptable ONLY where CBS is one of 4+ corroborating sources and the underlying facts are independently verified.
- **Fox News** — propaganda arm, not journalism
- **Newsmax, OAN, Daily Wire** — right-wing opinion, not news
- **Government press releases / DHS statements** — document as claims, never as facts. Cross-reference against independent reporting. DHS has a documented pattern of false statements (see: federal-agent-conduct-pattern.md McLaughlin disinformation table).

### Tier 5 — Do Not Use
- **Social media posts without verification**
- **Anonymous tips without corroboration**
- **Any source behind a paywall you can't verify**
- **AI-generated content presented as reporting**

### Applying Tiers
- **Single-source claims:** Only acceptable from Tier 1 sources
- **Two-source claims:** Acceptable if at least one is Tier 1 or 2
- **Pattern claims:** Require 3+ sources across at least 2 tiers
- **Tier 4 sources:** Can be cited as "CBS reported..." but cannot be the basis for any finding
- **When in doubt:** Downgrade confidence, note the limitation

### Platform Ethics Notes

Some platforms are ethically compromised even when individual creators on them are not:

- **Substack** — ⚠️ Actively pays out revenue to Nazi publishers (Richard Spencer, etc.) and refuses to deplatform fascist content. Individual journalists on Substack may be excellent (e.g., Margaret Killjoy, Ken Klippenstein). **Policy:** Prefer accessing their content via YouTube, podcasts, or other platforms when available. If Substack is the only source for unique intel, cite the journalist not the platform, and verify claims independently. Do not link to Substack if an alternative exists.
- **X/Twitter** — Under Musk ownership, amplifies fascist content algorithmically. Screenshots from X are not sources. If a government official posts something on X, find the official statement or press release instead.

*Last updated: 2026-02-18 — Scripps News added (Tier 2), Sinclair monitoring note. CBS downgraded, Substack/X platform notes added*

---

## Common Pitfalls

1. **Confirmation bias:** Seeking only evidence that supports your theory
2. **Single-source dependency:** Treating one detailed source as definitive
3. **Circular sourcing:** Multiple articles citing each other
4. **Outdated information:** Old data presented as current
5. **Assuming authenticity:** Screenshots and documents can be faked
