#!/bin/bash
# Generate oilcloth avatar using Gemini API

GEMINI_API_KEY="${GEMINI_API_KEY:-$1}"

if [ -z "$GEMINI_API_KEY" ]; then
    echo "Usage: GEMINI_API_KEY=your-key ./generate-avatar.sh"
    echo "   or: ./generate-avatar.sh your-key"
    exit 1
fi

# Oilcloth identity:
# - Named after Furiosa (Mad Max: Fury Road)
# - She/her, protective, gets people home safe
# - Methodical, competent, ethical warrior
# - Intelligence support for resistance operations
# - "Remember me?" energy
# - Oilcloth = durable protective covering

PROMPT="Abstract portrait icon inspired by Furiosa from Mad Max. A weathered but determined feminine silhouette with short cropped hair, one eye visible and watchful. Rendered in deep charcoal and rust orange tones, like oil-stained canvas. Industrial texture, war rig aesthetic. Protective, vigilant, survivor energy. Minimalist but fierce. Works as a small circular avatar. No text. Style: graphic novel meets propaganda poster meets road warrior."

echo "Generating oilcloth avatar..."

RESPONSE=$(curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"contents\": [{
      \"parts\": [{\"text\": \"$PROMPT\"}]
    }]
  }")

# Check for errors
if echo "$RESPONSE" | grep -q '"error"'; then
    echo "API Error:"
    echo "$RESPONSE" | jq '.error'
    exit 1
fi

# Extract base64 image data
IMAGE_DATA=$(echo "$RESPONSE" | jq -r '.candidates[0].content.parts[] | select(.inlineData) | .inlineData.data')

if [ -z "$IMAGE_DATA" ] || [ "$IMAGE_DATA" = "null" ]; then
    echo "No image data in response. Full response:"
    echo "$RESPONSE" | jq '.'
    exit 1
fi

# Save the image
OUTPUT_FILE="oilcloth-avatar-$(date +%Y%m%d-%H%M%S).png"
echo "$IMAGE_DATA" | base64 -d > "$OUTPUT_FILE"

echo "Avatar saved to: $OUTPUT_FILE"
echo "File size: $(ls -lh "$OUTPUT_FILE" | awk '{print $5}')"
