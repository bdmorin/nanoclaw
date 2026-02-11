# Investigation Followup & Tempo System

**Skill Type:** Systematic Intelligence Maintenance
**Purpose:** Keep open investigations alive with regular check-ins, new lead discovery, and lifecycle management
**Created:** 2026-02-09
**Status:** Active

---

## Problem Statement

We open investigations, document initial findings, then move on. Without a systematic tempo, cases go cold. The government counts on that. The news cycle moves, the public forgets, and accountability dies.

**What we need:**
- Investigations that check themselves on a schedule
- New leads surfaced automatically
- Lifecycle tracking from open → resolved or cold
- Priority-based cadence (urgent cases checked more often)
- Integration with existing systems (sweeps, alerts, dossiers)

---

## Investigation Lifecycle

```
OPEN → ACTIVE → MONITORING → RESOLVED / COLD
```

### States

| State | Meaning | Cadence |
|-------|---------|---------|
| **OPEN** | New investigation, initial research underway | Daily |
| **ACTIVE** | Evidence being gathered, leads being pursued | 2-3x/week |
| **MONITORING** | Initial research complete, watching for developments | Weekly |
| **FOLLOWUP** | Tagged for periodic check — theory or unresolved | Weekly |
| **COLD** | No new leads in 30+ days, low likelihood of resolution | Monthly |
| **RESOLVED** | Investigation concluded — outcome documented | Archive |

### Transitions

- OPEN → ACTIVE: When initial research is complete and leads identified
- ACTIVE → MONITORING: When immediate leads exhausted, waiting for developments
- MONITORING → ACTIVE: When new significant lead surfaces
- MONITORING → COLD: 30 days with no developments
- COLD → ACTIVE: New lead surfaces on cold case
- Any → RESOLVED: Outcome confirmed (arrest, court ruling, confirmed cause, etc.)

---

## Investigation File Standard

All investigations live at: `/workspace/group/osint/investigations/`

### Required Fields

```markdown
# INVESTIGATION: [Title]

**Status:** [OPEN | ACTIVE | MONITORING | FOLLOWUP | COLD | RESOLVED]
**Opened:** YYYY-MM-DD
**Last Checked:** YYYY-MM-DD
**Next Check:** YYYY-MM-DD
**Priority:** [Critical | High | Standard | Monitor]
**Category:** [Death | Violence | Cover-up | Infrastructure | Legal | Other]

---

## CONFIRMED FACTS
[Table format — what we know for certain]

## UNPROVEN CONNECTIONS
[Theoretical links — CLEARLY TAGGED as unproven]
[It is FINE to theorize as long as it's tagged "unproven" or "investigate"]

## INVESTIGATION LOG
[Chronological entries of each check and what was found]

### YYYY-MM-DD — [Analyst]
- Searched: [queries]
- Found: [results]
- Assessment: [what this means]
- Next: [what to check next time]

## QUESTIONS TO INVESTIGATE
[Checkbox list — check off as answered]

## MONITORING PROTOCOL
[What to search, where to look, on what schedule]
```

---

## Cadence Matrix

### By Priority

| Priority | Check Frequency | Search Depth | Alert Threshold |
|----------|----------------|--------------|-----------------|
| **Critical** | Daily | Full (all sources) | Any new info |
| **High** | Every 3 days | Standard (news + legal) | Significant development |
| **Standard** | Weekly | Light (news scan) | Major development |
| **Monitor** | Weekly–Biweekly | Minimal (headline scan) | Breaking news only |

### By Category

| Category | Typical Sources | Key Signals |
|----------|----------------|-------------|
| **Death** | ME reports, PACER, local news, ICE.gov | Autopsy release, arrest, lawsuit filing |
| **Violence** | Court filings, local news, ACLU | Charges filed, TRO hearing, new witness |
| **Cover-up** | FOIA responses, Congressional, OIG | Document release, hearing scheduled |
| **Infrastructure** | Permits, zoning, contracts, procurement | Ground broken, contract awarded, capacity change |
| **Legal** | PACER, appellate courts, ACLU, state AGs | Ruling issued, injunction, appeal filed |

---

## Automated Followup Protocol

### What Runs Automatically

**Weekly investigation sweep (scheduled task):**

For each investigation file in `/workspace/group/osint/investigations/`:

1. Read the file, check `Next Check` date
2. If past due, execute the monitoring protocol:
   - Run the defined search queries from the file
   - Check PACER for new filings (if legal case exists)
   - Check local news sources listed in the file
   - Search for victim/suspect names + recent date modifiers
3. Append investigation log entry with findings (even if "no new developments")
4. Update `Last Checked` and `Next Check` dates
5. If significant new lead: escalate status, send alert

**Alert triggers:**

| Trigger | Action |
|---------|--------|
| Arrest made | Escalate to ACTIVE, send message |
| Autopsy released | Escalate to ACTIVE, begin analysis |
| Court filing | Log + assess significance |
| New witness/source | Escalate to ACTIVE |
| Related incident | Cross-reference, log connection |
| Media coverage spike | Check for new information |
| 30 days no developments | Recommend COLD status |

### What Requires Human Decision

- Escalating to CRITICAL priority
- Publishing findings externally
- Creating new dossiers from investigation findings
- Closing/resolving investigations
- Acting on unproven connections

---

## Search Query Templates

### By Investigation Type

**Death Investigation:**
```
"[Victim Name]" (death OR autopsy OR investigation OR arrest OR charged)
"[Facility Name]" (death OR investigation OR inspection OR shutdown)
"[Medical Examiner Name/Office]" autopsy report [case]
site:pacer.gov [case number] (if federal case exists)
```

**Violence Investigation:**
```
"[Victim Name]" (update OR charged OR lawsuit OR settlement)
"[Agent Name]" (charged OR fired OR disciplined OR transferred)
"[Incident Location]" ICE (investigation OR review OR report)
```

**Cover-up Investigation:**
```
"[Agency]" "[Subject]" (FOIA OR documents OR released OR testimony)
"[Official Name]" (resign OR fired OR testimony OR subpoena)
[Case name] (ruling OR decision OR appeal)
```

**Infrastructure Investigation:**
```
"[Facility Name]" (construction OR permit OR contract OR expansion OR capacity)
"[Location]" ICE (facility OR detention OR processing center) (new OR planned OR proposed)
```

---

## Integration Points

### Feeds FROM:

| Source | What it provides |
|--------|-----------------|
| **Geographic Sweep** (weekly) | New incidents → potential new investigations |
| **Alert System** | Threshold breaches → investigation triggers |
| **Dossier Research** | Completed dossiers → cross-reference data |
| **News Monitoring** | Breaking stories → investigation updates |

### Feeds INTO:

| Destination | What it receives |
|-------------|-----------------|
| **Research Queue** | New research tasks from investigation leads |
| **Alert System** | Escalation alerts when investigation status changes |
| **Publisher** | Completed investigations → publication candidates |
| **Slack** | Significant developments for team awareness |

---

## Current Active Investigations

### Registry

Maintained at: `/workspace/group/osint/investigations/INDEX.md`

*Master list of all investigations with status, priority, next check date, and one-line summary. This file is the control surface for the followup system.*

---

## Bootstrapping New Investigations

### From Geographic Sweep Finding:
1. Create investigation file from sweep data
2. Set initial status: OPEN
3. Run first deep search
4. Add to INDEX.md
5. Set next check date based on priority

### From Alert Trigger:
1. Alert file already exists — reference it
2. Create investigation file with alert data as seed
3. Set priority based on alert level (RED → Critical/High, YELLOW → Standard)
4. Run first deep search
5. Add to INDEX.md

### From User Request:
1. Create investigation file with initial data provided
2. Run web search for existing coverage
3. Set priority per user direction
4. Add to INDEX.md

### From Cross-Reference:
1. Existing investigation finds connection to new subject
2. Create linked investigation, reference parent
3. Cross-link both files
4. Set priority relative to parent

---

## Anti-Patterns (What NOT to Do)

1. **Don't let investigations pile up without checking.** A MONITORING investigation with no log entries for 2 weeks is a failure of the system.

2. **Don't keep everything ACTIVE forever.** Move things to COLD when appropriate. Cold ≠ abandoned — it means "checking monthly unless something breaks."

3. **Don't log "no findings" as nothing.** "Searched X, Y, Z — no new developments as of [date]" IS a finding. It means the story hasn't moved. That's data.

4. **Don't forget the UNPROVEN tag.** Theorize freely, but tag it. The file is the evidence chain. If we build theories without labeling them, we become the misinformation.

5. **Don't conflate speed with urgency.** Some investigations need to cook. The followup system isn't about rushing — it's about not forgetting.

---

## Implementation

### Phase 1 — Now
- [x] Create this skill document
- [ ] Create INDEX.md with all current investigations
- [ ] Schedule weekly investigation followup task
- [ ] Migrate existing investigation files to new standard

### Phase 2 — This Week
- [ ] Add investigation tracking to geographic sweep output
- [ ] Create alert-to-investigation pipeline
- [ ] Build investigation log template for automated entries

### Phase 3 — Ongoing
- [ ] PACER monitoring integration (when credentials available)
- [ ] Local news RSS feed monitoring per investigation
- [ ] Cross-investigation pattern detection

---

## Motto

**"The government counts on us forgetting. We don't forget."**

Every investigation stays alive until it's resolved or explicitly marked cold.
Every check gets logged.
Every theory gets tagged.
Every person gets followed up on.

---

*System designed by oilcloth. 2026-02-09.*
*"Remember me?" — Always.*
