# Pattern: Extract Entities

Extract structured entities from unstructured text.

## When to Use

- Processing scraped web pages
- Analyzing documents or articles
- Building dossiers from raw text

## Process

Given text content, extract and categorize:

### People
- Full names
- Aliases/usernames
- Titles/roles
- Contact info (email, phone)

### Organizations
- Company names
- Government agencies
- NGOs/nonprofits
- Groups/teams

### Locations
- Addresses
- Cities/countries
- Coordinates (if present)
- Venue names

### Digital Identifiers
- Email addresses
- Usernames/handles
- URLs/domains
- IP addresses
- Social media profiles

### Dates & Times
- Specific dates
- Date ranges
- Relative times ("last week")

### Financial
- Dollar amounts
- Account numbers
- Transaction IDs

## Output Format

```json
{
  "people": [
    {"name": "...", "role": "...", "contact": "..."}
  ],
  "organizations": [
    {"name": "...", "type": "..."}
  ],
  "locations": [
    {"place": "...", "context": "..."}
  ],
  "identifiers": {
    "emails": [],
    "usernames": [],
    "urls": [],
    "phones": []
  },
  "dates": [
    {"date": "...", "context": "..."}
  ],
  "financial": [],
  "other": []
}
```

## Notes

- Include context for why each entity appears
- Flag uncertain extractions
- Note relationships between entities
