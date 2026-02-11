# Matrix Bot Credentials

**⚠️ SECURITY: This file contains sensitive credentials. Do not commit to public repositories.**

---

## Bot Account: @oilclothbot:hexxa.dev

**Purpose:** LLM agent integration with Matrix homeserver

### Login Credentials

```
Matrix ID: @oilclothbot:hexxa.dev
Username: oilclothbot
Password: SecureBot123
Homeserver: hexxa.dev
API Base URL: https://matrix.hexxa.dev
```

### Access Token

```
Access Token: syt_b2lsY2xvdGhib3Q_TWXrvCgtAevgDNWMczEW_3CC1W9
Device ID: KJKOJHPHZO
```

**Token expires:** Never (unless explicitly revoked)

### API Authentication Example

```bash
curl -X GET 'https://matrix.hexxa.dev/_matrix/client/v3/sync' \
  -H 'Authorization: Bearer syt_b2lsY2xvdGhib3Q_TWXrvCgtAevgDNWMczEW_3CC1W9'
```

### Python Usage Example

```python
import requests

BASE_URL = "https://matrix.hexxa.dev"
ACCESS_TOKEN = "syt_b2lsY2xvdGhib3Q_TWXrvCgtAevgDNWMczEW_3CC1W9"

headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json"
}

# Sync to get messages
response = requests.get(f"{BASE_URL}/_matrix/client/v3/sync", headers=headers)
print(response.json())
```

---

## Alternative Bot Account: @oilcloth:hexxa.dev

**Status:** Created but login has issues due to password special characters

```
Matrix ID: @oilcloth:hexxa.dev
Username: oilcloth
Status: Use @oilclothbot instead
```

---

## Security Notes

1. **Store token securely**
   - Use environment variables: `export MATRIX_BOT_TOKEN="syt_..."`
   - Use secrets manager in production
   - Never commit to git

2. **Token rotation** (if needed)
   - Log in again to get a new token
   - Old tokens remain valid until explicitly revoked

3. **Revoking access**
   - Admin can disable the bot user account
   - Or delete all bot devices via admin API

4. **Monitoring**
   - Track bot login attempts
   - Monitor API rate limits
   - Log all bot actions

---

## Quick Test

Verify the bot can authenticate:

```bash
curl -s 'https://matrix.hexxa.dev/_matrix/client/v3/account/whoami' \
  -H 'Authorization: Bearer syt_b2lsY2xvdGhib3Q_TWXrvCgtAevgDNWMczEW_3CC1W9' | jq '.'
```

**Expected response:**
```json
{
  "user_id": "@oilclothbot:hexxa.dev",
  "device_id": "KJKOJHPHZO"
}
```

---

**Created:** 2026-02-10
**Homeserver:** hexxa.dev (Synapse v1.147.0)
