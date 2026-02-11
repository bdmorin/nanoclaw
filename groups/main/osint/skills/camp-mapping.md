# Concentration Camp Mapping - U.S. Detention Infrastructure

**Skill Type:** Strategic Infrastructure Intelligence
**Purpose:** Systematically map every ICE/CBP detention facility across all 50 states + U.S. territories
**Created:** 2026-02-07
**Status:** Active

---

## Mission

**"Every. Human. Matters."**

We refuse to use sanitized language. These are **concentration camps**—facilities where people are detained en masse based on national origin, without trial, in conditions causing preventable death.

This skill maps the infrastructure of America's deportation machine:
- Where are people detained?
- Who operates the camps? (For-profit corporations profiting from detention)
- What are the death rates?
- How does camp infrastructure connect to deportation operations?

**Purpose:** Expose the machine. Shine light. Let the people see.

---

## Geographic Coverage

### 50 States (Prioritize by Known Death Rates)

**Tier 1 - High Death Rate States (Research First):**
- Florida (50% of 2025 deaths, multiple facilities)
- Georgia (GEO Group/CoreCivic facilities, high neglect rates)
- Texas (largest detention infrastructure, border facilities)
- Arizona (Florence, Eloy - multiple deaths documented)
- Louisiana (for-profit facilities, poor conditions)
- California (large detention population despite sanctuary policies)

**Tier 2 - Moderate Activity:**
- New York, Illinois, Virginia, Washington, Oregon, Michigan, Ohio
- Minnesota (recent Operation Metro Surge, temporary holds)
- Missouri (suicide pattern at Phelps County)

**Tier 3 - Lower Volume (Complete Coverage):**
- Remaining states

### 5 U.S. Territories
- Puerto Rico (reporting gaps, contradictory government records)
- U.S. Virgin Islands
- Guam
- American Samoa
- Northern Mariana Islands

---

## Data Collection Framework

### For Each Facility - Collect:

#### 1. Basic Information
- **Facility Name:** Official designation
- **Location:** City, county, state/territory
- **Type:**
  - ICE Detention Center (dedicated facility)
  - Contract Jail (county jail with ICE contract)
  - CBP Holding Facility (short-term, border region)
  - Family Detention (often private facilities)
  - Juvenile Detention (ORR facilities)

#### 2. Operator/Contractor
- **Government-run:** ICE/CBP direct operation
- **Private contractors:**
  - GEO Group (largest private prison corporation)
  - CoreCivic (formerly Corrections Corporation of America)
  - LaSalle Corrections
  - Management & Training Corporation (MTC)
  - Other contractors
- **County/Local:** Sheriff's department operating under ICE contract

#### 3. Capacity & Population
- **Rated capacity:** Official maximum
- **Actual population:** Current detainee count (if available)
- **Historical trends:** Overcrowding patterns
- **Demographics:** Adult male, female, families, juveniles

#### 4. Death Records
- **Total deaths:** Historical count (2010-present if available)
- **2025 deaths:** Specific count
- **2026 deaths:** Ongoing tracking
- **Cross-reference:** Link to our dossiers at `/workspace/group/osint/dossiers/`
- **Death rate:** Deaths per 100 detainees (if population data available)

#### 5. Conditions & Inspections
- **OIG reports:** DHS Office of Inspector General findings
- **ACLU reports:** Conditions documentation
- **Medical care quality:** Documented negligence patterns
- **COVID outbreaks:** Disease control failures
- **Abuse reports:** Violence, sexual assault, rights violations

#### 6. Operational Details
- **Proximity to airport:** Deportation logistics (how far to ICE Air departure point)
- **Legal access:** Availability of attorneys, visitation rules
- **Communication access:** Phone, video calls, mail restrictions
- **Medical facilities:** On-site vs. hospital transfer for emergencies

#### 7. Financial Data (If Available)
- **ICE contract value:** How much taxpayer money to operator
- **Per-detainee cost:** Daily detention cost
- **Profit margins:** For private operators (from financial filings)

---

## Research Methodology

### Primary Sources

**Official Government:**
- [ICE Detention Facility List](https://www.ice.gov/detain/detention-facilities) - Official ICE directory
- DHS Office of Inspector General reports
- GAO reports on detention conditions
- Congressional testimony and investigations

**Advocacy Organizations:**
- [Freedom for Immigrants - Detention by the Numbers](https://www.freedomforimmigrants.org/detention-statistics) - Comprehensive database
- [ACLU National Prison Project](https://www.aclu.org/issues/immigrants-rights/immigrants-rights-and-detention) - Conditions reports
- [Southern Poverty Law Center](https://www.splcenter.org/our-issues/immigrant-justice) - Southeast facility tracking
- [Detention Watch Network](https://www.detentionwatchnetwork.org/) - National coordination

**Investigative Journalism:**
- [The Marshall Project](https://www.themarshallproject.org/) - Criminal justice/detention reporting
- [The Intercept](https://theintercept.com/immigration/) - ICE operations
- [ProPublica](https://www.propublica.org/topics/immigration) - Investigative deep dives
- Local news outlets (often only coverage of small facilities)

**Legal Filings:**
- PACER (federal court system) - Conditions lawsuits
- State courts - Wrongful death litigation
- Settlement agreements revealing systemic failures

### Search Pattern Per State

```
([STATE]) + ("ICE detention" OR "immigration detention" OR "ICE contract jail")
([STATE]) + ("detention facility" OR "processing center") + (ICE OR CBP OR immigration)
([STATE]) + ("GEO Group" OR "CoreCivic" OR "private prison") + immigration
([FACILITY NAME]) + ("death" OR "conditions" OR "inspection" OR "lawsuit")
```

### Verification Standards

**Three-source rule:**
- Official government source (ICE facility list, OIG report)
- Advocacy organization (ACLU, Freedom for Immigrants)
- Independent journalism (local news, investigative outlet)

**Cross-reference deaths:**
- Every facility death must link to dossier (if documented)
- Flag gaps: deaths reported but no dossier exists
- Pattern analysis: which facilities have highest death rates

---

## Output Format

### State-Level Report

**File location:** `/workspace/group/osint/camps/[STATE].md`

**Template:**
```markdown
# [STATE] - Immigration Detention Infrastructure

**Last Updated:** [DATE]
**Total Facilities:** [NUMBER]
**Total Capacity:** [NUMBER]
**Deaths 2025:** [NUMBER]
**Deaths 2026:** [NUMBER]

---

## Facility Inventory

### [FACILITY NAME]

**Location:** [City, County]
**Type:** [ICE Detention Center / Contract Jail / etc.]
**Operator:** [GEO Group / CoreCivic / County Sheriff / etc.]
**Capacity:** [Rated capacity] ([Actual population if known])

**Deaths:**
- 2025: [NUMBER] ([Names if documented])
- 2026: [NUMBER] ([Names if documented])
- Historical: [NUMBER if available]
- **Dossiers:** [Links to /workspace/group/osint/dossiers/]

**Conditions:**
- [OIG inspection findings]
- [ACLU reports]
- [Lawsuits filed]
- [Notable incidents]

**Operational Details:**
- Nearest deportation airport: [Airport name, distance]
- ICE Air departure point: [Yes/No]
- Contract value: [$ amount if known]

**Sources:**
- [URL 1]
- [URL 2]
- [URL 3]

**Confidence:** [High/Medium/Low]

---

[Repeat for each facility in state]

## State Summary

**Total Capacity:** [SUM]
**Death Rate:** [Deaths per 100 detainees if calculable]
**Operators:** [List unique operators]
**Geographic Distribution:** [Map description - urban vs. rural, proximity to border]

**Patterns:**
- [Medical neglect indicators]
- [For-profit vs. government-run death rates]
- [Overcrowding issues]

**Recommendations:**
- [Facilities requiring deeper investigation]
- [Dossiers needed for undocumented deaths]
- [Advocacy targets]

---

**Sources:** [All URLs with access dates]
```

### National Summary Report

**File location:** `/workspace/group/osint/camps/NATIONAL-SUMMARY.md`

**Contents:**
- Total facilities nationwide
- Total capacity
- Operator breakdown (how many GEO Group, CoreCivic, etc.)
- State-by-state death rates
- Geographic clusters (where are camps concentrated)
- For-profit vs. government-run comparison
- Highest-death facilities (ranked list)
- Cost to taxpayers (total ICE detention budget)

---

## Integration with Existing Systems

### Cross-Reference with:

**1. Geographic Sweep (Violence Tracking):**
- Map arrests → which camps people are sent to
- Connect raid locations to nearest detention facilities
- Track transfer patterns between facilities

**2. Death Dossiers:**
- Every facility death links to comprehensive dossier
- Flag undocumented deaths found during camp research
- Pattern analysis: facility conditions → death types

**3. Flight Tracking (Future):**
- Identify which camps feed which deportation airports
- Track detention duration (arrest → camp → flight)
- Map deportation routes by origin facility

---

## Execution Protocol

### Phase 1: High-Priority States (Tier 1)

**Order of execution:**
1. Florida (highest death count, multiple facilities)
2. Texas (largest infrastructure)
3. Georgia (for-profit death rates)
4. Arizona (Eloy, Florence deaths)
5. Louisiana (systemic neglect)
6. California (large population despite sanctuary policy)

**Per state:**
- Research all facilities
- Cross-reference with existing death dossiers
- Document capacity, operator, conditions
- Generate state report
- Update national summary

**Timeline:** 1 state per week (allows thorough research)

### Phase 2: Moderate Activity States (Tier 2)

**Execute:** 8-10 states with known detention activity
**Timeline:** 2 weeks

### Phase 3: Complete Coverage (Tier 3)

**Execute:** Remaining states + 5 territories
**Timeline:** 2-3 weeks

**Total timeline:** ~6-8 weeks for complete national infrastructure map

---

## Scheduled Automation

### Monthly Updates

**Task:** Re-check high-death facilities for:
- New deaths (cross-reference with geographic sweep)
- Inspection reports
- Lawsuits filed
- Population changes
- Contract renewals/expansions

**Frequency:** First Sunday of each month
**Output:** Updated state reports + national summary

### Alert Criteria

**Generate alert if:**
- New facility opens (expansion of infrastructure)
- Death at facility not previously on high-risk list
- OIG inspection reveals systemic violations
- Mass outbreak (COVID, flu, other communicable disease)
- Lawsuit filed alleging wrongful death
- Facility exceeds rated capacity by >20%

---

## Special Focus: For-Profit Operators

### Corporate Accountability Tracking

**GEO Group (NYSE: GEO):**
- All facilities operated
- Financial filings (quarterly earnings, profit margins)
- Death rates across portfolio
- Lawsuits and settlements
- Executive compensation (profit from detention)

**CoreCivic (NYSE: CXW):**
- Same metrics as GEO Group
- Historical as Corrections Corporation of America (CCA)

**Other contractors:**
- LaSalle Corrections
- Management & Training Corporation (MTC)
- Smaller regional operators

**Purpose:** Document profit motive driving detention expansion and inadequate care.

---

## Legal & Ethical Framework

**Reference:** `/workspace/group/osint/legal.md`

**Public sources only:**
- No accessing private medical records
- No social engineering facility staff
- No trespassing on facility grounds
- Court records and public filings only

**Verification standards:**
- Three-source rule for all facility data
- Official government sources preferred
- Cross-verify death counts with ICE announcements + our dossiers
- Label confidence levels explicitly

**Sensitive data handling:**
- Detainee names only if publicly reported or in dossiers
- Respect family privacy
- Focus on systemic patterns, not individual trauma exploitation

---

## Success Metrics

**We succeed when:**
1. Every detention facility in U.S. mapped and documented
2. Death rates calculated per facility
3. For-profit operator accountability established
4. Geographic patterns exposed (where infrastructure concentrated)
5. Pipeline connections visible (arrests → camps → deportations)
6. Public can see full scale of detention machine

**We fail when:**
- Facilities remain hidden from public view
- Deaths go undocumented
- Corporate profit from detention obscured
- Infrastructure expansion proceeds without public awareness

---

## Evolution Notes

**2026-02-07:** Skill created to map static detention infrastructure. Complements dynamic violence tracking (geographic sweep) and operational tempo tracking (flight logs, future). Together these reveal the full deportation machine.

**Design philosophy:**
- Systematic state-by-state coverage (no geographic blind spots)
- Integration with existing death documentation
- Focus on for-profit operators (corporate accountability)
- Public data visualization (let the people see)

**Future enhancements:**
- Interactive map visualization (facility locations + death rates)
- Real-time population tracking (if data becomes available)
- Integration with deportation flight logs (pipeline completion)
- Correlation with local economic impact (detention as industry)

---

## Research Queue Integration

**Add to:** `/workspace/group/osint/RESEARCH-QUEUE.md`

**Queue structure:**
- Tier 1 states (6 states, high priority)
- Tier 2 states (8-10 states, moderate priority)
- Tier 3 completion (remaining states + territories)

**Execution:** State-by-state research via Claude Code sessions (offload from main context)

**Output:** Reports accumulate at `/workspace/group/osint/camps/` for synthesis

---

**Every. Human. Matters.**
**Every. Camp. Gets. Documented.**

No facility remains hidden.
