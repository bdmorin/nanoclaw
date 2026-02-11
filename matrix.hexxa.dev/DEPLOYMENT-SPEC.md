# Matrix Homeserver Deployment Spec — Coolify Native

**Target Platform:** Coolify v4.x on c.hexxa.dev (srv889103.hstgr.cloud)
**Created:** 2026-02-10
**Purpose:** E2E encrypted resistance communications, 5-20 users, closed registration
**Status:** Implementation Ready

---

## Architecture Overview

### Components
- **Synapse v1.147.0** (homeserver) — `ghcr.io/element-hq/synapse:v1.147.0`
- **PostgreSQL 16** (database) — `postgres:16-alpine`
- **Element Web v1.12.10** (client) — `vectorim/element-web:v1.12.10`

### Domains
- `matrix.hexxa.dev` → Synapse API endpoint (Traefik routes to port 8008)
- `chat.hexxa.dev` → Element Web client (Traefik routes to port 80)
- `hexxa.dev/.well-known/matrix/*` → Cloudflare Worker (federation/client discovery)

### Security Profile
- ✅ E2E encryption FORCED on all rooms
- ✅ Federation DISABLED (closed network, no external Matrix servers)
- ✅ Invite-only registration (token required)
- ✅ Identity server DISABLED (no phone/email discovery)
- ✅ Presence DISABLED (no online/offline metadata leakage)
- ✅ URL previews DISABLED (no outbound requests)
- ✅ 90-day message retention default (configurable per-room)
- ✅ Private room directory (not world-readable)

---

## Prerequisites

### DNS Records
Create these DNS records proxied through Cloudflare:
```bash
# CNAME approach (recommended)
matrix.hexxa.dev → c.hexxa.dev (proxied)
chat.hexxa.dev → c.hexxa.dev (proxied)

# OR A record approach
matrix.hexxa.dev → 31.97.145.178 (proxied)
chat.hexxa.dev → 31.97.145.178 (proxied)
```

**Commands:**
```bash
eval "$(mise env -s bash)"
flarectl d c --zone hexxa.dev --name matrix.hexxa.dev --type CNAME --content c.hexxa.dev --proxy
flarectl d c --zone hexxa.dev --name chat.hexxa.dev --type CNAME --content c.hexxa.dev --proxy
```

See: `dns-setup.md` for full details.

### Cloudflare Worker
Deploy the `.well-known` worker at `hexxa.dev`:
1. Open Cloudflare dashboard → Workers & Pages
2. Create new Worker named `matrix-well-known`
3. Paste contents from `src/cloudflare/matrix-well-known-worker.js`
4. Add route: `hexxa.dev/.well-known/matrix/*` OR `hexxa.dev/*`
5. Deploy

This serves the Matrix federation/client discovery endpoints without needing a container.

---

## Deployment Steps

### Step 1: Prepare Coolify Service

1. SSH to c.hexxa.dev:
   ```bash
   ssh root@srv889103.hstgr.cloud
   ```

2. Create service directory structure:
   ```bash
   SERVICE_ID="matrix-$(date +%s)"
   SERVICE_DIR="/data/coolify/services/${SERVICE_ID}"
   mkdir -p "${SERVICE_DIR}"
   cd "${SERVICE_DIR}"
   ```

3. Copy deployment files:
   ```bash
   # Copy docker-compose.yml
   # Copy element-config.json
   # Copy homeserver.yaml (template)
   ```

4. Generate strong PostgreSQL password:
   ```bash
   POSTGRES_PASSWORD=$(openssl rand -hex 32)
   echo "POSTGRES_PASSWORD=${POSTGRES_PASSWORD}" > .env
   echo "COMPOSE_PROJECT_NAME=${SERVICE_ID}" >> .env
   chmod 600 .env
   ```

### Step 2: Generate Synapse Configuration

Run the Synapse container once to generate initial config:

```bash
docker run -it --rm \
  -v "${SERVICE_DIR}/synapse-data:/data" \
  -e SYNAPSE_SERVER_NAME=hexxa.dev \
  -e SYNAPSE_REPORT_STATS=no \
  ghcr.io/element-hq/synapse:v1.147.0 generate
```

This creates:
- `synapse-data/homeserver.yaml` (initial config)
- `synapse-data/hexxa.dev.signing.key` (server identity key)
- `synapse-data/hexxa.dev.log.config` (logging config)

### Step 3: Configure Homeserver

Replace the generated `synapse-data/homeserver.yaml` with the template from this repo, OR manually edit it:

**Critical changes:**
1. **Database section** — Replace SQLite with PostgreSQL:
   ```yaml
   database:
     name: psycopg2
     args:
       user: synapse
       password: "PASTE_ACTUAL_PASSWORD_HERE"  # From .env
       database: synapse
       host: synapse-postgres
       port: 5432
       cp_min: 5
       cp_max: 10
   ```

2. **Registration** — Enable invite-only:
   ```yaml
   enable_registration: true
   registration_requires_token: true
   ```

3. **Encryption** — Force E2E:
   ```yaml
   encryption_enabled_by_default_for_room_type: "all"
   ```

4. **Federation** — Disable:
   ```yaml
   federation_domain_whitelist: []
   ```

See `homeserver.yaml` in this directory for the complete configuration template.

**IMPORTANT:** The `POSTGRES_PASSWORD` must be hardcoded in `homeserver.yaml`. Synapse does NOT support `${VAR}` environment variable substitution.

### Step 4: Deploy via Coolify UI

**Option A: Coolify UI (Recommended)**
1. Open Coolify UI at https://c.hexxa.dev:8000
2. Create new service → "Docker Compose"
3. Paste contents of `docker-compose.yml`
4. Set environment variable: `POSTGRES_PASSWORD` (value from .env)
5. Deploy

**Option B: Direct Docker Compose**
```bash
cd /data/coolify/services/${SERVICE_ID}
docker compose up -d
```

### Step 5: Verify Stack Health

Wait for all containers to reach healthy status:
```bash
docker compose ps
# Expected output:
# synapse            running (healthy)
# synapse-postgres   running (healthy)
# element-web        running

# Check Synapse health endpoint
curl -f http://localhost:8008/health
# Expected: {"status": "OK"}

# Check Traefik routing
docker inspect synapse --format '{{range $k, $v := .Config.Labels}}{{$k}}={{$v}}{{"\n"}}{{end}}' | grep traefik
```

### Step 6: Create Admin User

Create the first admin user (e.g., "brahn"):

```bash
docker exec -it synapse register_new_matrix_user \
  -c /data/homeserver.yaml \
  -a -u brahn http://localhost:8008
```

You'll be prompted for a password. This user is the homeserver admin.

**Matrix ID:** `@brahn:hexxa.dev`

### Step 7: Test Login

1. Open `https://chat.hexxa.dev` in browser
2. Login with credentials:
   - Username: `brahn`
   - Password: `<what you set>`
   - Homeserver: `hexxa.dev` (should be pre-filled)

3. Create a test room
4. Verify room shows **encryption enabled** (lock icon in room header)

### Step 8: Generate Invite Tokens

Regular users cannot register without a valid token. Generate tokens via admin API:

**Get admin access token:**
```bash
curl -X POST "https://matrix.hexxa.dev/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "m.login.password",
    "user": "brahn",
    "password": "YOUR_ADMIN_PASSWORD"
  }'
```

Save the `access_token` from the response.

**Create single-use invite token:**
```bash
curl -X POST "https://matrix.hexxa.dev/_synapse/admin/v1/registration_tokens/new" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "uses_allowed": 1,
    "length": 16
  }'
```

**Create multi-use invite token (10 uses, expires in 7 days):**
```bash
curl -X POST "https://matrix.hexxa.dev/_synapse/admin/v1/registration_tokens/new" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "uses_allowed": 10,
    "expiry_time": '$(( ($(date +%s) + 604800) * 1000 ))'
  }'
```

Save the `token` value from the response. Users enter this during registration at `chat.hexxa.dev`.

---

## Resource Requirements

| Resource | Estimate |
|----------|----------|
| RAM | 1.0-1.8 GB steady state |
| CPU | 1-2 vCPUs |
| Disk | 20-40 GB initial, ~1-5 GB/month growth |
| Network | Minimal (federation disabled) |

This fits comfortably within c.hexxa.dev's capacity alongside existing Coolify services.

---

## Backups

### Strategy
Rely on **system-level backups** (full VPS snapshots) rather than application-specific backups. Message retention is 90 days default and not intended for long-term storage.

### Manual Backup (if needed)
```bash
cd /data/coolify/services/${SERVICE_ID}

# Database dump (excludes one-time E2E keys which break encryption on restore)
docker compose exec -T postgres pg_dump -Fc \
  --exclude-table-data=e2e_one_time_keys_json \
  -U synapse synapse > backup-$(date +%Y%m%d).pgdump

# Media store
tar czf media-backup-$(date +%Y%m%d).tar.gz synapse-data/media_store/

# Config files
tar czf config-backup-$(date +%Y%m%d).tar.gz \
  synapse-data/homeserver.yaml \
  synapse-data/*.signing.key \
  element-config.json \
  docker-compose.yml \
  .env
```

**CRITICAL:** Do NOT restore `e2e_one_time_keys_json` table data, as it breaks end-to-end encryption sessions.

---

## Maintenance

### Version Updates

Check for new versions monthly:
- **Synapse releases:** https://github.com/element-hq/synapse/releases
- **Element Web releases:** https://github.com/element-hq/element-web/releases

Update process:
1. Update image tags in `docker-compose.yml`
2. Redeploy via Coolify OR `docker compose up -d`
3. Verify health checks pass
4. Test login and room encryption

### Monitoring

**Health checks:**
```bash
# Synapse health
curl -f https://matrix.hexxa.dev/health

# Database connection
docker compose exec postgres pg_isready -U synapse

# Container status
docker compose ps
```

**Log inspection:**
```bash
# Synapse logs
docker logs synapse --tail 50 -f

# Database logs
docker logs synapse-postgres --tail 50 -f

# Traefik routing logs (on host)
docker logs coolify-proxy --tail 50 | grep matrix
```

### Common Issues

**Issue: "Unable to connect to homeserver"**
- Check Traefik labels: `docker inspect synapse | grep traefik`
- Verify DNS resolves: `dig +short matrix.hexxa.dev`
- Check `.well-known` endpoints:
  ```bash
  curl https://hexxa.dev/.well-known/matrix/server
  curl https://hexxa.dev/.well-known/matrix/client
  ```

**Issue: "Registration failed"**
- User needs a valid registration token
- Generate token via admin API (see Step 8)

**Issue: "Room not encrypted"**
- Check `homeserver.yaml`: `encryption_enabled_by_default_for_room_type: "all"`
- Restart Synapse if config was changed

**Issue: Coolify regenerates docker-compose.yml and removes Traefik labels**
- Known Coolify behavior when service is restarted via UI
- Solution: Restart via `docker compose restart` instead, OR
- Re-add Traefik labels manually after Coolify restarts

---

## Security Checklist

- [ ] DNS records created and proxied through Cloudflare
- [ ] Cloudflare Worker deployed for `.well-known` endpoints
- [ ] Synapse homeserver.yaml configured with federation disabled
- [ ] E2E encryption forced on all rooms
- [ ] Invite-only registration enabled
- [ ] Admin user created
- [ ] Test user registered via invite token
- [ ] Test room created and verified encrypted
- [ ] Presence disabled (no online/offline leakage)
- [ ] URL previews disabled (no outbound requests)
- [ ] Identity server disabled (no phone/email discovery)
- [ ] PostgreSQL password is strong (32+ hex chars)
- [ ] .env file has restrictive permissions (chmod 600)

---

## Future Enhancements (Phase 2)

### VoIP/Video Calling
Add coturn TURN server if voice/video needed:
```yaml
coturn:
  image: coturn/coturn:latest
  # ... configuration
```

### Bridges
- **mautrix-whatsapp** — Bridge WhatsApp chats
- **mautrix-signal** — Bridge Signal users
- **mautrix-discord** — Temporary bridge during migration from Discord

### Oilcloth Bot Integration
Create bot user `@oilcloth:hexxa.dev` with API access token for automated messages.

---

## File Inventory

```
src/deployments/matrix/
├── DEPLOYMENT-SPEC.md          # This file
├── docker-compose.yml          # Coolify-native compose file with Traefik labels
├── homeserver.yaml             # Synapse configuration template
├── element-config.json         # Element Web client config
└── dns-setup.md                # DNS record creation instructions

src/cloudflare/
└── matrix-well-known-worker.js # Cloudflare Worker for .well-known endpoints
```

---

**Deployment prepared by:** Claude Code (oilcloth agent)
**Date:** 2026-02-10
**Status:** Ready for implementation
