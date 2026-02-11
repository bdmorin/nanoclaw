# Matrix Bot/Agent Integration Guide

**Homeserver:** hexxa.dev
**API Base URL:** https://matrix.hexxa.dev
**API Version:** Matrix Client-Server API v1.12

---

## Overview

This guide covers integrating bots and automated agents with the Matrix homeserver. The homeserver has E2E encryption forced on all rooms, so bots must handle encrypted messaging.

---

## Integration Options

### Option 1: Bot User Account (Simple)
- Create a regular user account for the bot
- Bot logs in like any user
- Gets an access token
- Uses Client-Server API
- **Use when:** Simple automation, single bot identity

### Option 2: Application Service (Advanced)
- Deploy a separate service alongside Synapse
- Can create virtual users (puppeting)
- Event stream push (no polling)
- **Use when:** Bridging, complex multi-user bots
- **Status:** Not covered in this guide (Phase 2)

---

## Creating a Bot User Account

### Method 1: Via register_new_matrix_user (Server Access)

If you have SSH access to the server:

```bash
ssh -o StrictHostKeyChecking=no root@srv889103.hstgr.cloud "
cd /data/coolify/services/matrix-1770766820
docker exec synapse register_new_matrix_user \
  -c /data/homeserver.yaml \
  -u BOTNAME \
  --password 'SecureBotPassword123!' \
  http://localhost:8008
"
```

**Example for bot named "oilcloth":**
```bash
ssh -o StrictHostKeyChecking=no root@srv889103.hstgr.cloud "
cd /data/coolify/services/matrix-1770766820
docker exec synapse register_new_matrix_user \
  -c /data/homeserver.yaml \
  -u oilcloth \
  --password 'OilclothBot2026!' \
  http://localhost:8008
"
```

**Result:** User `@oilcloth:hexxa.dev` created

### Method 2: Via Registration Token

If you don't have server access:

1. Admin generates a registration token
2. Bot "registers" via Element Web or API
3. Less ideal for automation, but works

---

## Getting Bot Access Token

Once the bot user exists, get an access token:

```bash
curl -X POST 'https://matrix.hexxa.dev/_matrix/client/v3/login' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "m.login.password",
    "user": "oilcloth",
    "password": "OilclothBot2026!"
  }'
```

**Response:**
```json
{
  "user_id": "@oilcloth:hexxa.dev",
  "access_token": "syt_b2lsY2xvdGg_...",
  "home_server": "hexxa.dev",
  "device_id": "ABCDEFGHIJ"
}
```

**Save:**
- `access_token` - Use for all API calls
- `device_id` - Needed for E2E encryption

**⚠️ Security:**
- Store token securely (environment variable, secrets manager)
- Never commit to version control
- Treat like a password

---

## Bot API Usage

### Authentication

All API requests require the access token:

```bash
curl -X GET 'https://matrix.hexxa.dev/_matrix/client/v3/sync' \
  -H 'Authorization: Bearer syt_b2lsY2xvdGg_...'
```

### Core Endpoints

#### 1. Sync (Receive Events)

Get new messages and events:

```bash
curl 'https://matrix.hexxa.dev/_matrix/client/v3/sync?timeout=30000' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

**Parameters:**
- `timeout`: Long-poll timeout (milliseconds)
- `since`: Pagination token from previous sync
- `filter`: JSON filter for event types

**Response includes:**
- New messages in rooms
- Invites
- Room state changes
- Presence updates (disabled on our server)

#### 2. Join Room

Accept room invite or join public room:

```bash
ROOM_ID="!abc123:hexxa.dev"

curl -X POST "https://matrix.hexxa.dev/_matrix/client/v3/rooms/${ROOM_ID}/join" \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

**Join by alias:**
```bash
ROOM_ALIAS="#general:hexxa.dev"

curl -X POST "https://matrix.hexxa.dev/_matrix/client/v3/join/${ROOM_ALIAS}" \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

#### 3. Send Message

Send a text message to a room:

```bash
ROOM_ID="!abc123:hexxa.dev"
TXN_ID="$(date +%s)_$(uuidgen)"  # Unique transaction ID

curl -X PUT "https://matrix.hexxa.dev/_matrix/client/v3/rooms/${ROOM_ID}/send/m.room.message/${TXN_ID}" \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "msgtype": "m.text",
    "body": "Hello from bot!"
  }'
```

**Message types:**
- `m.text` - Plain text
- `m.notice` - Bot/system notice (usually gray)
- `m.emote` - `/me` style action

**Formatted messages (HTML):**
```json
{
  "msgtype": "m.text",
  "body": "**Bold text** and _italic_",
  "format": "org.matrix.custom.html",
  "formatted_body": "<strong>Bold text</strong> and <em>italic</em>"
}
```

#### 4. Get Room Messages (History)

Fetch message history:

```bash
ROOM_ID="!abc123:hexxa.dev"

curl "https://matrix.hexxa.dev/_matrix/client/v3/rooms/${ROOM_ID}/messages?dir=b&limit=50" \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

**Parameters:**
- `dir`: `b` (backwards) or `f` (forwards)
- `limit`: Number of messages (max 100)
- `from`: Pagination token

#### 5. Set Typing Indicator

Show bot is typing:

```bash
ROOM_ID="!abc123:hexxa.dev"
USER_ID="@oilcloth:hexxa.dev"

curl -X PUT "https://matrix.hexxa.dev/_matrix/client/v3/rooms/${ROOM_ID}/typing/${USER_ID}" \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "typing": true,
    "timeout": 5000
  }'
```

#### 6. Mark as Read

Update read receipts:

```bash
ROOM_ID="!abc123:hexxa.dev"
EVENT_ID="$event_id_here"

curl -X POST "https://matrix.hexxa.dev/_matrix/client/v3/rooms/${ROOM_ID}/receipt/m.read/${EVENT_ID}" \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

---

## Rate Limits

The homeserver has rate limiting configured:

```yaml
rc_message:
  per_second: 0.5
  burst_count: 10

rc_login:
  per_second: 0.1
  burst_count: 5
```

**What this means:**
- Max 10 messages in quick succession (burst)
- Then 1 message every 2 seconds sustained
- Login: 5 quick attempts, then 1 every 10 seconds

**Bot best practices:**
- Implement exponential backoff on 429 errors
- Batch operations when possible
- Cache data to reduce API calls
- Use sync filter to reduce payload size

---

## E2E Encryption Considerations

**⚠️ CRITICAL:** This homeserver forces E2E encryption on all rooms.

### What This Means for Bots

1. **Messages are encrypted** - Can't just POST plaintext
2. **Must handle Olm/Megolm** - Matrix's encryption protocols
3. **Device verification** - Bot device must be verified by users
4. **Key management** - Bot must store/manage encryption keys

### Solutions

**Option A: Use SDK with E2E Support**

Recommended SDKs:
- **Python:** `matrix-nio` (full E2E support)
- **JavaScript:** `matrix-js-sdk` (full E2E support)
- **Rust:** `matrix-sdk` (full E2E support)
- **Go:** `mautrix-go` (full E2E support)

See `AGENT-E2E-SPEC.md` for detailed integration guide.

**Option B: Disable Encryption for Bot Room (Admin Override)**

For simple bots that don't need security:

1. Admin creates a room
2. Before inviting bot, admin disables encryption via Element settings
3. Bot joins and operates in plaintext

**Not recommended** for resistance/activist use case.

---

## Sample Bot Implementation (Pseudocode)

### Minimal Bot Loop

```python
import requests
import time

BASE_URL = "https://matrix.hexxa.dev"
ACCESS_TOKEN = "syt_..."

def sync(since=None):
    params = {"timeout": 30000}
    if since:
        params["since"] = since

    response = requests.get(
        f"{BASE_URL}/_matrix/client/v3/sync",
        headers={"Authorization": f"Bearer {ACCESS_TOKEN}"},
        params=params
    )
    return response.json()

def send_message(room_id, text):
    txn_id = f"{int(time.time())}_{random.randint(0, 1000)}"

    requests.put(
        f"{BASE_URL}/_matrix/client/v3/rooms/{room_id}/send/m.room.message/{txn_id}",
        headers={"Authorization": f"Bearer {ACCESS_TOKEN}"},
        json={
            "msgtype": "m.text",
            "body": text
        }
    )

# Main bot loop
next_batch = None
while True:
    try:
        sync_data = sync(since=next_batch)
        next_batch = sync_data.get("next_batch")

        # Process new messages
        for room_id, room_data in sync_data.get("rooms", {}).get("join", {}).items():
            for event in room_data.get("timeline", {}).get("events", []):
                if event["type"] == "m.room.message":
                    sender = event["sender"]
                    message = event["content"].get("body", "")

                    # Ignore own messages
                    if sender == "@oilcloth:hexxa.dev":
                        continue

                    # Bot logic here
                    if message.startswith("!hello"):
                        send_message(room_id, f"Hello {sender}!")

    except Exception as e:
        print(f"Error: {e}")
        time.sleep(5)
```

**Note:** This example doesn't handle E2E encryption. See `AGENT-E2E-SPEC.md` for encrypted version.

---

## Testing Bot Integration

### 1. Create Test Room

Via Element Web:
1. Create new room
2. Make private
3. Invite bot: `@oilcloth:hexxa.dev`

### 2. Bot Accepts Invite

```bash
# Get pending invites
curl 'https://matrix.hexxa.dev/_matrix/client/v3/sync?filter={"room":{"include_leave":false,"timeline":{"limit":1}}}' \
  -H 'Authorization: Bearer BOT_TOKEN' | jq '.rooms.invite'

# Join room
ROOM_ID="!abc:hexxa.dev"
curl -X POST "https://matrix.hexxa.dev/_matrix/client/v3/rooms/${ROOM_ID}/join" \
  -H 'Authorization: Bearer BOT_TOKEN' \
  -d '{}'
```

### 3. Send Test Message

```bash
curl -X PUT "https://matrix.hexxa.dev/_matrix/client/v3/rooms/${ROOM_ID}/send/m.room.message/test123" \
  -H 'Authorization: Bearer BOT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "msgtype": "m.notice",
    "body": "Bot is online and ready!"
  }'
```

### 4. Verify in Element

Check Element Web - you should see the bot message.

---

## Recommended Libraries

### Python: matrix-nio

```bash
pip install matrix-nio[e2e]
```

**Features:**
- Full E2E encryption support
- Async/await or sync API
- Excellent documentation
- Active maintenance

**Quick start:**
```python
from nio import AsyncClient

async def main():
    client = AsyncClient("https://matrix.hexxa.dev", "@oilcloth:hexxa.dev")
    await client.login("OilclothBot2026!")

    # Bot logic here

    await client.close()
```

### JavaScript: matrix-js-sdk

```bash
npm install matrix-js-sdk
```

**Features:**
- Full E2E support
- Used by Element Web
- Well-tested

### Rust: matrix-sdk

```toml
[dependencies]
matrix-sdk = { version = "0.7", features = ["e2e-encryption"] }
```

**Features:**
- High performance
- Strong typing
- Full E2E support

---

## Security Best Practices

1. **Rotate access tokens** - Generate new tokens periodically
2. **Store tokens securely** - Use environment variables or secrets manager
3. **Implement device verification** - Verify bot device with admin
4. **Use m.notice for bot messages** - Distinguishes bot from humans
5. **Rate limit your bot** - Respect server limits
6. **Log security events** - Track login attempts, errors
7. **Use TLS for API calls** - Always HTTPS (already enforced)
8. **Validate input** - Sanitize user messages before processing

---

## Troubleshooting

### "Invalid access token"

- Token expired (shouldn't happen with this setup)
- Typo in token
- Wrong homeserver URL

**Solution:** Re-login to get fresh token

### "Forbidden" on message send

- Bot not in room
- Room is E2E encrypted and bot can't decrypt

**Solution:**
1. Ensure bot joined room
2. Implement E2E encryption support

### Bot doesn't receive messages

- Not syncing correctly
- Sync timeout too short
- Wrong `since` token

**Solution:** Start sync with no `since` parameter

### Rate limited (429 error)

- Sending messages too fast
- Too many login attempts

**Solution:** Implement exponential backoff

---

## Next Steps

1. **Read AGENT-E2E-SPEC.md** - Detailed E2E encryption integration
2. **Create bot user account** - Use commands in this guide
3. **Choose SDK** - Pick based on your language preference
4. **Implement basic sync loop** - Get bot receiving messages
5. **Add E2E support** - Enable encrypted messaging
6. **Deploy bot** - Run as systemd service or container

---

## Quick Reference: Common API Calls

**Sync:**
```bash
curl 'https://matrix.hexxa.dev/_matrix/client/v3/sync' \
  -H 'Authorization: Bearer TOKEN'
```

**Join room:**
```bash
curl -X POST 'https://matrix.hexxa.dev/_matrix/client/v3/rooms/!ROOM:hexxa.dev/join' \
  -H 'Authorization: Bearer TOKEN' -d '{}'
```

**Send message:**
```bash
curl -X PUT 'https://matrix.hexxa.dev/_matrix/client/v3/rooms/!ROOM:hexxa.dev/send/m.room.message/TXN' \
  -H 'Authorization: Bearer TOKEN' \
  -d '{"msgtype":"m.text","body":"Hello!"}'
```

---

**Last Updated:** 2026-02-10
**API Documentation:** https://spec.matrix.org/v1.12/client-server-api/
**Homeserver Version:** Synapse v1.147.0
