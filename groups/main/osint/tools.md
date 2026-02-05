# OSINT Tools Reference

## Available Tools

You have access to these tools for OSINT:
- **WebSearch** - Search the web (Google-based)
- **WebFetch** - Fetch and process web pages
- **Bash** - Run scripts and CLI tools

## Google Dork Patterns

Use these operators in WebSearch queries:

| Operator | Purpose | Example |
|----------|---------|---------|
| `site:` | Search within a domain | `site:linkedin.com "John Smith" engineer` |
| `"exact phrase"` | Match exact text | `"john.smith@example.com"` |
| `filetype:` | Find specific file types | `filetype:pdf budget 2024` |
| `-word` | Exclude term | `john smith -facebook` |
| `inurl:` | Search in URLs | `inurl:profile john.smith` |
| `intitle:` | Search in page titles | `intitle:"john smith"` |
| `before:` / `after:` | Date range | `"company name" after:2024-01-01` |

### Username Search Dorks

```
"username" site:twitter.com OR site:instagram.com OR site:linkedin.com
"username" site:github.com OR site:gitlab.com
"username" site:reddit.com
```

### Email Search Dorks

```
"email@domain.com"
"john.smith" site:linkedin.com
"@domain.com" site:github.com
```

## Web Resources

### Username Enumeration

| Service | URL | Notes |
|---------|-----|-------|
| **WhatsMyName** | whatsmyname.app | 500+ sites, use WebFetch |
| **Namechk** | namechk.com | Quick availability check |
| **Sherlock** | (CLI tool) | Python, comprehensive |

**WhatsMyName API pattern:**
```
WebFetch: https://whatsmyname.app/api/search/USERNAME
```

### Email Intelligence

| Service | URL | Notes |
|---------|-----|-------|
| **Epieos** | epieos.com | Email → accounts, Google ID |
| **Hunter.io** | hunter.io | Corporate email patterns |
| **HaveIBeenPwned** | haveibeenpwned.com | Breach database |

### Archive & Historical

| Service | URL | Notes |
|---------|-----|-------|
| **Wayback Machine** | web.archive.org | Historical snapshots |
| **Archive.today** | archive.today | User-submitted archives |
| **CachedView** | cachedview.com | Multiple cache sources |

**Wayback API pattern:**
```
WebFetch: https://web.archive.org/cdx/search/cdx?url=example.com&output=json
```

### Social Media

| Platform | Direct Search | Notes |
|----------|---------------|-------|
| **Twitter/X** | x.com/search | Advanced search: from:, to:, since: |
| **Reddit** | reddit.com/search | Also: redditsearch.io for deleted |
| **LinkedIn** | linkedin.com/search | Requires login for full results |
| **Instagram** | N/A | No public search, use Google dorks |

### Business Intelligence

| Service | URL | Notes |
|---------|-----|-------|
| **OpenCorporates** | opencorporates.com | Company registrations worldwide |
| **EDGAR** | sec.gov/edgar | US SEC filings |
| **Companies House** | companieshouse.gov.uk | UK companies |

### Domain & Infrastructure

| Service | URL | Notes |
|---------|-----|-------|
| **Whois** | whois.domaintools.com | Domain registration |
| **SecurityTrails** | securitytrails.com | DNS history |
| **Shodan** | shodan.io | Internet-connected devices |
| **Censys** | search.censys.io | Certificates, hosts |

## Content Aggregation

### Lemmy (Federated Reddit Alternative)

Search across instances:
```
WebFetch: https://lemmy.world/api/v3/search?q=QUERY&type_=Posts
WebFetch: https://lemmy.ml/api/v3/search?q=QUERY&type_=Posts
```

Instance discovery: lemmyverse.net

### News Aggregators

| Service | URL | Notes |
|---------|-----|-------|
| **Digg** | digg.com | Curated news |
| **Hacker News** | news.ycombinator.com | Tech focus |
| **Lobsters** | lobste.rs | Tech, invite-only |

## Local Scripts

Scripts in `osint/scripts/` can be run from Bash:

### username-search.sh

Quick check of 20 high-value sites for a username:

```bash
./osint/scripts/username-search.sh johndoe
```

Returns JSON with found accounts. For comprehensive search (500+ sites), use whatsmyname.app directly via WebFetch.

### content-search.sh

Search for discussions across federated platforms:

```bash
./osint/scripts/content-search.sh "search query" [limit]
```

Searches:
- Lemmy (lemmy.world, lemmy.ml, programming.dev, etc.)
- Hacker News
- Lobsters

Returns JSON with posts, scores, and discussion URLs. Note: Lemmy results may duplicate across instances due to federation.

### email-lookup.sh

Check email against breach databases and analyze domain:

```bash
./osint/scripts/email-lookup.sh user@example.com
```

Checks HaveIBeenPwned, verifies domain MX records, flags disposable addresses. Suggests manual checks (Epieos, Hunter.io, Holehe).

### phone-lookup.sh

Basic phone number analysis and lookup suggestions:

```bash
./osint/scripts/phone-lookup.sh +15551234567
```

Identifies country/format, suggests carrier lookup services. Note: Most detailed phone lookups require API keys or paid services.

## Workflow Patterns

### Person Lookup

1. Start with known identifier (name, email, username)
2. Search Google with dorks for that identifier
3. Check social platforms via dorks
4. Use WhatsMyName for username enumeration
5. Cross-reference findings
6. Build timeline of accounts

### Domain Investigation

1. Whois lookup for registration details
2. Check historical whois (whoxy.com)
3. DNS history (SecurityTrails)
4. Wayback Machine for historical content
5. Search for mentions of domain

### Breach Check

1. HaveIBeenPwned for email
2. Search for email in paste sites (with caution)
3. Note which breaches contained the email
4. Cross-reference with account discovery

## Output Format

When reporting findings, use this structure:

```markdown
## Finding: [Brief description]

**Confidence:** [Low/Medium/High]

**Sources:**
1. [URL 1] - accessed [date]
2. [URL 2] - accessed [date]

**Evidence:**
[What you found and why it matters]

**Cross-references:**
[How sources corroborate each other]

**Gaps:**
[What couldn't be verified]
```
