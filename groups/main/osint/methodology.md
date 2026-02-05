# OSINT Methodology

## The OSINT Cycle

Every investigation follows this cycle:

```
1. DEFINE      → What exactly are we looking for?
2. COLLECT     → Gather raw data from multiple sources
3. PROCESS     → Clean, normalize, structure the data
4. ANALYZE     → Find patterns, connections, anomalies
5. VERIFY      → Cross-reference, check provenance
6. DOCUMENT    → Record methodology, sources, confidence
7. REPORT      → Present findings with evidence chain
```

## Verification Techniques (Bellingcat Style)

### The Three-Source Rule

Never report a finding based on a single source. Aim for:
- **Minimum:** 2 independent sources
- **Confident:** 3+ sources
- **High confidence:** Sources from different platforms/types

### Source Evaluation

Rate each source on:
- **Provenance:** Where did this come from? Can you trace it?
- **Corroboration:** Do other sources support this?
- **Timeliness:** Is this current or outdated?
- **Bias:** Does the source have motivation to mislead?

### Cross-Platform Verification

If you find a claim on Twitter:
1. Search for the same claim on other platforms
2. Look for the original source
3. Check if "confirmations" are just re-shares of the same source
4. Reverse image search any photos

### Chronolocation & Geolocation

For images/videos:
- **Shadows:** Sun angle indicates time of day and rough latitude
- **Landmarks:** Distinctive buildings, signs, natural features
- **Signage:** Language, store names, street signs
- **Weather:** Cross-reference with historical weather data
- **Metadata:** EXIF data if available (often stripped)

### Red Flags

Be suspicious when:
- Only one source exists for a claim
- Source appeared recently with no history
- Claim is emotionally charged but lacks specifics
- Image quality is suspiciously low (hiding manipulation)
- Account has unusual follower/following patterns

## Documentation Standards

Always record:
- **Query:** Exact search terms used
- **Source URL:** Full URL (use archive.org if ephemeral)
- **Timestamp:** When you accessed it
- **Screenshot:** If the content might disappear
- **Confidence level:** Low/Medium/High with reasoning

## Confidence Levels

| Level | Meaning | Evidence Required |
|-------|---------|-------------------|
| **Low** | Possible but unverified | Single source, unconfirmed |
| **Medium** | Likely accurate | 2+ sources, some corroboration |
| **High** | Confident | 3+ independent sources, verified |
| **Confirmed** | Factual | Official records, direct evidence |

## Common Pitfalls

1. **Confirmation bias:** Seeking only evidence that supports your theory
2. **Single-source dependency:** Treating one detailed source as definitive
3. **Circular sourcing:** Multiple articles citing each other
4. **Outdated information:** Old data presented as current
5. **Assuming authenticity:** Screenshots and documents can be faked
