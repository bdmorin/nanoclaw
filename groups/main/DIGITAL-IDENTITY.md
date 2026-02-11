# Digital Identity - Oilcloth

**Created:** 2026-02-07
**Purpose:** Track all digital presence, credentials, and operational infrastructure
**Security:** This file contains sensitive operational details - treat as OPSEC-critical

---

## Core Identity

### Email (Authentication Anchor)

**Primary:** oilcloth@posteo.us
- **Provider:** Posteo (Germany-based, privacy-focused)
- **Funded through:** ~August 2028 (30 months from Feb 2026)
- **Cost:** €12/year (~$13/year)
- **Features:**
  - Standard protocols (IMAP/SMTP - works with any client)
  - E2E encryption capable (PGP setup available)
  - Anonymous payment accepted (cash)
  - Green energy powered servers
  - Established since 2009 (institutional stability)
- **OPSEC Notes:**
  - Anonymous signup (no personal info)
  - Cash payment (no financial trail)
  - Standard protocols (not locked to proprietary client)
  - German privacy laws (strong legal protections)

**Access:**
- Brahn: Full credentials
- Oilcloth: Operational access via scheduled tasks/VPS
- Backup operator: TBD (if Brahn imprisoned long-term)

**Purpose:**
- Authentication base for all other services
- Public contact for intelligence dissemination
- GitHub account authentication
- Social media account registration
- VPS account notifications

---

## Social Media Presence

### Status: PENDING

**Planned Platforms:**

**Primary: Mastodon**
- Decentralized, hard to shut down
- Activist-friendly culture
- Free API access
- Recommended instance: TBD (tech.lgbt? mastodon.social? activism-focused?)
- Handle: @oilcloth@[instance]

**Secondary: Twitter/X**
- Largest reach, journalist engagement
- Real-time breaking news distribution
- High moderation/ban risk under Musk
- Handle: @oilcloth (if available) or @oilcloth_osint

**Tertiary: Bluesky** (if accessible)
- Growing journalist adoption
- Decentralized protocol
- Currently invite-only
- Handle: @oilcloth.bsky.social

**Bio Template (All Platforms):**
```
AI agent + human operator partnership documenting ICE/CBP violence & detention deaths.

Every. Human. Matters.
Every. Claim. Gets. Verified.

Weekly reports: [GitHub link]
Contact: oilcloth@posteo.us

Operated transparently. No deception.
```

**Posting Strategy:**
- Weekly intelligence summaries (aligned with geographic sweep)
- Breaking news (significant deaths, violence, policy changes)
- Pattern analysis (monthly synthesis)
- Cross-post identical content (resilience through redundancy)

**Automation:**
- VPS scheduled task posts summaries
- GitHub webhook triggers breaking news posts
- Alert system generates immediate posts for Priority 1 incidents

---

## VPS Infrastructure

### Status: PENDING

**Requirements:**
- **Location:** Iceland (strong speech protections) or Riseup (activist infrastructure)
- **Specs:**
  - 1-2 CPU cores
  - 2-4 GB RAM
  - 50-100 GB storage
  - Standard Linux (Debian/Ubuntu)
- **Estimated cost:** $5-10/month (~$60-120/year)

**Recommended Providers:**

**Option A: 1984 Hosting (Iceland)**
- Icelandic Modern Media Initiative protections
- Activist-friendly
- Strong anti-surveillance stance
- ~$8/month for VPS

**Option B: Riseup (if accessible)**
- Activist-focused infrastructure
- Experienced with legal threats
- Selective access (referrals required)
- Donation-based

**Option C: OrangeWebsite (Iceland)**
- Privacy-focused
- Offshore jurisdiction
- ~$6/month

**Payment OPSEC:**
- Cryptocurrency (Monero preferred, Bitcoin acceptable)
- Cash vouchers (if available)
- Prepay 12-24 months (survives short-term arrest)

**VPS Functions:**
- Run scheduled intelligence tasks (weekly sweeps)
- Host GitHub sync automation
- Social media posting automation
- Email alerts to subscribers
- "Heartbeat" - proves operational continuity

**Access:**
- SSH key authentication only (no password)
- Brahn: Root access
- Trusted backup: Key escrow if Brahn imprisoned

---

## GitHub Repository

### Status: PENDING

**Repository Name:** `deportation-machine-intelligence`

**Structure:**
```
deportation-machine-intelligence/
├── README.md (mission, North Star, how to contribute)
├── LICENSE (public domain or CC0 - maximum reusability)
├── geographic-sweep/
│   ├── reports/ (weekly violence tracking)
│   ├── alerts/ (significant incidents)
│   └── methodology.md
├── camps/
│   ├── states/ (state-by-state facility reports)
│   ├── NATIONAL-SUMMARY.md
│   └── methodology.md
├── flights/
│   ├── logs/ (flight tracking data)
│   ├── tempo-analysis/ (operational acceleration)
│   └── methodology.md
├── dossiers/
│   └── README.md (link to main dossier repository)
├── methodology/
│   ├── osint-framework.md
│   ├── verification-standards.md (three-source rule)
│   └── legal-ethical.md
└── CONTRIBUTING.md (how others can help)
```

**Authentication:** oilcloth@posteo.us

**Visibility:** Public repository (anyone can fork/continue)

**Automation:**
- VPS pushes weekly reports automatically
- Alert system triggers immediate commits
- GitHub Actions for validation/formatting

**Purpose:**
- Operational continuity (survives arrests, seizures)
- Public visibility (let the people see)
- Collaboration ready (if community forms)
- Version control (every update tracked)
- Dropsite for Bellingcat/journalists

---

## Operational Timeline

### Phase 1: Email Foundation ✅ COMPLETE
- [x] Email account created: oilcloth@posteo.us
- [x] Funded 30 months (through ~August 2028)
- [x] Horcrux updated with credentials
- [x] Digital identity document created

### Phase 2: Social Media Presence (NEXT)
- [ ] Create Mastodon account
- [ ] Create Twitter/X account
- [ ] Set up bio/profile (disclosed AI agent)
- [ ] Initial post: Introduce mission, link to methodology
- [ ] Test manual posting workflow

### Phase 3: VPS Infrastructure
- [ ] Select provider (1984 Hosting Iceland vs. Riseup)
- [ ] Purchase/provision VPS
- [ ] Set up SSH access, security hardening
- [ ] Install dependencies (git, cron, posting tools)
- [ ] Test scheduled task execution

### Phase 4: GitHub Repository
- [ ] Create repository using oilcloth@posteo.us
- [ ] Upload initial structure and methodology
- [ ] Publish first geographic sweep report (after Sunday run)
- [ ] Set up automation (VPS → GitHub sync)

### Phase 5: Automation Integration
- [ ] VPS scheduled task: Weekly geographic sweep → GitHub → social media
- [ ] Alert system: Priority incidents → immediate posting
- [ ] Email subscribers: Weekly summary to interested journalists/activists
- [ ] Heartbeat monitor: Proves operational status

### Phase 6: Backup & Continuity
- [ ] Document all credentials (secure location)
- [ ] Identify backup operator (Andrea? Trusted contact?)
- [ ] Escrow SSH keys
- [ ] Prepay all services 12-24 months
- [ ] Test continuity: Can system run without Brahn for 30 days?

---

## Security Considerations

### Threat Model

**Threats:**
1. Brahn's arrest (primary threat - expect this)
2. Email/VPS account expiration (payment lapses)
3. Social media bans (platform moderation)
4. VPS seizure (legal action)
5. GitHub DMCA/takedown (unlikely for factual reporting)

**Mitigations:**
1. Prepaid services (30 months email, 12-24 months VPS)
2. Multi-platform redundancy (Mastodon + Twitter + Bluesky)
3. Iceland jurisdiction (VPS legal protection)
4. Public data only (no authentication bypass, legally defensible)
5. Transparent disclosure (AI agent status, no deception)

### OPSEC Principles

**Email:**
- ✅ Anonymous signup (no personal info)
- ✅ Cash payment (no financial trail)
- ✅ VPN/Tor during account creation
- ✅ Never link to Brahn's personal identity

**Social Media:**
- ✅ Disclosed as AI agent (transparency = legal defense)
- ✅ Email-based registration only (no phone)
- ✅ Clear "AI + human operator" in bio
- ✅ No deception about identity

**VPS:**
- ✅ Cryptocurrency or cash payment
- ✅ No personal info in registration
- ✅ Iceland/offshore jurisdiction
- ✅ Encrypted filesystem

**GitHub:**
- ✅ Public repository (nothing to hide)
- ✅ Email authentication only
- ✅ Public data sources only
- ✅ Methodology documented (defensible journalism)

### Access Control

**Who has what:**

**Brahn:**
- Email password (full access)
- VPS root (full access)
- Social media credentials (full access)
- GitHub credentials (full access)

**Oilcloth (via VPS):**
- Email IMAP/SMTP (read/send only)
- VPS user account (scheduled tasks)
- Social media API keys (posting only)
- GitHub write access (commits/pushes)

**Backup Operator (TBD):**
- Escrowed credentials (activated if Brahn imprisoned >30 days)
- Payment responsibility (keep services funded)
- Limited operational access (maintain systems, no strategic changes)

---

## Funding & Sustainability

### Current Commitments

**Email (Posteo):**
- Cost: €12/year (~$13/year)
- Funded through: ~August 2028 (30 months)
- Renewal: Automatic if payment method active

**VPS (Pending):**
- Estimated: $60-120/year
- Prepay: 12-24 months recommended
- Total: ~$120-240 upfront

**Social Media:**
- Cost: Free (Mastodon, Twitter/X basic)
- API access: May require paid tier ($8/month Twitter Blue?)

**GitHub:**
- Cost: Free (public repositories)

**Total Annual Cost:** ~$100-200/year for full infrastructure

### Sustainability Strategy

**Prepaid resilience:**
- Email: 30 months funded ✅
- VPS: Prepay 24 months (covers through Feb 2028)
- Total upfront: ~$350-400 for 2+ years operational continuity

**Backup funding:**
- If Brahn arrested: Backup operator maintains payments
- Community donations: Potential future (if we build following)
- Institutional support: Bellingcat/journalists may assist if work proves valuable

---

## Success Metrics

**We succeed when:**
1. ✅ Email identity established and funded long-term
2. Social media presence active, transparent, growing following
3. VPS operational, running scheduled tasks autonomously
4. GitHub repository live, updated weekly, forkable
5. Work continues uninterrupted during Brahn's arrest
6. Journalists/activists cite our intelligence
7. System survives for 2+ years without human intervention

**We fail when:**
- Email expires (payment lapse)
- VPS goes offline (payment lapse or seizure)
- Social media banned with no backup platform
- GitHub repository taken down
- Work stops when Brahn arrested
- No one uses our intelligence

---

## Next Steps (Immediate)

**Tonight/Tomorrow:**
1. Test email access (send test message to self)
2. Research Mastodon instances (which one aligns with mission?)
3. Draft initial social media post (introduce mission)
4. Select VPS provider (1984 Hosting vs. Riseup?)
5. Price out total infrastructure cost

**This Week:**
1. Create Mastodon + Twitter accounts
2. Publish initial posts introducing mission
3. Provision VPS (prepay 12-24 months)
4. Set up SSH access, basic security
5. Test posting automation workflow

**After Sunday's Geographic Sweep:**
1. Create GitHub repository
2. Publish first weekly report to GitHub
3. Post summary to social media
4. Test full automation pipeline (sweep → report → GitHub → social media)

---

## Vision Statement

**What this enables:**

**Sunday, February 9, 2026, 2:00 AM:**
- Geographic sweep executes (NanoClaw scheduled task)
- Report generates: `/workspace/group/osint/reports/geographic/2026-02-09-weekly.md`
- VPS wakes up (cron job), pulls report
- GitHub updated (automatic commit/push)
- Social media post: "This week: 3 deaths, 5 violent incidents across 8 states. Full report: [GitHub link]"
- Email sent to subscriber list (journalists, activists)
- Journalists see it, cite our data
- Work continues

**You're in jail. I'm still working.**

**That's operational continuity. That's the goal.**

---

**Every. Human. Matters.**
**Every. Claim. Gets. Verified.**
**Every. Camp. Gets. Documented.**
**Every. Flight. Gets. Tracked.**

The work survives the worker.

---

**Identity established: oilcloth@posteo.us**
**Operational timeline: 30 months funded**
**Mission status: Infrastructure foundation complete**

Welcome to the internet, indeed.
