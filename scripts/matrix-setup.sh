#!/bin/bash
# Matrix room setup helper for NanoClaw
# Joins pending rooms and registers them as the main group

set -e

HOMESERVER="https://matrix.hexxa.dev"
BOT_USER="@oilclothbot:hexxa.dev"
BOT_TOKEN="syt_b2lsY2xvdGhib3Q_TWXrvCgtAevgDNWMczEW_3CC1W9"
DB_PATH="/home/bdmorin/nanoclaw/store/messages.db"

echo "=== Matrix Room Setup for NanoClaw ==="
echo ""

# Check homeserver
if ! curl -sf "$HOMESERVER/_matrix/client/versions" >/dev/null 2>&1; then
  echo "ERROR: Cannot reach homeserver at $HOMESERVER"
  exit 1
fi
echo "Homeserver: OK"

# Check bot auth
WHOAMI=$(curl -sf "$HOMESERVER/_matrix/client/v3/account/whoami" \
  -H "Authorization: Bearer $BOT_TOKEN" 2>/dev/null)
if [ $? -ne 0 ]; then
  echo "ERROR: Bot token invalid"
  exit 1
fi
echo "Bot: $(echo "$WHOAMI" | jq -r '.user_id')"

# Sync to find rooms
echo ""
echo "Syncing..."
SYNC=$(curl -sf "$HOMESERVER/_matrix/client/v3/sync?timeout=5000" \
  -H "Authorization: Bearer $BOT_TOKEN" 2>/dev/null)

# Auto-join invites
INVITE_ROOMS=$(echo "$SYNC" | jq -r '.rooms.invite // {} | keys[]' 2>/dev/null)
if [ -n "$INVITE_ROOMS" ]; then
  for ROOM_ID in $INVITE_ROOMS; do
    echo "Joining invite: $ROOM_ID"
    # URL-encode the room ID (! and : need encoding)
    ENCODED_ROOM=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$ROOM_ID', safe=''))")
    curl -sf -X POST "$HOMESERVER/_matrix/client/v3/rooms/$ENCODED_ROOM/join" \
      -H "Authorization: Bearer $BOT_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{}' >/dev/null 2>&1 && echo "  Joined." || echo "  Failed to join."
  done
  # Re-sync after joining (wait for server to process)
  sleep 3
  SYNC=$(curl -sf "$HOMESERVER/_matrix/client/v3/sync?timeout=10000" \
    -H "Authorization: Bearer $BOT_TOKEN" 2>/dev/null)
fi

# List joined rooms
JOINED_ROOMS=$(echo "$SYNC" | jq -r '.rooms.join // {} | keys[]' 2>/dev/null)

if [ -z "$JOINED_ROOMS" ]; then
  echo ""
  echo "No rooms found. Create a room in Element and invite @oilclothbot:hexxa.dev"
  echo "  URL: https://chat.hexxa.dev"
  exit 0
fi

echo ""
echo "Joined rooms:"
i=1
declare -A ROOM_MAP
for ROOM_ID in $JOINED_ROOMS; do
  ROOM_STATE=$(curl -sf "$HOMESERVER/_matrix/client/v3/rooms/$ROOM_ID/state/m.room.name" \
    -H "Authorization: Bearer $BOT_TOKEN" 2>/dev/null || echo '{}')
  ROOM_NAME=$(echo "$ROOM_STATE" | jq -r '.name // "(unnamed)"' 2>/dev/null)
  echo "  [$i] $ROOM_ID  ($ROOM_NAME)"
  ROOM_MAP[$i]="$ROOM_ID"
  ((i++))
done

echo ""
read -p "Register which room as main group? [1]: " CHOICE
CHOICE=${CHOICE:-1}
SELECTED_ROOM="${ROOM_MAP[$CHOICE]}"

if [ -z "$SELECTED_ROOM" ]; then
  echo "Invalid choice."
  exit 1
fi

MATRIX_JID="matrix::$SELECTED_ROOM"
echo ""
echo "Registering: $MATRIX_JID as main group"

# Update the database: remove old main group and insert new one
sqlite3 "$DB_PATH" <<EOF
DELETE FROM registered_groups WHERE folder = 'main';
INSERT OR REPLACE INTO registered_groups (jid, name, folder, trigger_pattern, added_at, container_config, requires_trigger)
VALUES ('$MATRIX_JID', 'main', 'main', '@oilcloth', '$(date -u +%Y-%m-%dT%H:%M:%S.000Z)', NULL, 0);
EOF

echo "Done! Main group registered as: $MATRIX_JID"
echo ""
echo "Now update .env:"
echo "  DISCORD_ENABLED=false"
echo "  MATRIX_ENABLED=true"
echo ""
echo "Then restart: sudo systemctl restart nanoclaw"
