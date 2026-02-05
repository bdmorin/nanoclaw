#!/bin/bash
# Email Intelligence Lookup
# Usage: ./email-lookup.sh <email>
#
# Checks breach databases and extracts public info about an email

set -euo pipefail

EMAIL="${1:-}"

if [[ -z "$EMAIL" ]]; then
    echo "Usage: $0 <email>" >&2
    exit 1
fi

# Extract domain for additional checks
DOMAIN="${EMAIL#*@}"

echo "{"
echo "  \"email\": \"$EMAIL\","
echo "  \"domain\": \"$DOMAIN\","
echo "  \"timestamp\": \"$(date -Iseconds)\","
echo "  \"checks\": {"

# Check HaveIBeenPwned (public API - rate limited, may fail)
echo "    \"hibp\": {"
hibp_response=$(curl -s --max-time 10 \
    -H "User-Agent: OSINT-Research" \
    "https://haveibeenpwned.com/api/v2/breachedaccount/${EMAIL}?truncateResponse=true" 2>/dev/null || echo "error")

if [[ "$hibp_response" == "error" ]] || [[ -z "$hibp_response" ]]; then
    echo "      \"status\": \"error_or_rate_limited\","
    echo "      \"breaches\": []"
elif [[ "$hibp_response" == "[]" ]] || echo "$hibp_response" | grep -q "not found"; then
    echo "      \"status\": \"no_breaches_found\","
    echo "      \"breaches\": []"
else
    echo "      \"status\": \"breaches_found\","
    # Extract breach names
    breaches=$(echo "$hibp_response" | jq -r '.[].Name' 2>/dev/null | tr '\n' ',' | sed 's/,$//')
    echo "      \"breaches\": [$(echo "$breaches" | sed 's/,/", "/g' | sed 's/^/"/;s/$/"/')]"
fi
echo "    },"

# Check email domain MX records (is it a real domain?)
echo "    \"domain_check\": {"
mx_records=$(dig +short MX "$DOMAIN" 2>/dev/null | head -3 || echo "")
if [[ -n "$mx_records" ]]; then
    echo "      \"has_mx\": true,"
    echo "      \"mx_records\": $(echo "$mx_records" | jq -R -s 'split("\n") | map(select(length > 0))')"
else
    echo "      \"has_mx\": false,"
    echo "      \"mx_records\": []"
fi
echo "    },"

# Check if it's a disposable email domain
DISPOSABLE_DOMAINS="tempmail.com mailinator.com guerrillamail.com 10minutemail.com throwaway.email temp-mail.org fakeinbox.com"
is_disposable=false
for disp in $DISPOSABLE_DOMAINS; do
    if [[ "$DOMAIN" == *"$disp"* ]]; then
        is_disposable=true
        break
    fi
done
echo "    \"disposable_check\": {"
echo "      \"is_likely_disposable\": $is_disposable"
echo "    }"

echo "  },"

# Suggestions for manual verification
echo "  \"manual_checks\": ["
echo "    {\"service\": \"Epieos\", \"url\": \"https://epieos.com/?q=$EMAIL\", \"note\": \"Google account info, connected accounts\"},"
echo "    {\"service\": \"Hunter.io\", \"url\": \"https://hunter.io/email-verifier\", \"note\": \"Email verification, company lookup\"},"
echo "    {\"service\": \"Holehe\", \"url\": \"https://github.com/megadose/holehe\", \"note\": \"Python tool, checks 120+ sites\"}"
echo "  ]"
echo "}"
