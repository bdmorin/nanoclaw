# Pattern: Timeline Events

Extract and chronologically order events from text or research findings.

## When to Use

- Reconstructing sequence of events
- Understanding how a situation developed
- Creating case chronologies

## Process

### 1. Extract Events
From your sources, identify:
- Explicit dated events
- Relative time references ("two weeks later")
- Implied sequences ("after the meeting")

### 2. Normalize Dates
Convert all dates to consistent format:
- ISO format preferred: YYYY-MM-DD
- For approximate dates: "~2024-03" or "early 2024"
- For ranges: "2024-01 to 2024-03"

### 3. Add Context
For each event, note:
- What happened
- Who was involved
- Where it occurred
- Source of information
- Confidence level

### 4. Identify Gaps
Note periods with no data:
- Are these genuine gaps in activity?
- Missing documentation?
- Deliberately obscured?

### 5. Cross-Reference
Check for inconsistencies:
- Do sources agree on timing?
- Any anachronisms?
- Logical impossibilities?

## Output Format

```markdown
# Timeline: [Subject/Topic]

## Period: [Start Date] to [End Date]

| Date | Event | Source | Confidence |
|------|-------|--------|------------|
| 2024-01-15 | [Event description] | [Source URL] | High |
| ~2024-02 | [Approximate event] | [Source] | Medium |
| 2024-03-01 | [Event] | [Multiple sources] | High |

## Narrative

[Prose summary connecting the events]

## Key Milestones
1. **[Date]**: [Milestone 1]
2. **[Date]**: [Milestone 2]

## Gaps & Uncertainties
- **[Date range]**: No information available
- **[Date]**: Conflicting accounts

## Sources
1. [Source with dates provided]
2. [Source with dates provided]
```

## Tips

- Work backwards from known dates
- Use anchor events (holidays, known public events) to estimate
- Social media timestamps can establish activity patterns
- Email timestamps are generally reliable
- News articles often have publication but not event dates
