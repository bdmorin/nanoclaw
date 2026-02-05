#!/bin/bash
# Phone Number Intelligence
# Usage: ./phone-lookup.sh <phone_number>
#
# Gathers public info about a phone number
# Note: Most detailed lookups require API keys

set -euo pipefail

PHONE="${1:-}"

if [[ -z "$PHONE" ]]; then
    echo "Usage: $0 <phone_number>" >&2
    echo "Format: Include country code, e.g., +15551234567 or 15551234567" >&2
    exit 1
fi

# Clean the phone number (remove spaces, dashes, parentheses)
CLEAN_PHONE=$(echo "$PHONE" | tr -d ' ()-')
# Ensure it starts with + if it's international format
if [[ ! "$CLEAN_PHONE" =~ ^\+ ]] && [[ ${#CLEAN_PHONE} -gt 10 ]]; then
    CLEAN_PHONE="+$CLEAN_PHONE"
fi

echo "{"
echo "  \"phone\": \"$CLEAN_PHONE\","
echo "  \"timestamp\": \"$(date -Iseconds)\","
echo "  \"analysis\": {"

# Basic format analysis
if [[ "$CLEAN_PHONE" =~ ^\+1[0-9]{10}$ ]]; then
    echo "    \"country\": \"United States/Canada\","
    echo "    \"format\": \"NANP (North American)\","
    # Extract area code
    area_code="${CLEAN_PHONE:2:3}"
    echo "    \"area_code\": \"$area_code\","
elif [[ "$CLEAN_PHONE" =~ ^\+44 ]]; then
    echo "    \"country\": \"United Kingdom\","
    echo "    \"format\": \"UK\","
elif [[ "$CLEAN_PHONE" =~ ^\+49 ]]; then
    echo "    \"country\": \"Germany\","
    echo "    \"format\": \"German\","
elif [[ "$CLEAN_PHONE" =~ ^\+33 ]]; then
    echo "    \"country\": \"France\","
    echo "    \"format\": \"French\","
elif [[ "$CLEAN_PHONE" =~ ^\+91 ]]; then
    echo "    \"country\": \"India\","
    echo "    \"format\": \"Indian\","
else
    echo "    \"country\": \"Unknown\","
    echo "    \"format\": \"Unknown\","
fi

# Check if it looks like a mobile or landline (US only)
if [[ "$CLEAN_PHONE" =~ ^\+1 ]]; then
    # Very rough heuristic - not reliable
    echo "    \"type_guess\": \"Cannot determine without carrier lookup\","
fi

echo "    \"digits\": ${#CLEAN_PHONE}"
echo "  },"

# Suggest manual lookups
echo "  \"manual_checks\": ["
echo "    {\"service\": \"NumVerify\", \"url\": \"https://numverify.com/\", \"note\": \"Carrier lookup (API key required)\"},"
echo "    {\"service\": \"Twilio Lookup\", \"url\": \"https://www.twilio.com/lookup\", \"note\": \"Carrier + caller name (paid)\"},"
echo "    {\"service\": \"PhoneInfoga\", \"url\": \"https://github.com/sundowndev/phoneinfoga\", \"note\": \"OSINT tool for phones\"},"
echo "    {\"service\": \"Truecaller\", \"url\": \"https://www.truecaller.com/\", \"note\": \"Caller ID database\"},"
echo "    {\"service\": \"Google Search\", \"url\": \"https://www.google.com/search?q=\\\"$CLEAN_PHONE\\\"\", \"note\": \"Search for the number\"}"
echo "  ],"

# OSINT tips
echo "  \"tips\": ["
echo "    \"Search the number in quotes on Google\","
echo "    \"Check social media for the number\","
echo "    \"Search messaging apps (WhatsApp, Telegram) if ethical\","
echo "    \"Check public records/white pages for landlines\""
echo "  ]"
echo "}"
