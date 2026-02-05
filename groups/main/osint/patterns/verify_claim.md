# Pattern: Verify Claim

Cross-reference and fact-check a specific claim.

## When to Use

- Verifying information before reporting
- Fact-checking social media posts
- Validating research findings

## Process

### 1. State the Claim
Write out the exact claim being verified.

### 2. Identify Testable Elements
Break the claim into specific, verifiable components:
- Names (do these people exist?)
- Dates (did this happen when claimed?)
- Places (does this location match?)
- Events (is there evidence this occurred?)
- Quotes (did this person say this?)

### 3. Find Independent Sources
For each testable element, search for:
- Primary sources (official records, direct witnesses)
- Secondary sources (news coverage, documentation)
- Counter-sources (opposing viewpoints)

**Minimum:** 2 independent sources per key element
**Ideal:** 3+ sources from different source types

### 4. Check Source Quality
For each source, evaluate:
- **Provenance:** Where did this come from?
- **Independence:** Is it just citing another source?
- **Bias:** Does the source have motivation to mislead?
- **Timeliness:** Is this current or outdated?

### 5. Assess Consistency
Do sources agree or conflict? Note:
- Points of agreement
- Points of disagreement
- Unexplained gaps

### 6. Render Verdict

| Verdict | Criteria |
|---------|----------|
| **Confirmed** | 3+ independent, high-quality sources agree |
| **Likely True** | 2+ sources support, no credible counter-evidence |
| **Unverified** | Insufficient evidence either way |
| **Disputed** | Credible sources disagree |
| **Likely False** | Counter-evidence outweighs supporting evidence |
| **False** | Clear evidence contradicts the claim |

## Output Format

```markdown
## Claim
[The exact claim being verified]

## Verdict: [CONFIRMED/LIKELY TRUE/UNVERIFIED/DISPUTED/LIKELY FALSE/FALSE]

## Evidence

### Supporting
1. [Source 1] - [URL] - [What it says]
2. [Source 2] - [URL] - [What it says]

### Contradicting
1. [Source] - [URL] - [What it says]

### Unable to Verify
- [Element] - [Why it couldn't be verified]

## Confidence: [Low/Medium/High]

## Methodology
[How you conducted the verification]

## Limitations
[What couldn't be checked, potential blind spots]
```
