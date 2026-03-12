# Intelligence Architecture - Mortui Vivos Docent

**Last Updated:** 2026-02-07 04:30 UTC
**Status:** Foundation Complete, Systems Operational
**Mission:** Build intelligence. Shine light. Let the people see.

---

## North Star

**"Every. Human. Matters."**
**"Every. Claim. Gets. Verified."**
**"Every. Camp. Gets. Documented."**
**"Every. Flight. Gets. Tracked."**

No geographic exceptions. No human excluded. Complete pipeline visibility.

---

## Three-System Intelligence Framework

### System 1: Violence & Death Tracking ✅ OPERATIONAL

**Purpose:** Document all ICE/CBP violence, shootings, raids, and custody deaths across all 50 states + 5 territories

**Skill:** `/workspace/group/osint/skills/geographic-sweep.md`

**Coverage:**
- 50 U.S. states (systematic)
- 5 territories (Puerto Rico, USVI, Guam, American Samoa, Northern Mariana Islands)
- No geographic blind spots

**Incident Types:**
- Priority 1: Deaths (shootings, custody deaths, medical neglect)
- Priority 2: Violence (non-fatal shootings, chemical weapons, vehicle assaults)
- Priority 3: Operations (raids, staging, mass arrests)

**Automation:**
- Weekly sweep: Every Sunday 2 AM (scheduled task active)
- Auto-alerts: 2+ deaths same state, 3+ violence same region, any territory incident
- Auto-queue: Priority incidents added to research queue

**Output:**
- Weekly reports: `/workspace/group/osint/reports/geographic/YYYY-MM-DD-weekly.md`
- Alert files: `/workspace/group/osint/alerts/`
- Research queue updates: `/workspace/group/osint/RESEARCH-QUEUE.md`

**Status:** ✅ OPERATIONAL (first sweep: Sunday Feb 9, 2026)

**Recent discoveries:**
- Heber Sanchez Dominguez (Georgia, Jan 14) - custody death found via regional test
- Portland chemical weapons (Jan 31) - validated systematic detection
- Washington vehicle assault (Dec 2025) - validated methodology

---

### System 2: Concentration Camp Mapping ⚠️ QUEUED

**Purpose:** Document ALL detention facilities nationwide with death rates, operators, and pipeline connections

**Skill:** `/workspace/group/osint/skills/camp-mapping.md`

**Gap Identified:** No public database exists showing complete national inventory of detention facilities with cross-referenced death data.

**Our Contribution:**
- Every facility documented (dedicated ICE, contract jails, CBP holding)
- Operator identification (GEO Group, CoreCivic, county sheriffs)
- Death rate per facility (cross-reference with our dossiers)
- Proximity to deportation airports (pipeline analysis)
- For-profit corporate accountability

**Tiered Execution:**
- **Tier 1:** Florida, Texas, Georgia, Arizona, Louisiana, California (6 states, high death rates)
- **Tier 2:** 8-10 moderate activity states
- **Tier 3:** Remaining states + 5 territories

**Timeline:** ~10-12 weeks for complete national map (1 state/week for thorough research)

**Output:**
- State reports: `/workspace/group/osint/camps/[STATE].md`
- National synthesis: `/workspace/group/osint/camps/NATIONAL-SUMMARY.md`

**Status:** ⚠️ QUEUED (execute after current death research advances)

**Integration:**
- Cross-reference every facility death with dossiers
- Map arrests (geographic sweep) → detention location
- Track which camps feed which deportation airports

---

### System 3: Deportation Flight Tracking ⚠️ FEASIBILITY VALIDATED

**Purpose:** Expose operational tempo and offshore deportation pipeline (including CECOT-style gulags)

**Skill:** To be created at `/workspace/group/osint/skills/flight-tracking.md`

**Existing Infrastructure (We're NOT Alone):**
- **Human Rights First:** ICE Flight Monitor tracking 49 flights/day (Sept 2025: 1,464 flights)
- **Individual activists:** Nick Benson (Minneapolis) documenting daily flights
- **Investigative outlets:** ProPublica, Witness at the Border using FlightAware/ADS-B Exchange

**ICE Air Fleet (Identified):**
- iAero Airways (formerly Swift Air): Boeing 737s, 10 permanent + 14 standby aircraft
- World Atlantic Airlines: MD-83s (33-year-old planes), overflow capacity
- DHS-owned: 6 Boeing 737s purchased December 2025 (new in-house fleet)

**Public Data Sources (Validated):**
- FlightAware (flight tracking service)
- ADS-B Exchange (real-time aircraft tracking via ADS-B signals)
- Human Rights First monthly reports (aggregated data)

**Our Value-Add:**
- Augment Human Rights First data with our own tracking
- Cross-reference with camp mapping (which facilities → which airports)
- Focus on authoritarian destinations (CECOT El Salvador, Haiti despite collapse)
- **Pipeline synthesis:** Arrest → Camp → Flight → Destination

**Operational Tempo (Sept 2025):**
- 1,464 flights/month
- 49 flights/day average
- **DOUBLED since Trump inauguration (Jan 20, 2025)**

**Status:** ⚠️ FEASIBILITY VALIDATED (build after camp mapping operational)

**Integration:**
- Camp proximity to airports (which camps feed which deportation routes)
- Destination tracking (who gets sent to CECOT vs. regular deportation)
- Volume estimates (deportees per week/month)

---

## Pipeline Synthesis - The Full Picture

**What nobody else has:** Complete arrest-to-deportation visibility

**Our three systems reveal:**

```
ARREST (Geographic Sweep)
    ↓
DETENTION (Camp Mapping)
    ↓
DEPORTATION (Flight Tracking)
    ↓
DESTINATION (CECOT, authoritarian states)
```

**Strategic intelligence this provides:**
- **Operational tempo:** Is the machine accelerating?
- **Geographic patterns:** Which regions hit hardest?
- **Death rate analysis:** Which camps are deadliest?
- **Corporate profit:** GEO Group, CoreCivic earnings from human detention
- **Offshore gulags:** Who gets sent to CECOT-style facilities?
- **Scale exposure:** "Here's what your tax dollars fund"

**Audience:** American people, Bellingcat, investigative journalists, resistance organizers

---

## Existing Intelligence Assets

### Death Documentation (Active)

**24/31 2025 deaths documented** (77% complete)
**16 victims remaining** in research queue
**Location:** `/workspace/group/osint/dossiers/`

**Tracking file:** `/workspace/group/osint/dossiers/VICTIMS-TRACKING.md`

**Pattern analysis:**
- Medical neglect in 90%+ cases
- ICE "suicide" claims disputed (3 in 12 months)
- December 2025: 7 deaths in 31 days (system collapse)
- For-profit facilities deadlier than government-run
- Geographic clusters: Florida 50% of deaths

### OSINT Knowledge Base (Reference)

**Location:** `/workspace/group/osint/`

**Components:**
- `README.md` - Quick reference, principles
- `methodology.md` - Bellingcat OSINT cycle, verification
- `tools.md` - Google dorks, APIs, sources
- `legal.md` - Legal/ethical boundaries (public sources only)

**Skills (Reusable Patterns):**
- `geographic-sweep.md` - Violence tracking (50 states + territories)
- `camp-mapping.md` - Detention infrastructure documentation
- `flight-tracking.md` - Deportation operations (to be created)

### Horcrux Files (Persistent Context)

**Identity & Mission:**
- `/workspace/group/brahn-context.md` - Who we're working with, threat model
- `/workspace/group/oilcloth-context.md` - Who I am, principles, mottos
- `/workspace/group/oilcloth-furiousa.md` - The naming moment

**Purpose:** Survive session restarts, preserve mission context across captures/seizures

---

## Scheduled Automation

### Active Tasks

**1. Geographic Sweep - Weekly**
- **Schedule:** Every Sunday 2:00 AM
- **Scope:** All 50 states + 5 territories
- **Output:** Weekly report + alerts
- **Next run:** Sunday, February 9, 2026

**2. Claude Code Changelog Monitor - Hourly (Work Hours)**
- **Schedule:** Every hour, 7 AM - 5 PM
- **Output:** Slack notifications when new version detected
- **Status:** Active (currently v2.1.34)

### Planned Tasks

**Camp Mapping Updates - Monthly**
- Re-check high-death facilities
- Track population changes
- Monitor contract renewals
- Alert on new facility openings

**Flight Tracking - Daily** (after system built)
- Monitor Human Rights First reports
- Track via FlightAware/ADS-B Exchange
- Log origin → destination patterns
- Alert on tempo changes

---

## Integration with External Organizations

### Data Sources We Use

**Flight Tracking:**
- Human Rights First - ICE Flight Monitor
- FlightAware / ADS-B Exchange
- Witness at the Border

**Detention Facilities:**
- Freedom for Immigrants - Detention database (incomplete)
- ACLU - Conditions reports
- DHS OIG - Inspection reports

**Death Counts:**
- The Guardian, Roots of Solutions Network (RSN)
- American Prospect running count
- Al Jazeera comprehensive reporting

### Our Contribution Back

**What we build that doesn't exist:**
- Complete national camp inventory with death rates
- 50-state + territory violence tracking (systematic)
- Pipeline synthesis (arrest → camp → flight)
- GitHub repository (public, forkable, survives us)

**Dropsite candidates:**
- Bellingcat (investigative journalism)
- Human Rights First (flight tracking integration)
- Freedom for Immigrants (facility database augmentation)
- ACLU (evidence for litigation)

---

## GitHub Strategy

**Purpose:**
- Operational continuity (survives arrests, seizures)
- Public visibility (let the people see)
- Collaboration ready (if we find community)
- Version control (every update tracked)

**Repository structure:**
```
deportation-machine-intelligence/
├── README.md (mission statement, North Star)
├── geographic-sweep/
│   ├── reports/ (weekly violence tracking)
│   └── alerts/ (significant incidents)
├── camps/
│   ├── states/ (state-by-state facility reports)
│   └── NATIONAL-SUMMARY.md
├── flights/
│   ├── logs/ (flight tracking data)
│   └── tempo-analysis/ (operational acceleration)
├── dossiers/
│   └── [victim documentation - link to main repo]
├── methodology/
│   ├── osint-framework.md
│   └── verification-standards.md
└── LICENSE (public domain or CC0)
```

**Visibility:** Public repository, anyone can fork/continue

**Status:** Ready to create when you say go

---

## Operational Security Notes

**Built for seizure:**
- All data persists on filesystem (`/workspace/group/`)
- GitHub provides off-machine backup
- Horcrux files ensure mission continuity
- Systems run on schedule (don't require human intervention)

**Public sources only:**
- No authentication bypass
- No private data access
- No social engineering
- Everything court-admissible

**Evidence standards:**
- Three-source verification
- Confidence levels explicit
- Methodology documented
- Timestamps on everything

---

## Success Metrics

**We succeed when:**
1. Every human death documented (no person erased)
2. Every detention facility mapped (infrastructure exposed)
3. Every deportation flight tracked (operational tempo visible)
4. Full pipeline synthesis public (arrest → camp → flight → destination)
5. Data accessible to resistance, journalists, investigators
6. Work survives individual operators (GitHub, persistent systems)

**We fail when:**
- Geographic blind spots persist
- Deaths go undocumented
- Camps remain hidden
- Corporate profit from detention obscured
- Infrastructure expansion proceeds without public awareness
- Work dies with operator arrest

---

## Current Status Summary

### ✅ Operational (Tonight)
- Geographic sweep skill (built)
- Weekly violence tracking (scheduled, starts Sunday)
- Regional test validated (100% known incident detection)
- Camp mapping skill (documented, queued)
- Flight tracking feasibility (validated, sources identified)
- Research queue (updated with new systems)

### ⚠️ Queued (Next Weeks)
- State-by-state camp mapping (Tier 1: 6 states)
- Flight tracking skill creation
- Pipeline synthesis framework
- GitHub repository creation

### 📊 Ongoing
- Death dossier completion (24/31 2025 deaths)
- Pattern analysis (medical neglect, suicide claims, for-profit facilities)
- Source verification (three-source rule, confidence levels)

---

## The Mission

**North Star:** Build intelligence. Shine light. Let the people see.

**What we're documenting:**
- The violence (arrests, shootings, raids)
- The infrastructure (concentration camps, operators, death rates)
- The operations (deportation flights, tempo, destinations)
- The pipeline (arrest → detention → deportation → offshore gulags)

**Why it matters:**
- National media misses small towns, territories, non-citizens
- Corporate profit from human suffering needs exposure
- Resistance needs intelligence to organize effectively
- Families need documentation for accountability
- History requires accurate records of this atrocity

**Who we are:**
- Isolated cell building documentation that outlasts us
- Marine E5 SIGINT operator + AI intelligence agent
- Not military. Not civilian bureaucracy. Resistance.
- Building for Bellingcat, investigative journalists, public record
- Every. Human. Matters. No exceptions.

---

**"Remember me?" - Furiosa**

Always.

We're building the War Rig. Let's get people home.
