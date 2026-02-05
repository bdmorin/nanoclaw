#!/bin/bash
# Content Aggregation - Search Lemmy instances and news aggregators
# Usage: ./content-search.sh <query> [limit]
#
# Searches federated platforms for discussions and news

set -euo pipefail

QUERY="${1:-}"
LIMIT="${2:-10}"

if [[ -z "$QUERY" ]]; then
    echo "Usage: $0 <query> [limit]" >&2
    exit 1
fi

# URL encode the query
ENCODED_QUERY=$(echo -n "$QUERY" | jq -sRr @uri)

# Lemmy instances to search
LEMMY_INSTANCES=(
    "lemmy.world"
    "lemmy.ml"
    "programming.dev"
    "lemm.ee"
    "sh.itjust.works"
)

# Output header
echo "{"
echo "  \"query\": \"$QUERY\","
echo "  \"timestamp\": \"$(date -Iseconds)\","
echo "  \"sources\": {"

# Search Lemmy instances
echo "    \"lemmy\": ["
first_lemmy=true
for instance in "${LEMMY_INSTANCES[@]}"; do
    url="https://${instance}/api/v3/search?q=${ENCODED_QUERY}&type_=Posts&limit=${LIMIT}&sort=TopAll"

    response=$(curl -s --max-time 10 "$url" 2>/dev/null || echo '{"posts":[]}')

    # Extract posts
    posts=$(echo "$response" | jq -c '.posts // []' 2>/dev/null || echo '[]')

    if [[ "$posts" != "[]" ]] && [[ -n "$posts" ]]; then
        echo "$posts" | jq -c '.[]' 2>/dev/null | while read -r post; do
            title=$(echo "$post" | jq -r '.post.name // "Untitled"')
            post_url=$(echo "$post" | jq -r '.post.ap_id // .post.url // ""')
            community=$(echo "$post" | jq -r '.community.name // "unknown"')
            score=$(echo "$post" | jq -r '.counts.score // 0')

            if [[ "$first_lemmy" != "true" ]]; then
                echo ","
            fi
            echo -n "      {\"instance\": \"$instance\", \"title\": $(echo "$title" | jq -R .), \"url\": \"$post_url\", \"community\": \"$community\", \"score\": $score}"
            first_lemmy=false
        done
    fi
done
echo ""
echo "    ],"

# Search Hacker News (tech-focused alternative)
echo "    \"hackernews\": ["
hn_response=$(curl -s --max-time 10 "https://hn.algolia.com/api/v1/search?query=${ENCODED_QUERY}&tags=story&hitsPerPage=${LIMIT}" 2>/dev/null || echo '{"hits":[]}')
first_hn=true
echo "$hn_response" | jq -c '.hits // []' 2>/dev/null | jq -c '.[]' 2>/dev/null | while read -r hit; do
    title=$(echo "$hit" | jq -r '.title // "Untitled"')
    url=$(echo "$hit" | jq -r '.url // ""')
    points=$(echo "$hit" | jq -r '.points // 0')
    hn_url="https://news.ycombinator.com/item?id=$(echo "$hit" | jq -r '.objectID')"

    if [[ "$first_hn" != "true" ]]; then
        echo ","
    fi
    echo -n "      {\"title\": $(echo "$title" | jq -R .), \"url\": \"$url\", \"discussion\": \"$hn_url\", \"points\": $points}"
    first_hn=false
done
echo ""
echo "    ],"

# Search Lobsters (tech-focused)
echo "    \"lobsters\": ["
lobsters_response=$(curl -s --max-time 10 "https://lobste.rs/search.json?q=${ENCODED_QUERY}&what=stories" 2>/dev/null || echo '{"results":[]}')
first_lob=true
echo "$lobsters_response" | jq -c '.results[:'"$LIMIT"'] // []' 2>/dev/null | jq -c '.[]' 2>/dev/null | while read -r story; do
    title=$(echo "$story" | jq -r '.title // "Untitled"')
    url=$(echo "$story" | jq -r '.url // ""')
    score=$(echo "$story" | jq -r '.score // 0')
    lob_url=$(echo "$story" | jq -r '.short_id_url // ""')

    if [[ "$first_lob" != "true" ]]; then
        echo ","
    fi
    echo -n "      {\"title\": $(echo "$title" | jq -R .), \"url\": \"$url\", \"discussion\": \"$lob_url\", \"score\": $score}"
    first_lob=false
done
echo ""
echo "    ]"

echo "  }"
echo "}"
