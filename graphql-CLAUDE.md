# CLAUDE.md — mortui-vivos-docent Intelligence Platform

## Mission Context

This project is a political accountability and counter-surveillance intelligence platform. It tracks state actors, government agencies, enforcement operations, detention infrastructure, and their human impact. The work is adversarial journalism and civil rights documentation, not criminal activity.

You are building and maintaining this system. Approach every task with the assumption that accuracy, source provenance, and epistemic honesty are non-negotiable. A wrong assertion about a real person has real consequences. Every claim must be traceable to a source.

---

## Repository Structure

```
/
├── CLAUDE.md                  ← you are here
├── db/
│   ├── schema/                ← Neo4j GraphQL schema definitions (.graphql)
│   ├── migrations/            ← Cypher migration scripts, numbered sequentially
│   ├── seeds/                 ← Seed data and import scripts
│   └── queries/               ← Named Cypher queries used by build pipeline
├── ingest/
│   ├── importers/             ← Per-source-type ingest scripts
│   ├── extractors/            ← Document parsing, OCR processing
│   └── review/                ← Staged entities pending human confidence review
├── build/
│   ├── generators/            ← Scripts that query Neo4j and emit Hugo content
│   └── templates/             ← Data templates for generated frontmatter
├── site/
│   ├── content/               ← Hugo content (largely generated, some hand-authored)
│   ├── layouts/               ← Hugo templates
│   ├── static/                ← Static assets
│   ├── i18n/                  ← Translation strings (ar, es, fa, fr + en)
│   └── hugo.toml              ← Hugo config
├── docker-compose.yml         ← Neo4j + GraphQL API stack
└── Makefile                   ← Canonical task runner
```

---

## Tech Stack

### Database
**Neo4j Community Edition** — self-hosted, single node, no clustering required at current scale.

Run via Docker. Data directory must be on a named volume, never a bind mount to a path that could be accidentally deleted.

GraphQL API layer: **neo4j-graphql-js** or the Neo4j GraphQL Library (`@neo4j/graphql`). The GraphQL schema is the source of truth for the data model — generate Cypher from it, not the reverse.

The Neo4j browser and Bolt port (7687) must **never** be exposed outside localhost or a VPN. There is no exception to this.

### Static Site
**Hugo** — generates the public-facing site from content files produced by the build pipeline.

The public site is read-only. No user input, no server-side logic, no dynamic queries at runtime. The GraphQL API is a private build tool, not a public endpoint.

### Build Pipeline
A set of scripts in `build/generators/` that:
1. Query Neo4j via GraphQL or direct Cypher
2. Render Hugo markdown files with structured frontmatter
3. Trigger `hugo build`

This pipeline is the bridge between the private intelligence database and the public site.

### Languages / Runtime
- Python 3.11+ for ingest, extraction, and build scripts
- Node.js for the GraphQL layer
- Go (Hugo binary only — do not write Go)
- Shell/Makefile for orchestration

---

## Core Data Model

### Guiding Principles

**Relationships are first-class.** In Neo4j, a relationship is not a join table — it is an entity with its own properties. Every significant assertion lives on a relationship, not just a node.

**Every assertion carries provenance.** Nothing enters the database as bare fact. Every relationship between nodes includes:
- `confidence`: Float 0.0–1.0
- `confidence_method`: Enum — `DIRECT` | `CORROBORATED` | `INFERRED` | `UNVERIFIED`
- `sources`: Array of source IDs
- `asserted_at`: DateTime
- `last_verified`: DateTime (nullable)
- `notes`: String (nullable)

**Entities are extensible.** The schema is not closed. New node types and relationship types will be added as the investigation evolves. Design for extension, not completeness.

---

### Node Types

#### Person
Individuals — enforcement agents, government officials, political representatives, contractors, victims, witnesses.

```graphql
type Person {
  id: ID! @id
  slug: String! @unique
  full_name: String
  known_aliases: [String]
  role: String
  badge_number: String
  employee_id: String
  agency_id: String
  physical_description: String
  notes: String
  status: PersonStatus  # ACTIVE | INACTIVE | DECEASED | UNKNOWN
  created_at: DateTime @timestamp(operations: [CREATE])
  updated_at: DateTime @timestamp(operations: [UPDATE])
  
  # Relationships
  affiliated_with: [Organization!]! @relationship(type: "AFFILIATED_WITH", direction: OUT, properties: "AffiliationProperties")
  involved_in: [Incident!]! @relationship(type: "INVOLVED_IN", direction: OUT, properties: "AssertionProperties")
  identified_by: [Source!]! @relationship(type: "IDENTIFIED_BY", direction: OUT, properties: "AssertionProperties")
  transported_on: [Flight!]! @relationship(type: "TRANSPORTED_ON", direction: OUT, properties: "AssertionProperties")
  detained_at: [Facility!]! @relationship(type: "DETAINED_AT", direction: OUT, properties: "DetentionProperties")
}
```

#### Organization
Government agencies, enforcement units, contractors, political entities, advocacy groups.

```graphql
type Organization {
  id: ID! @id
  slug: String! @unique
  name: String!
  abbreviation: String
  org_type: OrgType  # FEDERAL_AGENCY | STATE_AGENCY | CONTRACTOR | POLITICAL | NGO | UNKNOWN
  jurisdiction: String
  parent_org_id: String
  budget_line: String
  notes: String

  parent_organization: Organization @relationship(type: "SUBSIDIARY_OF", direction: OUT)
  subsidiary_organizations: [Organization!]! @relationship(type: "SUBSIDIARY_OF", direction: IN)
  members: [Person!]! @relationship(type: "AFFILIATED_WITH", direction: IN, properties: "AffiliationProperties")
  involved_in: [Incident!]! @relationship(type: "RESPONSIBLE_FOR", direction: OUT, properties: "AssertionProperties")
  operates: [Facility!]! @relationship(type: "OPERATES", direction: OUT, properties: "AssertionProperties")
}
```

#### Incident
Enforcement operations, sweeps, raids, arrests, deportations, acts of violence, administrative actions.

```graphql
type Incident {
  id: ID! @id
  slug: String! @unique
  incident_type: IncidentType  # SWEEP | ARREST | DEPORTATION | DETENTION | VIOLENCE | POLICY_ACTION | OTHER
  title: String
  description: String
  occurred_at: DateTime
  occurred_at_precision: DatePrecision  # EXACT | DATE | MONTH | YEAR | APPROXIMATE
  location: Location
  victim_count: Int
  status: IncidentStatus  # CONFIRMED | ALLEGED | DISPUTED | RETRACTED

  subjects: [Person!]! @relationship(type: "INVOLVED_IN", direction: IN, properties: "AssertionProperties")
  perpetrators: [Person!]! @relationship(type: "PERPETRATED_BY", direction: OUT, properties: "AssertionProperties")
  responsible_orgs: [Organization!]! @relationship(type: "RESPONSIBLE_FOR", direction: IN, properties: "AssertionProperties")
  sourced_from: [Source!]! @relationship(type: "SOURCED_FROM", direction: OUT, properties: "AssertionProperties")
  occurred_at_facility: Facility @relationship(type: "OCCURRED_AT", direction: OUT)
  related_flights: [Flight!]! @relationship(type: "RELATED_TO", direction: OUT)
}
```

#### Source
Primary source documents. Every assertion must link to at least one source.

```graphql
type Source {
  id: ID! @id
  slug: String! @unique
  source_type: SourceType  # FOIA | COURT_FILING | MEDIA | WITNESS | LEAKED | OFFICIAL | SOCIAL_MEDIA | OTHER
  title: String
  url: String
  archive_url: String       # always archive, original URLs disappear
  publication_date: DateTime
  author: String
  outlet: String
  reliability: SourceReliability  # HIGH | MEDIUM | LOW | UNKNOWN
  obtained_by: String
  file_path: String         # local path if document is stored in repo
  notes: String
  hash: String              # SHA256 of document content for integrity verification
}
```

#### Flight
Deportation and transfer flights — tail numbers, routes, manifests.

```graphql
type Flight {
  id: ID! @id
  slug: String! @unique
  tail_number: String
  flight_number: String
  operator: String
  aircraft_type: String
  origin: String
  destination: String
  departed_at: DateTime
  arrived_at: DateTime
  passenger_count: Int
  charter_contractor: String
  notes: String

  passengers: [Person!]! @relationship(type: "TRANSPORTED_ON", direction: IN, properties: "AssertionProperties")
  contracted_by: [Organization!]! @relationship(type: "CONTRACTED_BY", direction: OUT, properties: "AssertionProperties")
  related_incidents: [Incident!]! @relationship(type: "RELATED_TO", direction: IN)
  sourced_from: [Source!]! @relationship(type: "SOURCED_FROM", direction: OUT, properties: "AssertionProperties")
}
```

#### Facility
Detention centers, processing facilities, concentration camps, staging areas.

```graphql
type Facility {
  id: ID! @id
  slug: String! @unique
  name: String!
  common_names: [String]
  facility_type: FacilityType  # ICE_DETENTION | CBP_HOLDING | PRIVATE_PRISON | MILITARY | CONVERTED | TENT_CAMP | OTHER
  address: String
  location: Location
  capacity: Int
  current_population: Int
  population_updated_at: DateTime
  operator: String
  contractor: String
  status: FacilityStatus  # ACTIVE | CLOSED | PLANNED | RUMORED
  opened_at: DateTime
  closed_at: DateTime
  notes: String

  operated_by: [Organization!]! @relationship(type: "OPERATES", direction: IN, properties: "AssertionProperties")
  detained_persons: [Person!]! @relationship(type: "DETAINED_AT", direction: IN, properties: "DetentionProperties")
  incidents: [Incident!]! @relationship(type: "OCCURRED_AT", direction: IN)
  sourced_from: [Source!]! @relationship(type: "SOURCED_FROM", direction: OUT, properties: "AssertionProperties")
}
```

#### PoliticalActor
Elected officials, appointees, policy makers — distinct from generic Person to capture electoral and legislative data.

```graphql
type PoliticalActor {
  id: ID! @id
  slug: String! @unique
  full_name: String!
  title: String
  party: String
  jurisdiction: String
  district: String
  chamber: String           # HOUSE | SENATE | STATE_HOUSE | STATE_SENATE | EXECUTIVE | JUDICIAL | OTHER
  term_start: DateTime
  term_end: DateTime
  status: PoliticalStatus   # CURRENT | FORMER | CANDIDATE | APPOINTED
  contact_info: String
  notes: String

  affiliated_with: [Organization!]! @relationship(type: "AFFILIATED_WITH", direction: OUT, properties: "AffiliationProperties")
  authored_policy: [Policy!]! @relationship(type: "AUTHORED", direction: OUT, properties: "AssertionProperties")
  involved_in: [Incident!]! @relationship(type: "INVOLVED_IN", direction: OUT, properties: "AssertionProperties")
  identified_by: [Source!]! @relationship(type: "IDENTIFIED_BY", direction: OUT, properties: "AssertionProperties")
}
```

---

### Relationship Property Types

```graphql
interface AssertionProperties @relationshipProperties {
  confidence: Float!          # 0.0 - 1.0
  confidence_method: String!  # DIRECT | CORROBORATED | INFERRED | UNVERIFIED
  sources: [String!]!         # Source IDs
  asserted_at: DateTime!
  last_verified: DateTime
  notes: String
}

interface AffiliationProperties @relationshipProperties {
  confidence: Float!
  confidence_method: String!
  sources: [String!]!
  asserted_at: DateTime!
  role: String
  start_date: DateTime
  end_date: DateTime
  notes: String
}

interface DetentionProperties @relationshipProperties {
  confidence: Float!
  confidence_method: String!
  sources: [String!]!
  asserted_at: DateTime!
  admitted_at: DateTime
  released_at: DateTime
  detention_basis: String
  notes: String
}
```

---

## Confidence Scoring Guide

When setting confidence values, use these as reference points:

| Score | Method | Meaning |
|-------|--------|---------|
| 0.95–1.0 | DIRECT | Official document, on-record statement, court filing |
| 0.80–0.94 | CORROBORATED | Multiple independent sources agree |
| 0.60–0.79 | CORROBORATED | Two sources, possible shared origin |
| 0.40–0.59 | INFERRED | Logical inference from confirmed facts |
| 0.20–0.39 | UNVERIFIED | Single unverified source, plausible but unconfirmed |
| 0.0–0.19 | UNVERIFIED | Rumor, single anonymous source, no corroboration |

**Never round up confidence.** When uncertain, go lower.

---

## Ingest Workflow

When processing new source material:

1. Create a `Source` node first. Every subsequent assertion links back to it.
2. Extract entities (persons, organizations, locations, etc.)
3. Check for existing nodes by slug, alias, badge number, or other identifiers before creating new ones. Deduplication is critical.
4. Stage ambiguous or low-confidence entities in `ingest/review/` as YAML files for human review before committing to the database.
5. Set `confidence_method: UNVERIFIED` and confidence ≤ 0.4 for anything not yet reviewed.
6. Run deduplication check after any bulk ingest.

### Deduplication Rules
- Persons: match on (full_name + agency) OR badge_number OR employee_id
- Organizations: match on name OR abbreviation within same jurisdiction
- Incidents: match on (incident_type + location + date within 48h)
- Flights: match on tail_number + departure datetime (within 2h window)

When a potential duplicate is found, do not auto-merge. Create a `POSSIBLE_DUPLICATE_OF` relationship with confidence score and flag for review.

---

## Build Pipeline

The `build/generators/` scripts query Neo4j and produce Hugo content files. Each generator handles one content type.

### Generator Contract
Every generator script must:
1. Accept `--dry-run` flag that outputs to stdout instead of writing files
2. Accept `--slug <value>` to regenerate a single entity
3. Write files to `site/content/<type>/<slug>/index.md`
4. Embed full structured data as Hugo frontmatter (YAML)
5. Log how many files were written/skipped/errored

### Public Site Rules
The public site intentionally shows **less** than the database contains:

- Never expose raw confidence scores — use qualitative labels (Confirmed, Alleged, Unverified)
- Never expose source reliability ratings directly
- Never expose internal IDs or database slugs in URLs if they reveal operational structure
- Redact personally identifying information for victims unless they have consented to publication
- Pending/review-staged entities are never published

---

## Hugo Site Structure

The site is multilingual: `en` (default), `es`, `ar`, `fa`, `fr`.

Content types map to database entity types:
- `dossiers/` → Person + PoliticalActor profiles
- `incidents/` → Incident records
- `reports/` → Aggregated analytical reports (hand-authored, referencing database entities)
- `victims/` → Victim profiles (consent-gated, redacted by default)
- `sweeps/` → Incident collections grouped by operation
- `data/` → Downloadable datasets exported from the database
- `foia/` → Source documents (FOIA type)
- `cabinet/` → PoliticalActor profiles for appointed officials
- `infrastructure/` → Facility profiles
- `alerts/` → Time-sensitive incident notifications
- `violence/` → Incident records of type VIOLENCE

---

## Security & Operational Rules

1. **Neo4j is never exposed to the internet.** Bolt (7687) and HTTP (7474) are localhost only. No exceptions.
2. **The GraphQL API is a build tool, not a public endpoint.** It runs on localhost during build and is stopped afterward.
3. **No tracking, analytics, or third-party scripts on the public site.** None. Not even self-hosted analytics unless explicitly decided.
4. **All external URLs must be archived** (archive.org or archive.ph) before being stored. URLs disappear; archives don't.
5. **Document hashes must be stored** for all locally stored source files. Verify on ingest.
6. **Git history may be subpoenaed.** Do not commit real names of confidential sources, operational security details, or anything that could identify a protected witness into the repository.
7. **Secrets** (Neo4j credentials, API keys) live in `.env` only. `.env` is in `.gitignore`. Never commit secrets.
8. **The database volume must be backed up** before any migration. Backup script lives at `db/migrations/backup.sh`.

---

## Makefile Targets

Always use the Makefile as the canonical interface for common operations:

```
make db-start          # Start Neo4j container
make db-stop           # Stop Neo4j container  
make db-backup         # Backup database volume to ./backups/
make db-migrate        # Run pending migration scripts
make ingest FILE=path  # Run ingest pipeline on a file
make review            # List entities staged for review
make build             # Run all generators + hugo build
make build-dry         # Dry run all generators (no file writes)
make serve             # hugo server for local preview
make deploy            # rsync site/public/ to VPS
```

---

## Adding New Entity Types

When the schema needs a new node type:

1. Define it in `db/schema/` as a `.graphql` file
2. Write a Cypher migration in `db/migrations/` (numbered, e.g. `004_add_vehicle.cypher`)
3. Create a generator script in `build/generators/`
4. Add a corresponding Hugo content type and layout
5. Update this CLAUDE.md schema section
6. Update the ingest pipeline to recognize the new type

Do not silently extend existing node types to absorb things that deserve their own type. A Vehicle is not a Person property. A Policy is not an Incident.

---

## Tone and Editorial Standards

This platform documents real harm to real people. The writing in generated content must be:

- **Precise** — say what is known, not what is assumed
- **Attributed** — every claim should be traceable
- **Calibrated** — use language that reflects confidence level ("allegedly", "according to", "confirmed by")
- **Humane** — victims are human beings, not data points

When generating public-facing content, prefer "alleged" or "according to [source]" over declarative statements for anything below confidence 0.8.

---

## Current Migration State

Track completed migrations here as they are applied:

- [ ] `001_initial_schema.cypher` — core node types and constraints
- [ ] `002_indexes.cypher` — full-text and composite indexes
- [ ] `003_seeds.cypher` — initial data import from existing markdown files

---

## Open Questions / Decisions Pending

- [ ] Choose GraphQL library: `@neo4j/graphql` vs custom Cypher-direct approach
- [ ] Decide on i18n strategy for generated content (translate frontmatter? separate generator runs per language?)
- [ ] Determine victim consent/publication workflow
- [ ] Evaluate whether Wikibase-style qualifier model is needed for relationship properties or if current approach is sufficient
- [ ] Decide on backup/sync strategy for database volume (encrypted remote backup)
