# Matrix E2E Encryption Integration Spec for LLM Agents

**Target Audience:** LLM agents implementing Matrix bot integration
**Homeserver:** hexxa.dev (Synapse v1.147.0)
**Security Requirement:** E2E encryption is FORCED on all rooms
**Recommended SDK:** matrix-nio (Python) with E2E support

---

## Overview

This homeserver **requires E2E encryption** for all rooms. Bots cannot operate without implementing encryption support. This spec provides a complete guide for LLM agents to integrate Matrix E2E encryption using the `matrix-nio` library.

---

## Why E2E Encryption Matters

### What is Matrix E2E Encryption?

Matrix uses **Olm** and **Megolm** encryption protocols:

- **Olm:** 1-to-1 encrypted messaging (based on Signal's Double Ratchet)
- **Megolm:** Group encrypted messaging (optimized for rooms)

### What This Means for Bots

1. **Messages are encrypted** before sending to server
2. **Server cannot read messages** (end-to-end security)
3. **Each device has unique keys** (device verification required)
4. **Bots must manage encryption state** (keys, sessions, device lists)

### Security Properties

✅ **Forward secrecy** - Past messages stay secure if keys compromised
✅ **Device verification** - Users can verify bot's identity
✅ **Perfect forward secrecy** - Each message uses unique keys (Olm)
✅ **Cryptographic deniability** - Cannot prove who sent a message

---

## Prerequisites

### Bot Account

You need a bot user account with access token. See `BOT-CREDENTIALS.md`.

**For this guide:**
```
Matrix ID: @oilclothbot:hexxa.dev
Access Token: syt_b2lsY2xvdGhib3Q_TWXrvCgtAevgDNWMczEW_3CC1W9
Device ID: KJKOJHPHZO
```

### Python Environment

```bash
pip install matrix-nio[e2e]
```

**Dependencies installed:**
- `matrix-nio` - Matrix client library
- `python-olm` - Olm encryption (via libolm)
- `peewee` - Database for key storage
- `cachetools` - Caching
- `aiofiles` - Async file I/O

---

## Architecture Overview

### Components

1. **AsyncClient** - Main Matrix client with E2E support
2. **Store** - Persistent storage for encryption keys
3. **Encryption** - Handles Olm/Megolm operations
4. **Device verification** - Trust establishment

### Key Storage

The bot MUST persist:
- **Account keys** - Bot's identity keys (Ed25519, Curve25519)
- **Session keys** - Olm sessions with other devices
- **Group session keys** - Megolm keys for encrypted rooms
- **Device keys** - Other users' device keys
- **Trust state** - Which devices are verified

**Storage location:** `./bot-store/` directory (SQLite database)

---

## Implementation Guide

### Step 1: Basic Client Setup

```python
from nio import AsyncClient, MatrixRoom, RoomMessageText
import asyncio

# Configuration
HOMESERVER = "https://matrix.hexxa.dev"
USER_ID = "@oilclothbot:hexxa.dev"
ACCESS_TOKEN = "syt_b2lsY2xvdGhib3Q_TWXrvCgtAevgDNWMczEW_3CC1W9"
DEVICE_ID = "KJKOJHPHZO"
STORE_PATH = "./bot-store"

# Create client with E2E support
client = AsyncClient(
    homeserver=HOMESERVER,
    user=USER_ID,
    device_id=DEVICE_ID,
    store_path=STORE_PATH,  # Persistent key storage
)

# Set access token (skip login)
client.access_token = ACCESS_TOKEN
```

### Step 2: Handle Encrypted Messages

```python
from nio import RoomMessageText, MegolmEvent

# Callback for encrypted messages
async def message_callback(room: MatrixRoom, event: RoomMessageText):
    """Handle incoming messages (decrypted automatically)."""
    # Ignore messages from self
    if event.sender == client.user:
        return

    print(f"[{room.display_name}] {event.sender}: {event.body}")

    # Bot logic here
    if event.body.startswith("!hello"):
        await client.room_send(
            room_id=room.room_id,
            message_type="m.room.message",
            content={
                "msgtype": "m.text",
                "body": f"Hello {event.sender}!"
            }
        )

# Callback for failed decryption
async def decryption_failure(room: MatrixRoom, event: MegolmEvent):
    """Handle messages that couldn't be decrypted."""
    print(f"⚠️ Failed to decrypt message in {room.display_name}")
    print(f"Session ID: {event.session_id}")

    # Request keys from other devices
    await client.request_room_key(event)

# Register callbacks
client.add_event_callback(message_callback, RoomMessageText)
client.add_event_callback(decryption_failure, MegolmEvent)
```

### Step 3: Device Verification

For security, users should verify the bot's device keys.

```python
from nio import ToDeviceEvent, KeyVerificationStart

async def verification_callback(event: ToDeviceEvent):
    """Handle incoming device verification requests."""
    if isinstance(event, KeyVerificationStart):
        print(f"Verification request from {event.sender}")

        # Auto-accept verification (for trusted environments)
        # In production, implement proper verification flow
        await client.accept_key_verification(event.transaction_id)

client.add_to_device_callback(verification_callback, KeyVerificationStart)
```

**Manual verification (recommended for admin):**

1. Admin opens Element Web
2. Clicks bot user → "Verify"
3. Compares emoji or number sequence
4. Confirms match

### Step 4: Sending Messages

Messages to encrypted rooms are automatically encrypted:

```python
async def send_message(room_id: str, message: str):
    """Send text message to room (encrypted automatically)."""
    await client.room_send(
        room_id=room_id,
        message_type="m.room.message",
        content={
            "msgtype": "m.notice",  # Bot message (gray in Element)
            "body": message
        }
    )

# Usage
await send_message("!abc123:hexxa.dev", "Bot is online!")
```

**Formatted messages:**

```python
content = {
    "msgtype": "m.text",
    "body": "**Bold** and _italic_",  # Fallback plain text
    "format": "org.matrix.custom.html",
    "formatted_body": "<strong>Bold</strong> and <em>italic</em>"
}

await client.room_send(
    room_id=room_id,
    message_type="m.room.message",
    content=content
)
```

### Step 5: Main Bot Loop

```python
async def main():
    """Main bot event loop."""
    try:
        # Restore session if exists
        if client.should_upload_keys:
            await client.keys_upload()

        # Sync encryption keys
        await client.sync_keys(timeout=30000)

        # Initial sync
        sync_response = await client.sync(timeout=30000)
        print(f"✅ Bot connected: {client.user_id}")

        # Main loop
        while True:
            # Long-poll sync
            sync_response = await client.sync(timeout=30000)

            # Sync encryption keys periodically
            if client.should_upload_keys:
                await client.keys_upload()

            # Handle events (callbacks process them)
            await asyncio.sleep(0.1)

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await client.close()

# Run bot
if __name__ == "__main__":
    asyncio.run(main())
```

---

## Complete Working Example

```python
#!/usr/bin/env python3
"""
Matrix E2E Encrypted Bot
Uses matrix-nio for full encryption support
"""

from nio import AsyncClient, MatrixRoom, RoomMessageText, MegolmEvent
import asyncio
import os

# Configuration
HOMESERVER = "https://matrix.hexxa.dev"
USER_ID = "@oilclothbot:hexxa.dev"
ACCESS_TOKEN = os.environ.get("MATRIX_BOT_TOKEN", "syt_b2lsY2xvdGhib3Q_TWXrvCgtAevgDNWMczEW_3CC1W9")
DEVICE_ID = "KJKOJHPHZO"
STORE_PATH = "./bot-store"

# Create client
client = AsyncClient(
    homeserver=HOMESERVER,
    user=USER_ID,
    device_id=DEVICE_ID,
    store_path=STORE_PATH,
)
client.access_token = ACCESS_TOKEN


async def message_callback(room: MatrixRoom, event: RoomMessageText):
    """Process incoming messages."""
    # Ignore own messages
    if event.sender == client.user:
        return

    print(f"[{room.display_name}] {event.sender}: {event.body}")

    # Command: !hello
    if event.body.strip().lower().startswith("!hello"):
        await client.room_send(
            room_id=room.room_id,
            message_type="m.room.message",
            content={
                "msgtype": "m.notice",
                "body": f"👋 Hello {event.sender}! I'm an encrypted bot."
            }
        )

    # Command: !echo [text]
    elif event.body.strip().lower().startswith("!echo "):
        text = event.body[6:]  # Remove "!echo "
        await client.room_send(
            room_id=room.room_id,
            message_type="m.room.message",
            content={
                "msgtype": "m.text",
                "body": text
            }
        )


async def decryption_failure(room: MatrixRoom, event: MegolmEvent):
    """Handle failed decryption."""
    print(f"⚠️ Couldn't decrypt message in {room.display_name}")
    await client.request_room_key(event)


async def main():
    """Main bot loop."""
    print(f"🤖 Starting bot: {USER_ID}")

    # Register callbacks
    client.add_event_callback(message_callback, RoomMessageText)
    client.add_event_callback(decryption_failure, MegolmEvent)

    try:
        # Upload keys if needed
        if client.should_upload_keys:
            print("📤 Uploading encryption keys...")
            await client.keys_upload()

        # Sync encryption state
        print("🔄 Syncing encryption keys...")
        await client.sync_keys(timeout=30000)

        # Initial sync
        print("🔄 Initial sync...")
        await client.sync(timeout=30000)
        print("✅ Bot is online and ready!")

        # Main event loop
        while True:
            await client.sync(timeout=30000)

            # Re-upload keys if needed
            if client.should_upload_keys:
                await client.keys_upload()

            await asyncio.sleep(0.1)

    except KeyboardInterrupt:
        print("\n👋 Shutting down bot...")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await client.close()


if __name__ == "__main__":
    asyncio.run(main())
```

**Save as:** `matrix_bot.py`

**Run:**
```bash
python matrix_bot.py
```

---

## Testing the Bot

### 1. Invite Bot to Room

Via Element Web:
1. Create a new room (E2E encrypted by default)
2. Invite `@oilclothbot:hexxa.dev`
3. Bot will auto-join (if implemented)

### 2. Manual Join (if needed)

```python
# In bot code, accept invites:
async def invite_callback(room: MatrixRoom, event):
    """Auto-join invited rooms."""
    await client.join(room.room_id)

from nio import InviteEvent
client.add_event_callback(invite_callback, InviteEvent)
```

### 3. Test Commands

In Element Web, send:
- `!hello` → Bot responds with greeting
- `!echo test message` → Bot echoes back

### 4. Verify Encryption

- Check for lock icon in room header (Element Web)
- Bot messages should be encrypted (verified by Element showing decryption)

---

## Troubleshooting

### "Unable to decrypt" messages

**Causes:**
- Bot hasn't synced encryption keys
- Missing Megolm session keys
- Bot wasn't in room when message was sent

**Solutions:**
1. Ensure `client.sync_keys()` is called
2. Request keys: `await client.request_room_key(event)`
3. Bot must be in room BEFORE messages are sent

### "Device not verified" warnings

**Cause:** Users haven't verified bot's device

**Solution:**
- Admin verifies bot via Element: User Info → Verify
- Or bot auto-accepts verification requests (less secure)

### Bot crashes on startup

**Causes:**
- Missing `matrix-nio[e2e]` installation
- Corrupted store database
- Invalid access token

**Solutions:**
```bash
# Reinstall with E2E support
pip install --force-reinstall matrix-nio[e2e]

# Delete store (loses encryption state!)
rm -rf ./bot-store

# Verify token
curl -H "Authorization: Bearer $TOKEN" \
  https://matrix.hexxa.dev/_matrix/client/v3/account/whoami
```

### "OLM_UNKNOWN_ACCOUNT" error

**Cause:** Account keys not uploaded

**Solution:**
```python
if client.should_upload_keys:
    await client.keys_upload()
```

---

## Advanced Topics

### Persistent Storage

The `bot-store/` directory contains:
- `bot-store/bot.db` - SQLite database with keys
- `bot-store/bot.db-wal` - Write-ahead log
- `bot-store/bot.db-shm` - Shared memory file

**Backup:**
```bash
# Backup encryption state
tar czf bot-store-backup.tar.gz bot-store/

# Restore
tar xzf bot-store-backup.tar.gz
```

⚠️ **Critical:** If you lose this directory, the bot cannot decrypt old messages.

### Multiple Devices (Same User)

Each bot instance needs unique `device_id`:

```python
# Bot instance 1
client1 = AsyncClient(..., device_id="BOT_INSTANCE_1", store_path="./store1")

# Bot instance 2
client2 = AsyncClient(..., device_id="BOT_INSTANCE_2", store_path="./store2")
```

### Custom Verification

Instead of auto-accepting:

```python
async def manual_verification(event: KeyVerificationStart):
    """Manual device verification with emoji comparison."""
    # Show emoji to admin
    emoji = await client.get_verification_emoji(event.transaction_id)
    print(f"Verify these emoji with admin: {emoji}")

    # Wait for admin confirmation
    confirmed = input("Emojis match? (yes/no): ")
    if confirmed.lower() == "yes":
        await client.confirm_verification(event.transaction_id)
```

### Room Key Sharing

When bot misses messages:

```python
# Request keys from specific device
await client.request_room_key(
    event,
    device_id="TARGET_DEVICE_ID"
)

# Or from all devices in room
for user_id in room.users:
    for device in client.device_store[user_id].values():
        await client.request_room_key(event, device_id=device.id)
```

---

## Security Best Practices

1. **Protect store directory**
   ```bash
   chmod 700 bot-store/
   ```

2. **Secure access token**
   ```python
   # Use environment variable
   ACCESS_TOKEN = os.environ["MATRIX_BOT_TOKEN"]
   ```

3. **Verify devices**
   - Admin should manually verify bot device
   - Don't auto-trust all devices

4. **Rotate tokens periodically**
   - Generate new token every 90 days
   - Logout old devices

5. **Monitor failed decryptions**
   - Log all `MegolmEvent` failures
   - Alert if decryption failure rate > 5%

6. **Backup encryption store**
   - Daily backup of `bot-store/`
   - Store encrypted backups off-server

---

## Performance Considerations

### Sync Optimization

```python
# Use sync filter to reduce bandwidth
sync_filter = {
    "room": {
        "timeline": {"limit": 10},  # Only 10 messages per sync
        "state": {"lazy_load_members": True}  # Don't load all members
    }
}

await client.sync(timeout=30000, sync_filter=sync_filter)
```

### Key Upload Throttling

```python
# Only upload keys when necessary
if client.should_upload_keys:
    await client.keys_upload()
    print("Uploaded keys")
```

### Message Batching

```python
# Send multiple messages efficiently
async def send_batch(room_id: str, messages: list[str]):
    for msg in messages:
        await client.room_send(room_id, "m.room.message", {
            "msgtype": "m.text",
            "body": msg
        })
        await asyncio.sleep(0.5)  # Rate limit compliance
```

---

## API Reference Quick Links

- **matrix-nio docs:** https://matrix-nio.readthedocs.io/
- **Matrix Client-Server API:** https://spec.matrix.org/v1.12/client-server-api/
- **Olm specification:** https://gitlab.matrix.org/matrix-org/olm/
- **Megolm specification:** https://gitlab.matrix.org/matrix-org/olm/blob/master/docs/megolm.md

---

## Summary Checklist

For a working E2E encrypted bot:

- [ ] Install `matrix-nio[e2e]`
- [ ] Create bot user account
- [ ] Get access token and device ID
- [ ] Set up persistent store directory
- [ ] Create AsyncClient with store_path
- [ ] Implement message callback
- [ ] Upload encryption keys on startup
- [ ] Sync keys before main loop
- [ ] Handle decryption failures
- [ ] Verify bot device (admin)
- [ ] Test in encrypted room

---

**Last Updated:** 2026-02-10
**Homeserver:** hexxa.dev (Synapse v1.147.0)
**Tested with:** matrix-nio 0.25.0, Python 3.11+
