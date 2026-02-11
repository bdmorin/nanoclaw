# Matrix DNS Setup

## Required DNS Records

Two subdomains are required for Matrix deployment:

| Subdomain | Purpose | Target |
|-----------|---------|--------|
| `matrix.hexxa.dev` | Synapse homeserver API endpoint | c.hexxa.dev (CNAME) or 31.97.145.178 (A) |
| `chat.hexxa.dev` | Element Web client interface | c.hexxa.dev (CNAME) or 31.97.145.178 (A) |

**Important:** Both records MUST be **proxied through Cloudflare** (orange cloud) so the Cloudflare Worker can serve the `.well-known` endpoints.

## Setup Commands

### Check Current DNS Records
```bash
# Load Cloudflare credentials
eval "$(mise env -s bash)"

# List all hexxa.dev DNS records
flarectl d l --zone hexxa.dev

# Check for existing matrix/chat records
flarectl d l --zone hexxa.dev --json | jq -r '.[] | select(.Name | contains("matrix") or contains("chat"))'
```

### Create DNS Records (if not exist)

#### Option 1: CNAME Records (Recommended)
```bash
# Create matrix.hexxa.dev → c.hexxa.dev (proxied)
flarectl d c --zone hexxa.dev --name matrix.hexxa.dev --type CNAME --content c.hexxa.dev --proxy

# Create chat.hexxa.dev → c.hexxa.dev (proxied)
flarectl d c --zone hexxa.dev --name chat.hexxa.dev --type CNAME --content c.hexxa.dev --proxy
```

#### Option 2: A Records (Alternative)
```bash
# Create matrix.hexxa.dev → 31.97.145.178 (proxied)
flarectl d c --zone hexxa.dev --name matrix.hexxa.dev --type A --content 31.97.145.178 --proxy

# Create chat.hexxa.dev → 31.97.145.178 (proxied)
flarectl d c --zone hexxa.dev --name chat.hexxa.dev --type A --content 31.97.145.178 --proxy
```

## Verification

After creating the records, verify they resolve correctly:

```bash
# Check matrix subdomain
dig +short matrix.hexxa.dev

# Check chat subdomain
dig +short chat.hexxa.dev

# Both should return Cloudflare proxy IPs (104.x.x.x range)
```

## Cloudflare Worker Requirement

The Cloudflare Worker deployed at `hexxa.dev` serves the Matrix `.well-known` endpoints required for federation discovery and client configuration. Ensure:

1. DNS records are **proxied** (not DNS-only)
2. Worker is deployed with route: `hexxa.dev/.well-known/matrix/*` OR `hexxa.dev/*`
3. Worker script is from: `src/cloudflare/matrix-well-known-worker.js`

## Route Configuration

After DNS is configured, Coolify's Traefik will automatically route:
- `https://matrix.hexxa.dev` → Synapse container (port 8008)
- `https://chat.hexxa.dev` → Element Web container (port 80)

The Traefik labels in `docker-compose.yml` handle this routing.
