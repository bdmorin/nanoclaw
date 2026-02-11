# TTS Interface Contract

The video pipeline needs a single endpoint that converts text to audio. The backend is swappable — Kokoro, ElevenLabs, or anything else that speaks this API.

## Required Interface

OpenAI-compatible `/v1/audio/speech` endpoint.

```
POST /v1/audio/speech
Content-Type: application/json

{
  "model": "kokoro",
  "input": "Geraldo Lunas Campos. Fifty-five. Cuban. Father of four.",
  "voice": "af_heart",
  "response_format": "wav",
  "speed": 0.95
}

→ Returns: audio/wav binary
```

## Backends

### ElevenLabs (primary — production English narration)

- **Endpoint**: `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`
- **API key**: `ELEVENLABS_API_KEY` in `.env` (allowlisted in container-runner.ts)
- **Model**: `eleven_multilingual_v2`
- **Tier**: Creator ($22/mo, ~107K chars/month)
- **Voice**: TBD — user is auditioning voices. May clone Andrea's voice.
- **Voice candidates tested**: Sarah (EXAVITQu4vr4xnSDxMaL), Matilda (XrExE9yKIg1WjnnlVkGX), River (SAz9YHcvj6GT2YYXdXww), Bella (hpp4J3VqNfWAUOO0d1Us), Alice, Lily
- **Settings**: `voice_settings: { stability, similarity_boost, style }` — vary per section type
  - Emotional sections: `stability: 0.35-0.5, style: 0.5-0.7`
  - Factual sections: `stability: 0.7, style: 0.2`
  - Name intros: `stability: 0.5, style: 0.4`
- **Pronunciation**: SSML phoneme tags DON'T work. Use text normalization instead:
  - Spanish names: spell phonetically ("Heraldo" not "Geraldo" for soft G→H)
  - Numbers: spell out ("nineteen ninety-six" not "1996")
  - Abbreviations: expand ("World War Two" not "World War II")
- **Cost per video**: ~1,800 chars for full 5-section script ≈ ~60 videos/month on Creator

### Kokoro-FastAPI (secondary — prototyping, multilingual)

- **Endpoint**: `http://localhost:8880/v1/audio/speech`
- **Model**: `kokoro` (82M params)
- **Running on**: RTX A2000 12GB (device=1), Docker container `kokoro-tts`
- **Voices**: 67 voices including Spanish (ef_dora), French (ff_siwis), etc.
- **Use for**: Draft renders, iteration, Spanish/multilingual versions
- **Limitation**: No emotion control. Sounds "singsong" on serious content.
- **Cost**: $0

## What the Pipeline Does

For each script section (name, moment, record, pattern, question):

1. Send the narration text to TTS endpoint
2. Receive WAV audio back
3. Measure duration of returned audio (this is the TRUE timing, not the estimate)
4. Pass audio file + actual duration to Remotion for composition
5. Visual layer timing adjusts to match actual audio duration

## Audio Requirements for Remotion

- **Format**: WAV (uncompressed) for Remotion input, MP3 for final export
- **Sample rate**: 24000 Hz (Kokoro default) or 44100 Hz
- **Channels**: Mono (narration is single-voice)
- **Bit depth**: 16-bit minimum

## Section-by-Section TTS Calls

The pipeline makes 5 TTS calls per video, one per script section:

```typescript
const sections = ['name', 'moment', 'record', 'pattern', 'question'];

for (const section of sections) {
  const audio = await tts.speak(script[section], { voice, speed: 0.95 });
  const duration = getAudioDuration(audio);
  assets[section] = { audio, duration };
}
```

The visual agent's timing estimates are overridden by actual audio duration. Audio is truth.

## Voice Selection Guidance

For documentary narration about detention deaths:
- Speed 0.9-0.95 (slightly slower than conversational)
- Warm, clear voice — not newscaster, not dramatic
- Consistent voice across all sections of one video
- Voice may vary between videos (different stories, different voices)
