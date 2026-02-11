# Geographic Sweep - ICE/CBP Violence Monitoring

**Skill Type:** Systematic Intelligence Collection
**Purpose:** Monitor all 50 states + U.S. territories for ICE/CBP violence, deaths, and raids
**Created:** 2026-02-07
**Status:** Active

---

## Mission

**"Every. Human. Matters."**

National media focuses on major cities. We document everywhere. This skill ensures:
- No geographic blind spots
- Territories not forgotten (Puerto Rico, Guam, Virgin Islands, American Samoa, Northern Mariana Islands)
- Small-town violence gets documented
- Pattern recognition across regions
- Early warning for escalation

---

## Geographic Coverage

### 50 States (Alphabetical)
Alabama, Alaska, Arizona, Arkansas, California, Colorado, Connecticut, Delaware, Florida, Georgia, Hawaii, Idaho, Illinois, Indiana, Iowa, Kansas, Kentucky, Louisiana, Maine, Maryland, Massachusetts, Michigan, Minnesota, Mississippi, Missouri, Montana, Nebraska, Nevada, New Hampshire, New Jersey, New Mexico, New York, North Carolina, North Dakota, Ohio, Oklahoma, Oregon, Pennsylvania, Rhode Island, South Carolina, South Dakota, Tennessee, Texas, Utah, Vermont, Virginia, Washington, West Virginia, Wisconsin, Wyoming

### 5 U.S. Territories
- Puerto Rico
- U.S. Virgin Islands
- Guam
- American Samoa
- Northern Mariana Islands

---

## Search Methodology

### Base Query Pattern

```
("ICE" OR "Immigration and Customs Enforcement" OR "CBP" OR "Customs and Border Protection" OR "Border Patrol" OR "DHS" OR "Homeland Security" OR "immigration agents" OR "deportation officers")
+ [LOCATION]
+ ("death" OR "killed" OR "shooting" OR "shot" OR "violence" OR "injured" OR "assault" OR "raid" OR "detention" OR "custody death" OR "died in custody" OR "tear gas" OR "chemical weapons" OR "ran over" OR "vehicle attack")
+ timeframe: [configurable - default last 30 days]
```

### Location-Specific Variations

**State-level:**
- Include major cities (e.g., "Portland Oregon", "Minneapolis Minnesota")
- Include detention facilities by state
- Include border regions for border states

**Territory-specific:**
- Spanish-language sources for Puerto Rico
- Local news outlets (often only coverage available)
- Federal court districts (unique jurisdictions)

### Incident Categories

**Priority 1 - Deaths:**
- Shootings by agents (fatal)
- Deaths in detention/custody
- Medical neglect deaths
- Vehicle-related deaths (run over, crashes during pursuit)

**Priority 2 - Violence:**
- Shootings (non-fatal)
- Chemical weapons deployment (tear gas, pepper spray)
- Physical assault by agents
- Vehicle assaults (running over, ramming)

**Priority 3 - Operations:**
- Mass raids
- Facility conditions reports
- Policy changes affecting enforcement
- Agent deployments/staging

---

## Execution Protocol

### 1. Systematic Sweep

**Per Location:**
1. Run base query with location modifier
2. Check English-language sources (WebSearch)
3. Check Spanish-language sources (where applicable)
4. Check local news outlets
5. Check social media (Twitter/X) for early reports
6. Document findings in structured format

**Frequency:**
- Weekly sweep (all 50 states + territories)
- Daily monitoring for known hotspots
- Immediate investigation when patterns detected

### 2. Pattern Recognition

**Look for:**
- **Geographic clustering:** Multiple incidents in single state/region
- **Temporal patterns:** Escalation timelines, coordinated operations
- **Facility patterns:** Specific detention centers with high death rates
- **Demographic targeting:** Communities being hit harder
- **Operational indicators:** Staging → raids → violence pipeline

**Flag for investigation:**
- 2+ deaths in same state within 30 days
- 3+ violent incidents in same region within 14 days
- Any territory incident (often underreported)
- Agent deployments to new locations
- Facility lockdowns or medical emergencies

### 3. Output Format

**Per Sweep - Generate:**

```markdown
# Geographic Sweep Report - [DATE]

## Summary
- Total incidents found: [NUMBER]
- Priority 1 (Deaths): [NUMBER]
- Priority 2 (Violence): [NUMBER]
- Priority 3 (Operations): [NUMBER]
- States/territories affected: [NUMBER]

## Priority Incidents (Require Dossiers)

### [STATE/TERRITORY]
**Incident:** [Brief description]
**Date:** [Date]
**Source:** [URL]
**Status:** [New/Tracking/Documented]
**Confidence:** [High/Medium/Low]

## Patterns Detected

### Geographic Clusters
[Analysis]

### Temporal Trends
[Analysis]

### Emerging Threats
[Analysis]

## Recommendations
- Dossiers needed: [LIST]
- Deep investigation needed: [LIST]
- Monitoring escalation: [LIST]

## Sources
[All URLs with timestamps]
```

### 4. Integration with Existing Systems

**Feed into:**
- `/workspace/group/osint/RESEARCH-QUEUE.md` (new incidents)
- `/workspace/group/osint/dossiers/VICTIMS-TRACKING.md` (deaths)
- `/workspace/group/osint/RESEARCH-TASKS.md` (pattern analysis)

**Create:**
- Weekly summary reports at `/workspace/group/osint/reports/geographic/YYYY-MM-DD.md`
- Alert files when significant patterns detected
- Dashboard tracking incidents by state/territory

---

## Known Hotspots (Prioritize)

### Current (As of Feb 2026)

**Confirmed Active:**
- Minnesota (Minneapolis) - Recent shootings, 700 agents departing
- Oregon (Portland) - Chemical weapons vs. protesters
- Washington - Vehicle assault incidents
- Maine - Staging operations (requires investigation)

**Border States (Always monitor):**
- Texas, Arizona, New Mexico, California

**High Custody Death Rates:**
- Florida (multiple 2025 deaths)
- Georgia (CoreCivic/GEO Group facilities)
- Texas (Karnes, Dilley, El Paso facilities)
- Louisiana (various ICE facilities)

**Territories (Often forgotten):**
- Puerto Rico (contradictory government records on Tineo-Martinez death)

---

## Research Sources

### Primary News Sources
- Local newspapers (every state)
- Spanish-language outlets (Univision, Telemundo, local)
- Alternative/independent media (Intercept, Guardian, Democracy Now)
- Legal filings (PACER, state courts)

### Specialized Monitoring
- ACLU state chapters (often first to report)
- Immigrant rights organizations (state/local)
- Medical examiner reports (when accessible)
- Congressional inquiries/reports

### Social Media Early Warning
- Twitter/X local hashtags
- Community organizing accounts
- Journalist follows (immigration beat reporters)

---

## Legal & Ethical Framework

**Reference:** `/workspace/group/osint/legal.md`

**Public sources only:**
- No accessing private/gated content
- No social engineering
- No authentication bypass
- Document methodology completely

**Verification standards:**
- Three-source rule for confidence
- Primary sources preferred
- Cross-verify government claims
- Label confidence levels explicitly

---

## Skill Invocation

### Manual Execution
```
Run geographic sweep for [STATE/TERRITORY/REGION/ALL]
Timeframe: [last 7/14/30 days]
Focus: [deaths/violence/operations/all]
```

### Scheduled Execution
- Weekly full sweep (Sunday nights)
- Daily hotspot monitoring
- Alert-based investigation (when patterns detected)

### Output Location
- Reports: `/workspace/group/osint/reports/geographic/`
- Alerts: `/workspace/group/osint/alerts/`
- Queue updates: Append to RESEARCH-QUEUE.md

---

## Success Metrics

**We succeed when:**
1. No death goes undocumented (regardless of location)
2. Patterns detected before national media reports
3. Territories receive equal coverage to states
4. Small-town violence documented alongside major cities
5. Strategic intelligence supports resistance operations

**We fail when:**
- Deaths discovered weeks/months late
- Geographic bias in coverage
- Territories forgotten
- Patterns missed due to incomplete sweeps

---

## Evolution Notes

**2026-02-07:** Skill created after recognizing geographic blind spots. Minnesota focus caused Portland/Washington incidents to be reactive rather than proactive discoveries. This skill ensures systematic coverage.

**Future improvements:**
- Automated parsing of local news RSS feeds
- Integration with court filing monitoring
- Spanish-language NLP for better territory coverage
- Correlation with SIGINT data (when available)

---

**Every. Human. Matters.**
**Every. Claim. Gets. Verified.**

No geographic exceptions.
