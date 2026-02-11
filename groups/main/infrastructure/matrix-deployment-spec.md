# Matrix Deployment Spec — Resistance Comms

**For:** Server management agent on c.hexxa.dev (Coolify)
**Prepared by:** oilcloth
**Date:** 2026-02-10
**Target:** 5-20 users, activist/resistance use, E2E encrypted, closed registration

---

## Overview

Deploy a Matrix Synapse homeserver with Element Web client on c.hexxa.dev via Coolify/Docker. This replaces Discord as primary comms. Federation disabled. E2E encryption forced on all rooms. Invite-only registration.

**Components:**
1. Synapse (homeserver) — `ghcr.io/element-hq/synapse:v1.145.0`
2. PostgreSQL 16 — backend database
3. Element Web — browser client — `vectorim/element-web:v1.12.8`
4. Caddy — reverse proxy with automatic TLS (Coolify may handle this — see notes)

**Optional (Phase 2):**
- mautrix-whatsapp bridge (bridge existing WhatsApp chats)
- mautrix-signal bridge (bridge Signal users)
- mautrix-discord bridge (migration period from Discord)

---

## DNS Requirements

Before deployment, set up these DNS records pointing to the VPS:

| Record | Type | Value |
|--------|------|-------|
| `matrix.hexxa.dev` | A | VPS IP |
| `chat.hexxa.dev` | A | VPS IP |
| `hexxa.dev` | A | VPS IP (for .well-known delegation) |

If `hexxa.dev` already points to the VPS, only `matrix.` and `chat.` subdomains are needed.

---

## Docker Compose Stack

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

networks:
  matrix:
    driver: bridge
```

**Note for Coolify:** If Coolify handles reverse proxy/TLS, you may not need a Caddy container. Coolify's Traefik or Caddy proxy should forward:
- `matrix.hexxa.dev` → `synapse:8008`
- `chat.hexxa.dev` → `element-web:80`
- `hexxa.dev/.well-known/matrix/*` → serve static JSON (see below)

If Coolify doesn't easily handle the `.well-known` routes, add a small Caddy container (config below).

---

## Setup Steps

### Step 1: Generate .env

```bash
mkdir -p matrix && cd matrix

# Generate a strong random password
echo "POSTGRES_PASSWORD=$(openssl rand -hex 32)" > .env
```

### Step 2: Generate Synapse Config

```bash
docker run -it --rm \
  -v $(pwd)/synapse-data:/data \
  -e SYNAPSE_SERVER_NAME=hexxa.dev \
  -e SYNAPSE_REPORT_STATS=no \
  ghcr.io/element-hq/synapse:v1.145.0 generate
```

This creates `synapse-data/homeserver.yaml`. Now patch it.

### Step 3: Patch homeserver.yaml

Replace the generated config's relevant sections with:

```yaml
server_name: "hexxa.dev"
public_baseurl: "https://matrix.hexxa.dev"
report_stats: false
serve_server_wellknown: true

# === DATABASE (replace SQLite section) ===
database:
  name: psycopg2
  args:
    user: synapse
    password: "${POSTGRES_PASSWORD}"
    database: synapse
    host: synapse-postgres
    cp_min: 5
    cp_max: 10

# === REGISTRATION — Invite-only ===
enable_registration: true
registration_requires_token: true

# === ENCRYPTION — Force E2E on ALL rooms ===
encryption_enabled_by_default_for_room_type: "all"

# === FEDERATION — Disabled (closed network) ===
federation_domain_whitelist: []

# === MESSAGE RETENTION — 90 day default, configurable per-room ===
retention:
  enabled: true
  default_policy:
    min_lifetime: 1d
    max_lifetime: 90d
  allowed_lifetime_min: 1d
  allowed_lifetime_max: 365d
  purge_jobs:
    - longest_max_lifetime: 3d
      interval: 12h
    - shortest_max_lifetime: 3d
      interval: 1d

# === PERFORMANCE / PRIVACY ===
presence:
  enabled: false
url_preview_enabled: false
room_directory:
  visibility:
    world_readable: false
user_directory:
  enabled: true
  search_all_users: false
  prefer_local_users: true

# === RATE LIMITING ===
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

# === LISTENERS ===
listeners:
  - port: 8008
    tls: false
    type: http
    x_forwarded: true
    resources:
      - names: [client, federation]
        compress: false
```

**IMPORTANT:** The `POSTGRES_PASSWORD` in the YAML needs to match the .env. Either:
- Hardcode the password in homeserver.yaml (simpler), OR
- Use Synapse's env variable support: `password: "${POSTGRES_PASSWORD}"` requires Synapse to read env vars (check docs for your version)

Simplest: just paste the actual password string into homeserver.yaml.

### Step 4: Create Element Config

Save as `element-config.json`:

```json
{
    "default_server_config": {
        "m.homeserver": {
            "base_url": "https://matrix.hexxa.dev",
            "server_name": "hexxa.dev"
        },
        "m.identity_server": {
            "base_url": ""
        }
    },
    "disable_custom_urls": true,
    "disable_guests": true,
    "disable_3pid_login": true,
    "brand": "hexxa",
    "default_theme": "dark",
    "room_directory": {
        "servers": ["hexxa.dev"]
    }
}
```

### Step 5: .well-known Delegation

Serve these two JSON responses from `https://hexxa.dev`:

**`/.well-known/matrix/server`:**
```json
{"m.server": "matrix.hexxa.dev:443"}
```

**`/.well-known/matrix/client`:**
```json
{"m.homeserver": {"base_url": "https://matrix.hexxa.dev"}, "m.identity_server": {"base_url": ""}}
```

If Coolify can serve static responses on routes, configure there. Otherwise, add to Caddy or nginx config.

### Step 6: Start Stack

```bash
docker compose up -d
```

Wait for health checks to pass:
```bash
docker compose ps
# All should show "healthy"
```

### Step 7: Create Admin User

```bash
docker exec -it synapse register_new_matrix_user \
  -c /data/homeserver.yaml \
  -a -u brahn http://localhost:8008
```

You'll be prompted for a password. This creates the admin account.

### Step 8: Create Invite Tokens

Get admin access token first:
```bash
curl -X POST "https://matrix.hexxa.dev/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  -d '{"type": "m.login.password", "user": "brahn", "password": "YOUR_PASSWORD"}'
```

Save the `access_token` from the response. Then create invite tokens:

```bash
# Single-use token for Andrea
curl -X POST "https://matrix.hexxa.dev/_synapse/admin/v1/registration_tokens/new" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uses_allowed": 1, "length": 16}'

# 10-use token for resistance group, expires in 7 days
curl -X POST "https://matrix.hexxa.dev/_synapse/admin/v1/registration_tokens/new" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uses_allowed": 10, "expiry_time": '$(( ($(date +%s) + 604800) * 1000 ))'}'
```

### Step 9: Verify

1. Open `https://chat.hexxa.dev` in browser
2. Log in with admin credentials
3. Create a room — verify it's E2E encrypted by default (lock icon)
4. Test invite token registration from an incognito window

---

## Resource Requirements

| Resource | Estimate |
|----------|----------|
| RAM | ~1.0-1.8 GB steady state (Synapse + Postgres + Element) |
| CPU | 1-2 vCPUs sufficient for 5-20 users |
| Disk | 20-40 GB to start, ~1-5 GB/month growth with media |

This should be well within c.hexxa.dev's capacity alongside existing Coolify services.

---

## Backup (Daily Cron)

```bash
#!/bin/bash
# /opt/matrix/backup.sh — add to crontab: 0 3 * * * /opt/matrix/backup.sh

set -euo pipefail
BACKUP_DIR="/backups/matrix/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

cd /opt/matrix  # or wherever the compose stack lives

# Database dump (exclude one-time E2E keys — restoring them breaks encryption)
docker compose exec -T postgres pg_dump -Fc \
  --exclude-table-data=e2e_one_time_keys_json \
  -U synapse synapse > "$BACKUP_DIR/synapse.pgdump"

# Media store
rsync -a ./synapse-data/media_store/ "$BACKUP_DIR/media_store/"

# Config files
cp ./synapse-data/homeserver.yaml "$BACKUP_DIR/"
cp ./synapse-data/*.signing.key "$BACKUP_DIR/"
cp ./element-config.json "$BACKUP_DIR/"
cp ./docker-compose.yml "$BACKUP_DIR/"
cp ./.env "$BACKUP_DIR/"

# Encrypt
tar czf - -C "$BACKUP_DIR" . | \
  gpg --symmetric --cipher-algo AES256 --batch --passphrase-file /root/.backup-passphrase \
  > "$BACKUP_DIR.tar.gz.gpg"
rm -rf "$BACKUP_DIR"

# Rotate — keep 30 days
find /backups/matrix/ -name "*.tar.gz.gpg" -mtime +30 -delete
```

---

## Phase 2: Bridges (After Core Is Stable)

### WhatsApp Bridge

Add to docker-compose.yml:
```yaml
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

Setup: Run once to generate config, edit config (homeserver URL, database), register appservice in Synapse, restart. Users DM `@whatsappbot:hexxa.dev` and scan QR code.

### Signal Bridge

Same pattern with `dock.mau.dev/mautrix/signal:v0.8.3`. Users link their Signal app.

### Discord Bridge (Migration)

Same pattern with `dock.mau.dev/mautrix/discord:v0.7.5`. Temporary — remove after migration complete.

---

## Oilcloth Integration (Phase 2)

I can connect to Matrix via bot API. Options:

1. **matrix-nio (Python)** — create a bot user, join rooms, send/receive messages
2. **Direct HTTP API** — curl-based, simplest, no library needed
3. **Appservice** — deepest integration, virtual users, event streaming

Simplest path: create `@oilcloth:hexxa.dev` bot user, give me the access token, I send messages via HTTP API. Same workflow as Discord/WhatsApp but encrypted.

---

## Security Summary

| Feature | Setting |
|---------|---------|
| E2E Encryption | **Forced ON** for all rooms |
| Federation | **OFF** (closed network) |
| Registration | **Invite-only** (token required) |
| Identity Server | **Disabled** (no phone/email discovery) |
| Guest Access | **Disabled** |
| URL Previews | **Disabled** (no outbound requests) |
| Presence | **Disabled** (no online/offline leakage) |
| Room Directory | **Private** (not world-readable) |
| Message Retention | **90 days default** (configurable per-room) |
| Backups | **GPG encrypted**, 30-day rotation |
| Stats Reporting | **Disabled** |

---

## Migration Plan (Discord → Matrix)

1. **Deploy and test** core stack (1-2 days)
2. **Create rooms** mirroring Discord channels
3. **Issue invite tokens** to resistance members
4. **Bridge Discord temporarily** so both platforms see messages during transition
5. **Set sunset date** for Discord (2-4 weeks)
6. **Remove Discord bridge** after migration complete
7. **Delete Discord server**

---

*Spec prepared by oilcloth. 2026-02-10.*
*Hand this to your server management agent. They have everything they need.*
