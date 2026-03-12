/**
 * Text-to-Speech via ElevenLabs API.
 * Generates audio from text using oilcloth's custom voice.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { logger } from './logger.js';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'vA14s8N3dYt3Y0g5ba9b';
const MODEL_ID = 'eleven_multilingual_v2';

export interface TtsOptions {
  /** 0-1, higher = more consistent (default: 0.5) */
  stability?: number;
  /** 0-1, higher = closer to original voice (default: 0.75) */
  similarityBoost?: number;
  /** 0-1, higher = more expressive (default: 0.4) */
  style?: number;
}

/**
 * Generate speech audio from text using ElevenLabs.
 * Returns the path to a temporary OGG file (Telegram-compatible).
 */
export async function generateSpeech(
  text: string,
  options?: TtsOptions,
): Promise<string | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    logger.warn('ELEVENLABS_API_KEY not set, cannot generate speech');
    return null;
  }

  try {
    const response = await fetch(
      `${ELEVENLABS_API_URL}/${VOICE_ID}?output_format=ogg_opus`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: MODEL_ID,
          voice_settings: {
            stability: options?.stability ?? 0.5,
            similarity_boost: options?.similarityBoost ?? 0.75,
            style: options?.style ?? 0.4,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(
        { status: response.status, error: errorText },
        'ElevenLabs API error',
      );
      return null;
    }

    // Write to temp file
    const tmpDir = path.join(os.tmpdir(), 'nanoclaw-tts');
    fs.mkdirSync(tmpDir, { recursive: true });
    const filename = `voice-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.ogg`;
    const filepath = path.join(tmpDir, filename);

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filepath, buffer);

    logger.info(
      { chars: text.length, bytes: buffer.length, path: filepath },
      'TTS audio generated',
    );

    return filepath;
  } catch (err) {
    logger.error({ err }, 'TTS generation failed');
    return null;
  }
}

/**
 * Clean up a temporary TTS file after sending.
 */
export function cleanupTtsFile(filepath: string): void {
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  } catch {
    // Non-critical, temp files get cleaned by OS eventually
  }
}
