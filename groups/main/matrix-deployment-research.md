# Matrix Synapse Deployment Research
## Secure Self-Hosted Communications for a Small Activist Group (5-20 Users)

**Research date:** 2026-02-10
**Synapse latest stable:** v1.145.0 (element-hq/synapse)
**Element Web latest stable:** v1.12.8
**Matrix spec version:** v1.16 (includes Room Version 12 security fixes)

---

## 1. Synapse Docker Deployment

### Docker Images

| Component | Image | Registry |
|-----------|-------|----------|
| Synapse | `ghcr.io/element-hq/synapse:v1.145.0` | GitHub Container Registry |
| Synapse (alt) | `matrixdotorg/synapse:v1.145.0` | Docker Hub |
| PostgreSQL | `postgres:16-alpine` | Docker Hub |
| Element Web | `vectorim/element-web:v1.12.8` | Docker Hub |

**Critical:** Always pin image versions. Never use `:latest` in production.

### docker-compose.yml (Complete Stack)

```yaml
version: "3.8"

services:
  synapse:
    image: ghcr.io/element-hq/synapse:v1.145.0
    container_name: synapse
    restart: unless-stopped
    volumes:
      - ./synapse-data:/data
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-fSs", "http://localhost:8008/health"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 5s
    networks:
      - matrix

  postgres:
    image: postgres:16-alpine
    container_name: synapse-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: synapse
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: synapse
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --lc-collate=C --lc-ctype=C"
    volumes:
      - ./postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U synapse"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - matrix

  element-web:
    image: vectorim/element-web:v1.12.8
    container_name: element-web
    restart: unless-stopped
    volumes:
      - ./element-config.json:/app/config.json:ro
    networks:
      - matrix

  caddy:
    image: caddy:2-alpine
    container_name: caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "8448:8448"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - ./caddy-data:/data
      - ./caddy-config:/config
      - ./well-known:/srv/well-known:ro
    networks:
      - matrix

networks:
  matrix:
    driver: bridge
```

### .env File

```bash
POSTGRES_PASSWORD=CHANGE_ME_GENERATE_RANDOM_64_CHARS
```

### Generate Initial Synapse Config

```bash
docker run -it --rm \
  -v $(pwd)/synapse-data:/data \
  -e SYNAPSE_SERVER_NAME=example.com \
  -e SYNAPSE_REPORT_STATS=no \
  ghcr.io/element-hq/synapse:v1.145.0 generate
```

### homeserver.yaml — Database Section

Replace the default SQLite config with:

```yaml
database:
  name: psycopg2
  args:
    user: synapse
    password: "${POSTGRES_PASSWORD}"
    database: synapse
    host: synapse-postgres
    cp_min: 5
    cp_max: 10
```

**PostgreSQL is mandatory for production.** SQLite performs poorly, especially in rooms with many participants or federated traffic.

### Create Admin User

```bash
docker exec -it synapse register_new_matrix_user \
  -c /data/homeserver.yaml \
  -a -u admin http://localhost:8008
```

---

## 2. Element Web Configuration

### element-config.json

```json
{
    "default_server_config": {
        "m.homeserver": {
            "base_url": "https://matrix.example.com",
            "server_name": "example.com"
        },
        "m.identity_server": {
            "base_url": ""
        }
    },
    "disable_custom_urls": true,
    "disable_guests": true,
    "disable_login_language_selector": false,
    "disable_3pid_login": true,
    "brand": "Resistance Chat",
    "default_theme": "dark",
    "room_directory": {
        "servers": ["example.com"]
    },
    "features": {
        "feature_pinning": "labs",
        "feature_custom_status": "labs"
    },
    "setting_defaults": {
        "breadcrumbs": true
    },
    "jitsi": {
        "preferred_domain": ""
    }
}
```

Key settings for security:
- `disable_custom_urls: true` — prevents users from connecting to other homeservers through the client
- `disable_guests: true` — no anonymous access
- `disable_3pid_login: true` — no email/phone login (reduces metadata leakage)
- Empty identity server — disables identity server lookups (phone/email discovery)

---

## 3. Security Hardening for Activist Use

### 3.1 E2E Encryption — Force ON by Default

In `homeserver.yaml`:

```yaml
# Force encryption on ALL new rooms (not just invite-only)
encryption_enabled_by_default_for_room_type: "all"
```

Values: `"all"`, `"invite"`, `"off"` (must be quoted — PyYAML interprets unquoted `off` as boolean False).

When set to `"all"`, rooms are encrypted regardless of client-side toggle state. This is the correct setting for an activist deployment.

**Cross-signing and key backup** are client-side features handled by Element. They are enabled automatically — no server-side config needed. Starting April 2026, Element will require verified devices to send/receive E2EE messages.

**Recommendation:** On first login, each user should:
1. Set up Security Key (key backup)
2. Cross-sign their devices
3. Verify other group members in-person using QR codes or emoji comparison

### 3.2 Federation: Analysis for Activist Use

| Factor | Federation ON | Federation OFF |
|--------|--------------|----------------|
| Discoverability | Risk: server name visible to federated peers | Server invisible to outside |
| Resilience | Can communicate if one server goes down | Single point of failure |
| Attack surface | Exposed to federation protocol vulns (CVE-2025-49090 etc.) | Minimal attack surface |
| Bridges | Most bridges work without federation | Bridges still work fine |
| Room joins | Can join external rooms | Only local rooms |

**Recommendation for activist group: Disable federation initially.**

```yaml
# Disable federation entirely
federation_domain_whitelist: []

# Or whitelist specific trusted servers only
# federation_domain_whitelist:
#   - trusted-ally.org
#   - another-group.net
```

If federation is needed later, upgrade all rooms to Room Version 12 (fixes CVE-2025-49090 federation vulnerabilities).

Additional federation hardening if enabled:
```yaml
federation_verify_certificates: true
# For Tor hidden services only:
# federation_certificate_verification_whitelist:
#   - "*.onion"
```

### 3.3 Registration: Closed / Invite-Only

```yaml
# Disable open registration
enable_registration: false

# Enable token-based registration (invite codes)
enable_registration: true
registration_requires_token: true

# Optional: require email for account recovery (tradeoff: metadata vs. recovery)
# registrations_require_3pid:
#   - email
```

**Creating invite tokens (Admin API):**

```bash
# Create a single-use token
curl -X POST "https://matrix.example.com/_synapse/admin/v1/registration_tokens/new" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uses_allowed": 1, "length": 16}'

# Create a 5-use token that expires in 7 days
curl -X POST "https://matrix.example.com/_synapse/admin/v1/registration_tokens/new" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uses_allowed": 5, "expiry_time": '$(( ($(date +%s) + 604800) * 1000 ))'}'

# List all tokens
curl "https://matrix.example.com/_synapse/admin/v1/registration_tokens" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Third-party tools for nicer invite UIs:
- [matrix-registration](https://github.com/zeratax/matrix-registration) — generate/share invite tokens with a web UI
- [matrix-invite-panel](https://github.com/refi64/matrix-invite-panel) — web frontend for issuing/revoking invites

### 3.4 Tor / VPN Considerations

**Option A: Tor Hidden Service (Maximum Anonymity)**

```
# /etc/tor/torrc
HiddenServiceDir /var/lib/tor/matrix/
HiddenServicePort 80 127.0.0.1:8008
```

In `homeserver.yaml`:
```yaml
server_name: "yourhiddenchat.onion"
public_baseurl: "http://yourhiddenchat.onion"
serve_server_wellknown: true
listeners:
  - port: 8008
    bind_addresses: ['127.0.0.1']
    type: http
    tls: false
    resources:
      - names: [client, federation]
        compress: false
```

Limitations:
- No WebRTC (no voice/video calls)
- Higher latency
- Clearnet-to-onion federation is limited and experimental
- Users must use Tor Browser or configure their client to use Tor

**Option B: VPN + Clearnet (Recommended Starting Point)**

- Deploy on a VPS paid with cryptocurrency (Monero preferred)
- Register domain through privacy-respecting registrar (Njalla, 1984.is)
- Require all users to connect via VPN (Mullvad, IVPN, or self-hosted WireGuard)
- Use Caddy/nginx with Let's Encrypt for TLS

**Option C: Hybrid**

Run on clearnet with a Tor .onion mirror. Use `.well-known` to advertise the onion address.

### 3.5 Message Retention / Auto-Delete

```yaml
retention:
  enabled: true
  default_policy:
    min_lifetime: 1d
    max_lifetime: 30d    # Auto-purge messages older than 30 days
  allowed_lifetime_min: 1d
  allowed_lifetime_max: 365d
  purge_jobs:
    - longest_max_lifetime: 3d
      interval: 12h       # Purge short-lived room messages every 12 hours
    - shortest_max_lifetime: 3d
      interval: 1d        # Purge longer-lived room messages daily
```

Per-room override (via Element devtools):
- Send state event type `m.room.retention`
- Content: `{"max_lifetime": 86400000}` (24 hours in milliseconds)

**Important limitations:**
- Retention policies do not apply to state events
- Synapse keeps at least one message per room (hidden from clients)
- Only servers with retention support enabled will purge — federated servers may retain messages
- This is experimental (MSC1763, not yet in Matrix spec)

**Manual purge via Admin API:**
```bash
curl -X POST "https://matrix.example.com/_synapse/admin/v1/purge_history/!roomid:example.com" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"purge_up_to_ts": '$(( ($(date +%s) - 2592000) * 1000 ))'}'
```

### 3.6 Rate Limiting and Abuse Prevention

```yaml
# Rate limiting config in homeserver.yaml
rc_message:
  per_second: 0.5
  burst_count: 10

rc_registration:
  per_second: 0.05
  burst_count: 3

rc_login:
  address:
    per_second: 0.1
    burst_count: 5
  account:
    per_second: 0.1
    burst_count: 5
  failed_attempts:
    per_second: 0.05
    burst_count: 3

rc_admin_redaction:
  per_second: 2
  burst_count: 50

# Limit room complexity to prevent resource exhaustion
limit_remote_rooms:
  enabled: true
  complexity: 10.0
  complexity_error: "This room is too complex for this server."

# Disable presence (saves significant CPU)
presence:
  enabled: false
```

**Mjolnir (moderation bot):**
- Docker image: `matrixdotorg/mjolnir`
- Provides ban lists, spam detection, server ACLs, room directory protection
- Critical for any server that may face harassment or raids
- Has a Synapse module variant that applies rules server-wide

### 3.7 Additional Hardening

```yaml
# Disable room directory over federation
room_directory:
  visibility:
    world_readable: false

# Disable user directory for non-local queries
user_directory:
  enabled: true
  search_all_users: false
  prefer_local_users: true

# Disable URL previews (prevents server from making outbound HTTP requests)
url_preview_enabled: false

# Prevent users from changing their display name to impersonate others
# (managed via admin API per-user)

# Prevent server from reporting stats
report_stats: false

# Suppress server version disclosure
# (no built-in toggle, but can be blocked at reverse proxy level)
```

---

## 4. Bridges

### Bridge Architecture Overview

All mautrix bridges follow the same Docker deployment pattern:
1. Pull image from `dock.mau.dev/mautrix/<bridge>`
2. Run once to generate config
3. Edit config (homeserver address, database, etc.)
4. Run again to generate `registration.yaml`
5. Register the appservice in Synapse's `homeserver.yaml`
6. Start the bridge

### 4.1 mautrix-whatsapp (Critical — Current Platform)

```yaml
# In docker-compose.yml, add:
  mautrix-whatsapp:
    image: dock.mau.dev/mautrix/whatsapp:v0.11.3
    container_name: mautrix-whatsapp
    restart: unless-stopped
    volumes:
      - ./mautrix-whatsapp:/data
    depends_on:
      - synapse
    networks:
      - matrix
```

Setup:
```bash
mkdir mautrix-whatsapp && cd mautrix-whatsapp
docker run --rm -v $(pwd):/data:z dock.mau.dev/mautrix/whatsapp:v0.11.3
# Edit config.yaml: set homeserver address to http://synapse:8008
# Edit config.yaml: set homeserver domain to example.com
# Edit config.yaml: set database to postgres
docker run --rm -v $(pwd):/data:z dock.mau.dev/mautrix/whatsapp:v0.11.3
# Copy registration.yaml to synapse-data/appservices/
```

In Synapse `homeserver.yaml`:
```yaml
app_service_config_files:
  - /data/appservices/mautrix-whatsapp-registration.yaml
```

Authentication: User DMs the bridge bot `@whatsappbot:example.com`, sends `login`, scans QR code with phone.

### 4.2 mautrix-signal (Critical — Activists Already on Signal)

```yaml
  mautrix-signal:
    image: dock.mau.dev/mautrix/signal:v0.8.3
    container_name: mautrix-signal
    restart: unless-stopped
    volumes:
      - ./mautrix-signal:/data
    depends_on:
      - synapse
    networks:
      - matrix
```

Authentication: User DMs `@signalbot:example.com`, sends `login`, scans QR code from Signal app's "Linked Devices" screen. Signal app will optionally offer history transfer during pairing.

**Note:** Registering as a primary Signal device is no longer supported directly. Users must have the Signal mobile app.

### 4.3 mautrix-discord (Migration Period)

```yaml
  mautrix-discord:
    image: dock.mau.dev/mautrix/discord:v0.7.5
    container_name: mautrix-discord
    restart: unless-stopped
    volumes:
      - ./mautrix-discord:/data
    depends_on:
      - synapse
    networks:
      - matrix
```

Authentication: DM `@discordbot:example.com`, use `login-qr` (scan with Discord mobile) or `login-token` (paste Discord token).

### 4.4 IRC Bridge

For IRC bridging, the official `matrix-appservice-irc` is available:
- Image: `matrixdotorg/matrix-appservice-irc`
- More complex setup than mautrix bridges
- Primarily useful if connecting to IRC networks like Libera.Chat

### Shared PostgreSQL for Bridges

All bridges can share the same PostgreSQL instance (but NOT the same database):

```yaml
  bridge-postgres:
    image: postgres:16-alpine
    container_name: bridge-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: bridges
      POSTGRES_PASSWORD: ${BRIDGE_DB_PASSWORD}
    volumes:
      - ./bridge-postgres-data:/var/lib/postgresql/data
      - ./init-bridge-dbs.sql:/docker-entrypoint-initdb.d/init.sql:ro
    networks:
      - matrix
```

`init-bridge-dbs.sql`:
```sql
CREATE DATABASE mautrix_whatsapp;
CREATE DATABASE mautrix_signal;
CREATE DATABASE mautrix_discord;
```

---

## 5. Bot / Integration API

### 5.1 Python: matrix-nio (Recommended)

Install: `pip install matrix-nio[e2e]` (includes E2EE support via libolm)

**Minimal bot example:**

```python
import asyncio
from nio import AsyncClient, MatrixRoom, RoomMessageText

HOMESERVER = "https://matrix.example.com"
USER_ID = "@bot:example.com"
PASSWORD = "bot_password"

client = AsyncClient(HOMESERVER, USER_ID, store_path="./nio_store")

async def message_callback(room: MatrixRoom, event: RoomMessageText):
    if event.sender == USER_ID:
        return
    if event.body.startswith("!ping"):
        await client.room_send(
            room_id=room.room_id,
            message_type="m.room.message",
            content={"msgtype": "m.text", "body": "pong"}
        )

async def main():
    resp = await client.login(PASSWORD)
    print(f"Access token: {client.access_token}")  # Save for future use
    client.add_event_callback(message_callback, RoomMessageText)
    await client.sync_forever(timeout=30000)

asyncio.run(main())
```

**Sending a message programmatically (one-shot):**

```python
import asyncio
from nio import AsyncClient

async def send_message(room_id, message):
    client = AsyncClient("https://matrix.example.com", "@bot:example.com")
    client.access_token = "syt_saved_token_here"
    client.user_id = "@bot:example.com"
    client.device_id = "BOTDEVICE"
    await client.room_send(
        room_id=room_id,
        message_type="m.room.message",
        content={"msgtype": "m.text", "body": message}
    )
    await client.close()

asyncio.run(send_message("!roomid:example.com", "Alert: new intel received"))
```

### 5.2 Node.js/TypeScript: matrix-bot-sdk

Install: `npm install matrix-bot-sdk`

```typescript
import { MatrixClient, SimpleFsStorageProvider, AutojoinRoomsMixin } from "matrix-bot-sdk";

const homeserverUrl = "https://matrix.example.com";
const accessToken = "syt_your_token";
const storage = new SimpleFsStorageProvider("bot.json");
const client = new MatrixClient(homeserverUrl, accessToken, storage);

AutojoinRoomsMixin.setupOnClient(client);

client.on("room.message", (roomId: string, event: any) => {
    if (event.content?.body?.startsWith("!hello")) {
        client.sendMessage(roomId, {
            msgtype: "m.text",
            body: "Hello from the bot!"
        });
    }
});

client.start().then(() => console.log("Bot started"));
```

### 5.3 Webhook Support

**matrix-appservice-webhooks** (Slack-compatible):
- Repo: https://github.com/turt2live/matrix-appservice-webhooks
- Deploy as an appservice, invite to room, send `!webhook` to get a URL
- POST JSON to the URL to send messages (Slack-compatible format)

**Direct API (simplest approach):**
```bash
# Send a message via curl
curl -X PUT "https://matrix.example.com/_matrix/client/v3/rooms/!roomid:example.com/send/m.room.message/$(date +%s)" \
  -H "Authorization: Bearer $BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"msgtype": "m.text", "body": "Automated alert message"}'
```

### 5.4 Application Services (Advanced)

For deep integration (bridge-like behavior), register as an appservice:
- Define user/room namespace patterns
- Receive all matching events via HTTP push from Synapse
- Create virtual users on the fly
- Highest trust level — only homeserver admins can register appservices

---

## 6. Reverse Proxy Configuration

### Option A: Caddy (Recommended — Automatic TLS)

**Caddyfile:**

```
# Client traffic + .well-known
matrix.example.com {
    reverse_proxy /_matrix/* synapse:8008
    reverse_proxy /_synapse/client/* synapse:8008

    header /_matrix/* {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
    }
}

# Element Web
chat.example.com {
    reverse_proxy element-web:80
}

# .well-known for delegation (serve from main domain)
example.com {
    header /.well-known/matrix/* Content-Type application/json
    header /.well-known/matrix/* Access-Control-Allow-Origin *

    respond /.well-known/matrix/server `{"m.server": "matrix.example.com:443"}`
    respond /.well-known/matrix/client `{"m.homeserver": {"base_url": "https://matrix.example.com"}, "m.identity_server": {"base_url": ""}}`
}

# Federation port (if not using .well-known delegation on port 443)
example.com:8448 {
    reverse_proxy /_matrix/* synapse:8008
}
```

### Option B: nginx

```nginx
# Client API + Element
server {
    listen 443 ssl http2;
    server_name matrix.example.com;

    ssl_certificate /etc/letsencrypt/live/matrix.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/matrix.example.com/privkey.pem;

    client_max_body_size 50M;

    location /_matrix {
        proxy_pass http://synapse:8008;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }

    location /_synapse/client {
        proxy_pass http://synapse:8008;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }
}

# Federation
server {
    listen 8448 ssl http2 default_server;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    location /_matrix {
        proxy_pass http://synapse:8008;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }
}

# .well-known delegation
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    location /.well-known/matrix/server {
        return 200 '{"m.server": "matrix.example.com:443"}';
        default_type application/json;
        add_header Access-Control-Allow-Origin *;
    }

    location /.well-known/matrix/client {
        return 200 '{"m.homeserver": {"base_url": "https://matrix.example.com"}, "m.identity_server": {"base_url": ""}}';
        default_type application/json;
        add_header Access-Control-Allow-Origin *;
    }
}

# Element Web
server {
    listen 443 ssl http2;
    server_name chat.example.com;

    ssl_certificate /etc/letsencrypt/live/chat.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chat.example.com/privkey.pem;

    location / {
        proxy_pass http://element-web:80;
    }
}
```

### .well-known Delegation Notes

With proper `.well-known` delegation, you can avoid opening port 8448 entirely. Federation traffic routes through port 443. The `.well-known` file must be served from `https://<server_name>` on port 443.

In Synapse `homeserver.yaml`:
```yaml
# If Synapse is behind a reverse proxy:
# Do NOT set bind_addresses to 127.0.0.1 inside Docker containers
listeners:
  - port: 8008
    tls: false
    type: http
    x_forwarded: true
    resources:
      - names: [client, federation]
        compress: false
```

---

## 7. Backup Strategy

### What to Back Up

| Component | Path (in container) | Method | Criticality |
|-----------|-------------------|--------|-------------|
| PostgreSQL database | N/A (dump) | `pg_dump` | **CRITICAL** |
| Media store (uploads) | `/data/media_store/local_content` | File copy | **CRITICAL** |
| Local thumbnails | `/data/media_store/local_thumbnails` | File copy | Important |
| homeserver.yaml | `/data/homeserver.yaml` | File copy | **CRITICAL** |
| Signing key | `/data/example.com.signing.key` | File copy | **CRITICAL** |
| Log config | `/data/example.com.log.config` | File copy | Low |
| Bridge configs | `./mautrix-*/config.yaml` | File copy | Important |
| Bridge registrations | `./mautrix-*/registration.yaml` | File copy | Important |

### Backup Script

```bash
#!/bin/bash
# matrix-backup.sh — Run via cron daily

set -euo pipefail

BACKUP_DIR="/backups/matrix/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# 1. PostgreSQL dump (EXCLUDE e2e_one_time_keys_json)
docker compose exec -T postgres pg_dump \
  -Fc \
  --exclude-table-data=e2e_one_time_keys_json \
  -U synapse synapse > "$BACKUP_DIR/synapse.pgdump"

# 2. Media store
rsync -a ./synapse-data/media_store/local_content/ "$BACKUP_DIR/media_local_content/"
rsync -a ./synapse-data/media_store/local_thumbnails/ "$BACKUP_DIR/media_local_thumbnails/"

# 3. Config files
cp ./synapse-data/homeserver.yaml "$BACKUP_DIR/"
cp ./synapse-data/*.signing.key "$BACKUP_DIR/"
cp ./synapse-data/*.log.config "$BACKUP_DIR/" 2>/dev/null || true

# 4. Bridge configs
for bridge_dir in ./mautrix-*; do
    [ -d "$bridge_dir" ] && cp "$bridge_dir/config.yaml" "$BACKUP_DIR/$(basename $bridge_dir)-config.yaml" 2>/dev/null || true
done

# 5. docker-compose and env
cp ./docker-compose.yml "$BACKUP_DIR/"
cp ./.env "$BACKUP_DIR/"
cp ./element-config.json "$BACKUP_DIR/"
cp ./Caddyfile "$BACKUP_DIR/"

# 6. Encrypt the backup
tar czf - -C "$BACKUP_DIR" . | \
  gpg --symmetric --cipher-algo AES256 --batch --passphrase-file /root/.backup-passphrase \
  > "$BACKUP_DIR.tar.gz.gpg"

# 7. Remove unencrypted backup
rm -rf "$BACKUP_DIR"

# 8. Rotate: keep last 30 days
find /backups/matrix/ -name "*.tar.gz.gpg" -mtime +30 -delete

echo "Backup complete: $BACKUP_DIR.tar.gz.gpg"
```

### Critical: E2E One-Time Keys

**NEVER restore `e2e_one_time_keys_json` from a backup.** Restoring used one-time keys causes message decryption errors. The `pg_dump` command above excludes this table. If you restore from a full backup, `TRUNCATE e2e_one_time_keys_json;` before starting Synapse.

### Signing Key Recovery

If the signing key is lost, Synapse can generate a new one, but you must add the old public key to `old_signing_keys` in `homeserver.yaml` for federation to continue working. Back up this key.

### Off-site Backup

- Encrypt backups with GPG before transferring
- Use `rclone` to sync to an encrypted remote (e.g., Backblaze B2, or another VPS)
- Consider the threat model: if the VPS is seized, off-site backups should be in a different jurisdiction

---

## 8. Resource Estimates

### VPS Requirements for 5-20 Users

| Resource | Minimum | Recommended | Notes |
|----------|---------|-------------|-------|
| **CPU** | 1 vCPU | 2 vCPUs | Video calls need more CPU |
| **RAM** | 2 GB | 4 GB | Synapse ~500MB + Postgres ~300MB + Bridges ~200MB each + Element ~100MB |
| **Storage** | 20 GB SSD | 40-80 GB SSD | Media uploads grow over time |
| **Bandwidth** | 500 GB/mo | 1 TB/mo | Media-heavy usage increases this |

### Memory Breakdown (Estimated Steady-State)

| Component | RAM Usage |
|-----------|----------|
| Synapse | 400-800 MB |
| PostgreSQL | 200-400 MB |
| Element Web (nginx) | 50-100 MB |
| Caddy | 30-50 MB |
| mautrix-whatsapp | 50-150 MB |
| mautrix-signal | 50-150 MB |
| mautrix-discord | 50-150 MB |
| **Total** | **~1.0-1.8 GB typical** |

With 4 GB RAM you have comfortable headroom. Synapse uses jemalloc (built into the official Docker image) which significantly reduces memory usage.

### Storage Growth

- Expect ~1-5 GB/month for a 20-user group with moderate media sharing
- Message-only storage is minimal (~100 MB/month)
- With 30-day retention policy and media purging, growth is manageable
- PostgreSQL will be the largest storage consumer if retention is long

### Optimization for Constrained Hardware

```yaml
# In homeserver.yaml:

# Disable presence (major CPU saver)
presence:
  enabled: false

# Limit caches (reduce RAM usage)
caches:
  global_factor: 0.5

# Limit remote room complexity
limit_remote_rooms:
  enabled: true
  complexity: 5.0

# Disable URL previews
url_preview_enabled: false
```

### Recommended VPS Providers (Privacy-Conscious)

- **1984.is** (Iceland) — accepts cryptocurrency, strong privacy laws
- **Njalla** (Nevis/Sweden) — privacy-by-design, domain + VPS
- **FlokiNET** (Iceland/Romania/Finland) — known for press freedom hosting
- **BuyVM** (Luxembourg) — affordable, accepts crypto, DMCA-free
- **Bahnhof** (Sweden) — strong privacy stance

Pay with Monero or Bitcoin (via exchange) where possible.

---

## Summary of homeserver.yaml Security Settings

```yaml
server_name: "example.com"
public_baseurl: "https://matrix.example.com"
report_stats: false

# Registration
enable_registration: true
registration_requires_token: true
# enable_registration_without_verification: false  # keep this OFF

# Encryption
encryption_enabled_by_default_for_room_type: "all"

# Federation (DISABLED for closed group)
federation_domain_whitelist: []

# Retention
retention:
  enabled: true
  default_policy:
    min_lifetime: 1d
    max_lifetime: 30d
  purge_jobs:
    - longest_max_lifetime: 3d
      interval: 12h
    - shortest_max_lifetime: 3d
      interval: 1d

# Performance / Privacy
presence:
  enabled: false
url_preview_enabled: false
limit_remote_rooms:
  enabled: true
  complexity: 5.0

# Rate limiting
rc_message:
  per_second: 0.5
  burst_count: 10
rc_registration:
  per_second: 0.05
  burst_count: 3
rc_login:
  address:
    per_second: 0.1
    burst_count: 5
  account:
    per_second: 0.1
    burst_count: 5
  failed_attempts:
    per_second: 0.05
    burst_count: 3

# User directory
user_directory:
  enabled: true
  search_all_users: false
  prefer_local_users: true

# Room directory
room_directory:
  visibility:
    world_readable: false

# Database
database:
  name: psycopg2
  args:
    user: synapse
    password: "${POSTGRES_PASSWORD}"
    database: synapse
    host: synapse-postgres
    cp_min: 5
    cp_max: 10

# Listeners
listeners:
  - port: 8008
    tls: false
    type: http
    x_forwarded: true
    resources:
      - names: [client, federation]
        compress: false

# App services (bridges)
app_service_config_files:
  - /data/appservices/mautrix-whatsapp-registration.yaml
  - /data/appservices/mautrix-signal-registration.yaml
  - /data/appservices/mautrix-discord-registration.yaml
```

---

## Sources

- [Synapse Docker Image (Docker Hub)](https://hub.docker.com/r/matrixdotorg/synapse/)
- [Synapse Docker Image (GitHub Container Registry)](https://github.com/element-hq/synapse)
- [Synapse Installation Docs](https://element-hq.github.io/synapse/latest/setup/installation.html)
- [Synapse Configuration Manual](https://matrix-org.github.io/synapse/latest/usage/configuration/config_documentation.html)
- [Synapse Reverse Proxy Docs](https://element-hq.github.io/synapse/latest/reverse_proxy.html)
- [Synapse Delegation Docs](https://matrix-org.github.io/synapse/latest/delegate.html)
- [Synapse Message Retention Policies](https://matrix-org.github.io/synapse/latest/message_retention_policies.html)
- [Synapse Backups](https://element-hq.github.io/synapse/latest/usage/administration/backups.html)
- [Synapse Registration Tokens API](https://matrix-org.github.io/synapse/latest/usage/administration/admin_api/registration_tokens.html)
- [Synapse Releases](https://github.com/element-hq/synapse/releases)
- [Element Web Releases](https://github.com/element-hq/element-web/releases)
- [Element Web Docker Image](https://hub.docker.com/r/vectorim/element-web/)
- [mautrix Bridge Docker Setup](https://docs.mau.fi/bridges/general/docker-setup.html)
- [mautrix-whatsapp](https://github.com/mautrix/whatsapp)
- [mautrix-signal](https://github.com/mautrix/signal)
- [mautrix-signal Authentication](https://docs.mau.fi/bridges/go/signal/authentication.html)
- [mautrix-discord](https://github.com/mautrix/discord)
- [mautrix 2025-02 Release Notes (Signal backfill)](https://mau.fi/blog/2025-02-mautrix-release/)
- [Matrix SDKs](https://matrix.org/ecosystem/sdks/)
- [matrix-bot-sdk (npm)](https://www.npmjs.com/package/matrix-bot-sdk)
- [matrix-appservice-webhooks](https://github.com/turt2live/matrix-appservice-webhooks)
- [Matrix Cross-signing Announcement](https://matrix.org/blog/2020/05/06/cross-signing-and-end-to-end-encryption-by-default-is-here/)
- [Coordinated Matrix Security Update (CVE-2025-49090)](https://element.io/blog/coordinated-matrix-security-update/)
- [Matrix Synapse Security Vulnerabilities 2025](https://stack.watch/product/matrix/synapse/)
- [Matrix Synapse Tor Hidden Service Guide](https://tomsitcafe.com/2025/11/06/private-matrix-hosting-a-synapse-server-over-tor/)
- [Tor-Enabled Clearnet Synapse Server](https://start9labs.medium.com/run-a-tor-enabled-matrix-server-on-a-clearnet-domain-9d06b46b2ab3)
- [Synapse Anonymous Homeservers Discussion](https://github.com/matrix-org/synapse/issues/7088)
- [Mjolnir Moderation Bot](https://hub.docker.com/r/matrixdotorg/mjolnir)
- [matrix-registration (Invite Token UI)](https://github.com/zeratax/matrix-registration)
- [Synapse Resource Requirements Discussion](https://github.com/matrix-org/synapse/issues/9363)
- [Production Docker Stack (amiirsadeghi/element-matrix)](https://github.com/amiirsadeghi/element-matrix)
- [matrix-docker-ansible-deploy](https://github.com/spantaleev/matrix-docker-ansible-deploy)
- [Self-Hosting Matrix + Element Guide (cyberhost.uk)](https://cyberhost.uk/element-matrix-setup/)
