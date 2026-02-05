# OSINT Dossiers

Permanent storage for completed OSINT investigations.

## Structure

Each investigation gets its own folder:

```
dossiers/
├── 2026-02-05_alex-pretti/
│   ├── report.md           # Main findings
│   ├── timeline.md         # Chronological events
│   ├── sources.md          # All URLs with timestamps
│   ├── media/              # Screenshots, archived pages
│   ├── analysis/           # Fabric AI analysis (auto-generated)
│   │   ├── claims_analysis.md
│   │   ├── extraordinary_claims.md
│   │   ├── insights.md
│   │   └── personality.md  # (type-specific)
│   └── metadata.json       # Searchable metadata
├── templates/
│   ├── person.md           # Template for person investigations
│   ├── organization.md     # Template for company/org research
│   └── incident.md         # Template for event investigations
└── index.md                # Searchable index of all dossiers
```

## Naming Convention

`YYYY-MM-DD_subject-name/`

Examples:
- `2026-02-05_alex-pretti/`
- `2026-02-10_acme-corp/`
- `2026-02-15_data-breach-incident/`

## Metadata Schema

Each dossier includes `metadata.json`:

```json
{
  "id": "2026-02-05_alex-pretti",
  "subject": "Alex Pretti",
  "type": "person|organization|incident|domain|other",
  "created": "2026-02-05T02:44:00Z",
  "updated": "2026-02-05T02:44:00Z",
  "status": "active|completed|archived",
  "confidence": "low|medium|high",
  "tags": ["legal", "minnesota", "ice", "federal-agents"],
  "summary": "Brief one-line description",
  "sources_count": 17,
  "related_dossiers": []
}
```

## Usage

**Create new dossier:**
```bash
./osint/scripts/create-dossier.sh "Subject Name" "type"
```

**Analyze dossier with fabric:**
```bash
./osint/scripts/analyze-dossier.sh /workspace/group/osint/dossiers/2026-02-05_alex-pretti
```

This runs type-appropriate fabric patterns:
- **All types**: `analyze_claims`, `extract_extraordinary_claims`, `extract_insights`
- **Person**: + `analyze_personality`, `extract_predictions`
- **Organization**: + `analyze_risk`
- **Incident**: + `create_threat_scenarios`

**Analyze any content:**
```bash
./osint/scripts/analyze-content.sh analyze_claims < article.txt
./osint/scripts/analyze-content.sh analyze_personality interview.txt
```

**List all:**
```bash
ls -lt /workspace/group/osint/dossiers/
```

## Fabric Patterns for OSINT

| Pattern | Use Case |
|---------|----------|
| `analyze_claims` | Verify claims, rate truthfulness |
| `extract_extraordinary_claims` | Flag conspiracy/misinfo for extra verification |
| `analyze_personality` | Psychological profile from content |
| `extract_predictions` | Track predictions vs reality |
| `analyze_email_headers` | Phishing/fraud email investigation |
| `create_threat_scenarios` | Threat modeling |
| `extract_references` | Map who subject cites/follows |
