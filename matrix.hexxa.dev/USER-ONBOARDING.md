# Matrix User Onboarding Guide

**Homeserver:** hexxa.dev
**Element Web:** https://chat.hexxa.dev
**Registration:** Invite-only (token required)

---

## Overview

This Matrix homeserver uses **invite-only registration** for security. Users cannot create accounts without a valid registration token. As an admin, you generate these tokens and share them with authorized users.

---

## Admin Prerequisites

Before generating tokens, you need your admin access token.

### Get Your Admin Access Token

```bash
curl -X POST 'https://matrix.hexxa.dev/_matrix/client/v3/login' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "m.login.password",
    "user": "brahn",
    "password": "YOUR_ADMIN_PASSWORD"
  }' | jq -r '.access_token'
```

**Save this token securely** - you'll use it for all admin operations.

---

## Generating Registration Tokens

### Single-Use Token (One Person)

Best for inviting specific individuals:

```bash
curl -X POST 'https://matrix.hexxa.dev/_synapse/admin/v1/registration_tokens/new' \
  -H 'Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "uses_allowed": 1,
    "length": 16
  }' | jq '.'
```

**Response:**
```json
{
  "token": "abc123def456ghi7",
  "uses_allowed": 1,
  "pending": 0,
  "completed": 0,
  "expiry_time": null
}
```

### Multi-Use Token (Team Invite)

Best for small groups (e.g., 10 people):

```bash
curl -X POST 'https://matrix.hexxa.dev/_synapse/admin/v1/registration_tokens/new' \
  -H 'Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "uses_allowed": 10,
    "length": 16
  }' | jq '.'
```

### Expiring Token (7 Days)

Token that expires automatically:

```bash
# Calculate expiry time: 7 days from now in milliseconds
EXPIRY_TIME=$(( ($(date +%s) + 604800) * 1000 ))

curl -X POST 'https://matrix.hexxa.dev/_synapse/admin/v1/registration_tokens/new' \
  -H 'Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d "{
    \"uses_allowed\": 10,
    \"expiry_time\": ${EXPIRY_TIME},
    \"length\": 16
  }" | jq '.'
```

### Custom Token (Named/Memorable)

Specify your own token string:

```bash
curl -X POST 'https://matrix.hexxa.dev/_synapse/admin/v1/registration_tokens/new' \
  -H 'Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "token": "resistance-crew-2026",
    "uses_allowed": 5
  }' | jq '.'
```

---

## Sharing Tokens with Users

### Instructions to Send Users

```
You've been invited to join our Matrix homeserver!

1. Go to: https://chat.hexxa.dev
2. Click "Create Account"
3. Fill in the form:
   - Username: [choose your username]
   - Password: [choose a strong password]
   - Registration Token: [PASTE_TOKEN_HERE]
4. Click "Register"

Your Matrix ID will be: @username:hexxa.dev

Note: Keep your password secure. Enable recovery options after signup.
```

### Security Recommendations for Users

- Use a unique, strong password (recommend password manager)
- Enable "Secure Backup" in Element settings after first login
- Verify security keys with other users when prompted
- Don't share their login credentials

---

## Managing Tokens

### List All Tokens

```bash
curl -X GET 'https://matrix.hexxa.dev/_synapse/admin/v1/registration_tokens' \
  -H 'Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN' | jq '.'
```

### Check Token Status

```bash
curl -X GET 'https://matrix.hexxa.dev/_synapse/admin/v1/registration_tokens/TOKEN_STRING' \
  -H 'Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN' | jq '.'
```

**Response shows:**
- `uses_allowed`: Total uses permitted
- `pending`: Currently in-progress registrations
- `completed`: Successful registrations
- `expiry_time`: When token expires (null = never)

### Update Token

Change uses or expiry:

```bash
curl -X PATCH 'https://matrix.hexxa.dev/_synapse/admin/v1/registration_tokens/TOKEN_STRING' \
  -H 'Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "uses_allowed": 20
  }' | jq '.'
```

### Delete/Revoke Token

```bash
curl -X DELETE 'https://matrix.hexxa.dev/_synapse/admin/v1/registration_tokens/TOKEN_STRING' \
  -H 'Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN'
```

---

## User Registration Flow (User Perspective)

1. **Receive invitation** with token from admin
2. **Navigate to** https://chat.hexxa.dev
3. **Click "Create Account"** (or "Sign Up")
4. **Fill registration form:**
   - Username: `andrea` (becomes `@andrea:hexxa.dev`)
   - Password: Strong password
   - Confirm password
   - **Registration Token:** Paste the token from admin
5. **Click "Register"**
6. **First login** automatically happens
7. **Set up secure backup** (Element will prompt)
8. **Join rooms** or get invited by admin

---

## Post-Registration: Room Invites

### Invite User to Room (via Element Web)

1. Open the room in Element
2. Click room name → Room Info
3. Click "People" → "Invite to this room"
4. Type: `@username:hexxa.dev`
5. Click "Invite"

### Invite User to Room (via API)

```bash
ROOM_ID="!abc123:hexxa.dev"
USER_ID="@andrea:hexxa.dev"

curl -X POST "https://matrix.hexxa.dev/_matrix/client/v3/rooms/${ROOM_ID}/invite" \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d "{
    \"user_id\": \"${USER_ID}\"
  }"
```

---

## Common Issues

### "Registration token is invalid"

**Causes:**
- Token already used up (single-use token was used)
- Token expired
- Typo in token

**Solution:** Generate a new token

### "Registration is disabled"

**Cause:** Server configuration error (shouldn't happen with our setup)

**Check:**
```bash
ssh root@srv889103.hstgr.cloud "
docker exec synapse grep -A 3 'enable_registration' /data/homeserver.yaml
"
```

Should show:
```yaml
enable_registration: true
registration_requires_token: true
```

### User forgot password

**Admin password reset:**
```bash
ssh -o StrictHostKeyChecking=no root@srv889103.hstgr.cloud "
cd /data/coolify/services/matrix-1770766820
docker exec synapse register_new_matrix_user \
  -c /data/homeserver.yaml \
  -u USERNAME \
  --password 'NewPassword123!' \
  http://localhost:8008
"
```

This will reset the user's password (doesn't create duplicate account).

---

## Bulk User Onboarding

For onboarding multiple users at once:

1. **Generate multi-use token** (e.g., 20 uses)
2. **Create shared instruction document** with:
   - Link to https://chat.hexxa.dev
   - Registration steps
   - The shared token
3. **Share via secure channel** (Signal, encrypted email, etc.)
4. **Monitor token usage:**
   ```bash
   curl -X GET 'https://matrix.hexxa.dev/_synapse/admin/v1/registration_tokens/TOKEN_STRING' \
     -H 'Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN' | jq '.completed'
   ```
5. **Revoke token** when everyone has registered

---

## Security Best Practices

1. **Generate tokens on-demand** - don't create tokens "just in case"
2. **Use single-use tokens** for sensitive invites
3. **Set expiry times** on multi-use tokens
4. **Revoke tokens** immediately after bulk onboarding completes
5. **Don't share tokens publicly** - send via secure channels only
6. **Monitor token usage** regularly
7. **Rotate admin access token** periodically

---

## Quick Reference: Common Commands

**Generate single-use token:**
```bash
curl -X POST 'https://matrix.hexxa.dev/_synapse/admin/v1/registration_tokens/new' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"uses_allowed": 1, "length": 16}' | jq -r '.token'
```

**List all tokens:**
```bash
curl -s 'https://matrix.hexxa.dev/_synapse/admin/v1/registration_tokens' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' | jq '.registration_tokens[] | {token, completed, uses_allowed}'
```

**Delete token:**
```bash
curl -X DELETE 'https://matrix.hexxa.dev/_synapse/admin/v1/registration_tokens/TOKEN' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN'
```

---

**Last Updated:** 2026-02-10
**Homeserver Version:** Synapse v1.147.0
