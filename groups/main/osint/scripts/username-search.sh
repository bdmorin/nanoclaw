#!/bin/bash
# Username Enumeration - Curated High-Value Sites
# Usage: ./username-search.sh <username>
#
# Checks the most useful sites for username presence.
# For comprehensive search, use WhatsMyName.app directly.

set -euo pipefail

USERNAME="${1:-}"

if [[ -z "$USERNAME" ]]; then
    echo "Usage: $0 <username>" >&2
    exit 1
fi

# High-value sites to check (name|url_pattern|exists_indicator)
SITES=(
    "GitHub|https://github.com/%s|200"
    "Twitter/X|https://x.com/%s|200"
    "Reddit|https://www.reddit.com/user/%s|200"
    "Instagram|https://www.instagram.com/%s/|200"
    "LinkedIn|https://www.linkedin.com/in/%s|200"
    "YouTube|https://www.youtube.com/@%s|200"
    "TikTok|https://www.tiktok.com/@%s|200"
    "Pinterest|https://www.pinterest.com/%s|200"
    "Twitch|https://www.twitch.tv/%s|200"
    "Medium|https://medium.com/@%s|200"
    "Dev.to|https://dev.to/%s|200"
    "Keybase|https://keybase.io/%s|200"
    "Mastodon.social|https://mastodon.social/@%s|200"
    "HackerNews|https://news.ycombinator.com/user?id=%s|200"
    "Steam|https://steamcommunity.com/id/%s|200"
    "Spotify|https://open.spotify.com/user/%s|200"
    "SoundCloud|https://soundcloud.com/%s|200"
    "Flickr|https://www.flickr.com/people/%s|200"
    "Vimeo|https://vimeo.com/%s|200"
    "Patreon|https://www.patreon.com/%s|200"
)

echo "{"
echo "  \"username\": \"$USERNAME\","
echo "  \"timestamp\": \"$(date -Iseconds)\","
echo "  \"results\": ["

first=true
for site_info in "${SITES[@]}"; do
    IFS='|' read -r name url_pattern expected_code <<< "$site_info"
    url=$(printf "$url_pattern" "$USERNAME")

    # Check the URL
    http_code=$(curl -s -o /dev/null -w "%{http_code}" \
        --max-time 5 \
        -A "Mozilla/5.0 (compatible; OSINT research)" \
        -L "$url" 2>/dev/null || echo "000")

    if [[ "$http_code" == "$expected_code" ]]; then
        if [[ "$first" != "true" ]]; then
            echo ","
        fi
        echo -n "    {\"site\": \"$name\", \"url\": \"$url\", \"status\": \"found\"}"
        first=false
    fi
done

echo ""
echo "  ],"
echo "  \"note\": \"For comprehensive search, use https://whatsmyname.app\""
echo "}"
