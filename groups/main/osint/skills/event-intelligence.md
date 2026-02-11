# Skill: Event Intelligence — Extremist Rally & Counter-Protest Documentation

## Purpose
Systematically document white nationalist, fascist, and extremist public events — their organizers, participants, symbolism, counter-protesters, and patterns. Built to be reusable for any event, not ad-hoc.

## When to Use
- Major extremist rally or march (Patriot Front, Proud Boys, etc.)
- Counter-protest with significant resistance activity
- Christofascist events with extremist crossover
- Any event where fascist/white nationalist groups operate publicly

---

## Phase 1: Event Identification

### Baseline Facts
- **Event name** (official and actual)
- **Date and time**
- **Location** (exact — street, landmark, city, state)
- **Organizer(s)** — who called it, who led it
- **Stated purpose** vs **actual purpose**
- **Approximate attendance** (extremists + counter-protesters separately)
- **Law enforcement presence and response**

### Source Priority
1. Journalist firsthand reporting (wire services, local press)
2. Counter-protester documentation (video, photos)
3. Satirist/activist coverage (Walter Masterson, etc.)
4. Social media posts from participants (self-documenting)
5. ADL / SPLC monitoring reports
6. Law enforcement statements

---

## Phase 2: Organization Profiling

For each extremist group present:

### Identity
- **Group name** and aliases/rebrands
- **Founded** — when, where, by whom
- **Leadership** — identified leaders present
- **Predecessor organizations** (e.g., Patriot Front ← Vanguard America ← Unite the Right)
- **Size estimate** — total membership, attendance at this event

### Ideology
- **Core beliefs** (in their own words + reality)
- **Coded language** they use (e.g., "American nationalism" = white nationalism)
- **Symbolism** — flags, logos, uniforms, hand signs
  - Document: fasces, Celtic cross, sonnenrad/Black Sun, Confederate flags, Betsy Ross flags, etc.
  - Note any modified American flag imagery (stars replaced, inverted, etc.)

### Tactics
- **Recruitment methods** (fitness clubs, community events, online)
- **Political infiltration** (running for office, local government)
- **Public demonstration style** (marching formation, U-Haul logistics, uniform dress code)
- **Violence history** (attacks, convictions, lawsuits)

### Legal Status
- **Lawsuits** against the group
- **Member convictions**
- **Designated hate group** status (ADL, SPLC)

---

## Phase 3: Symbolism Analysis

Document ALL visible symbols, flags, banners, and insignia:

### Flag/Banner Inventory
For each flag or banner observed:
- **Description** (colors, symbols, text)
- **Origin** (what group/movement uses it)
- **Historical context** (what it represents)
- **Screenshot/image reference** (timestamp in video if applicable)

### Common Extremist Symbols Reference
| Symbol | Meaning | Used By |
|--------|---------|---------|
| Fasces | Fascism (Roman bundle of sticks + axe) | Patriot Front |
| Celtic Cross | White power/supremacy | Multiple groups |
| Sonnenrad/Black Sun | Nazi occultism | Multiple groups |
| Confederate Battle Flag | White supremacy, Lost Cause | Multiple groups |
| Betsy Ross Flag | "Original America" (white-only founding) | Patriot Front |
| Inverted US Flag | "Nation in distress" | Patriot Front |
| 13 Stars | 13 colonies (pre-diversity America) | Patriot Front |
| III% / Three Percenter | Anti-government militia | III%ers |
| Kekistan Flag | Alt-right ironic fascism | Online alt-right |
| Stormfront Celtic Cross | White nationalist web community | Stormfront users |

---

## Phase 4: Counter-Protest Documentation

### Resistance Activity
- **Groups present** (antifa, community orgs, faith groups, etc.)
- **Tactics used** (blocking, noise, ridicule, banners, documentation)
- **Approximate numbers**
- **Notable individuals** (journalists, known activists — public figures only)
- **Effectiveness** (did counter-protest outnumber/disrupt the event?)

### Community Impact
- **Local response** (residents, businesses, officials)
- **Media coverage** (who covered it, framing)
- **Social media reach** (viral videos, trending topics)

---

## Phase 5: Pattern Analysis

### Compare to Previous Events
- Same group at same event (e.g., Patriot Front at March for Life — recurring?)
- Attendance trend (growing, shrinking, stable?)
- Geographic expansion (new cities? new events?)
- Tactical evolution (new symbols? new formations? new recruitment?)
- Violence escalation (any incidents this time vs. previous?)

### Cross-Reference with Our Systems
- Any overlap with ICE/CBP operations? (Rousseau said "ICE is deporting a lot of people, but it's not enough")
- Connection to government officials or politicians?
- Overlap with anti-immigrant violence we track?
- Corporate or institutional support/enablement?

---

## Phase 6: Source Collection

### Video Sources
Search YouTube, TikTok, Instagram, X for:
- `[group name] + [event name] + [date]`
- `[group name] + [city]`
- Counter-protest footage
- Journalist coverage
- Participant self-documentation (they film themselves)

### Key Accounts to Check
- **Walter Masterson** (@waltermasterson) — satirist, infiltrates events
- **ADL** (@ADL) — hate group monitoring
- **SPLC** (@splcenter) — extremism tracking
- **Unicorn Riot** (@UnicornRiot) — independent journalism, leaked Patriot Front chats
- **Robert Evans** (Behind the Bastards) — extremism analysis
- Local journalists covering the event

### Document Sources
- ADL backgrounders
- SPLC group profiles
- GWU Program on Extremism
- ISD (Institute for Strategic Dialogue) explainers
- Court documents (lawsuits, criminal cases)

---

## Output Format

### Event Dossier Structure
```
osint/dossiers/YYYY-MM-DD_[event-slug]/
├── metadata.json
├── event-report.md        (main analysis)
├── organization-profiles/  (one per group)
│   └── [group-name].md
├── symbolism-analysis.md
├── counter-protest.md
├── sources.md
└── media/                 (screenshots, archive links)
```

### metadata.json Template
```json
{
  "event": "[Event Name]",
  "date": "YYYY-MM-DD",
  "location": "[City, State]",
  "type": "extremist_rally",
  "groups_present": ["Patriot Front"],
  "attendance_estimate": {
    "extremists": 0,
    "counter_protesters": 0
  },
  "violence_incidents": false,
  "arrests": 0,
  "confidence": "HIGH",
  "researcher": "oilcloth",
  "created": "YYYY-MM-DDTHH:MM:SSZ"
}
```

---

## Trend Tracking

Maintain a running index of documented events:
```
osint/events/EVENT-INDEX.md
```

Track:
- Date, location, group, attendance, violence (Y/N)
- Trend line: is fascist public activity increasing?
- Geographic spread: which cities are hotspots?
- Counter-protest effectiveness: are communities pushing back?

---

## Key Principle

**We document the fascists. We document the resistance. We track the trends.**

This isn't about individual events — it's about seeing the pattern of fascist organizing across the country, and the community resistance that meets it.

Same methodology as everything else:
- **Three-source verification**
- **Public sources only**
- **Confidence levels explicit**
- **Every. Claim. Gets. Verified.**
