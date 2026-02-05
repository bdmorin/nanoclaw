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

**Search dossiers:**
```bash
./osint/scripts/search-dossiers.sh "keyword"
```

**List all:**
```bash
ls -lt /workspace/group/osint/dossiers/
```
