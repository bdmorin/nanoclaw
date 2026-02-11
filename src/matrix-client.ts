/**
 * Matrix Client for NanoClaw
 * Connects to Matrix homeserver with E2E encryption and routes messages to the agent system.
 * Follows the same interface pattern as discord-client.ts.
 */
// IndexedDB polyfill must be loaded BEFORE matrix-js-sdk so the WASM crypto can persist keys
import 'fake-indexeddb/auto';

import * as sdk from 'matrix-js-sdk';
import {
  ClientEvent,
  EventType,
  RoomEvent,
  MatrixEventEvent,
  KnownMembership,
} from 'matrix-js-sdk';
import type { Room } from 'matrix-js-sdk';
import type { MatrixEvent } from 'matrix-js-sdk';
import fs from 'fs';

import { ASSISTANT_NAME, TRIGGER_PATTERN } from './config.js';
import { logger } from './logger.js';
import { NewMessage } from './types.js';

// Suppress matrix-js-sdk's noisy internal logger
try {
  const matrixLogger = (sdk as any).logger;
  if (matrixLogger?.setLevel) {
    matrixLogger.setLevel('warn');
  }
} catch {
  // Ignore if logger API changed
}

let client: sdk.MatrixClient | null = null;
let messageHandler: ((msg: NewMessage) => void) | null = null;
let metadataHandler: ((jid: string, timestamp: string) => void) | null = null;
let botUserId: string = '';

// Convert Matrix room ID to JID format
export function matrixToJid(roomId: string): string {
  return `matrix::${roomId}`;
}

// Parse JID back to Matrix room ID
export function jidToMatrix(jid: string): string | null {
  if (!jid.startsWith('matrix::')) return null;
  return jid.slice('matrix::'.length);
}

// Check if a JID is a Matrix JID
export function isMatrixJid(jid: string): boolean {
  return jid.startsWith('matrix::');
}

// Convert Matrix event to NewMessage format
function matrixToNewMessage(event: MatrixEvent, room: Room | undefined): NewMessage {
  const roomId = event.getRoomId() || '';
  const jid = matrixToJid(roomId);
  const sender = event.getSender() || '';
  const content = event.getContent();

  // Get display name from room member state
  let senderName = sender.split(':')[0].replace('@', '');
  if (room) {
    const member = room.getMember(sender);
    if (member?.name) {
      senderName = member.name;
    }
  }

  return {
    id: event.getId() || `matrix-${Date.now()}`,
    chat_jid: jid,
    sender,
    sender_name: senderName,
    content: content.body || '',
    timestamp: new Date(event.getTs()).toISOString(),
  };
}

/**
 * Process a decrypted message event — called both from the timeline handler
 * (for unencrypted messages) and from the decrypted event handler (for E2E).
 */
function handleMessageEvent(event: MatrixEvent, room: Room | undefined, config: MatrixConfig): void {
  const sender = event.getSender();
  if (sender === botUserId) return;

  const roomId = event.getRoomId();
  if (!roomId) return;

  const jid = matrixToJid(roomId);
  const timestamp = new Date(event.getTs()).toISOString();
  const content = event.getContent();

  logger.info(
    { jid, roomId, sender, body: (content.body || '').slice(0, 80) },
    'Matrix message received',
  );

  if (metadataHandler) {
    metadataHandler(jid, timestamp);
  }

  const registered = config.registeredChannels();
  if (registered.has(jid) && messageHandler) {
    logger.info({ jid, sender }, 'Dispatching to message handler');
    const newMessage = matrixToNewMessage(event, room);
    messageHandler(newMessage);
  }
}

export interface MatrixConfig {
  homeserver: string;
  userId: string;
  accessToken: string;
  deviceId: string;
  storePath: string;
  onMessage: (msg: NewMessage) => void;
  onMetadata: (jid: string, timestamp: string) => void;
  registeredChannels: () => Set<string>;
}

export async function connectMatrix(config: MatrixConfig): Promise<sdk.MatrixClient> {
  messageHandler = config.onMessage;
  metadataHandler = config.onMetadata;
  botUserId = config.userId;

  // Ensure crypto store directory exists
  fs.mkdirSync(config.storePath, { recursive: true });

  client = sdk.createClient({
    baseUrl: config.homeserver,
    userId: config.userId,
    accessToken: config.accessToken,
    deviceId: config.deviceId,
    timelineSupport: true,
  });

  // Initialize E2E encryption with Rust crypto backend
  try {
    await client.initRustCrypto({
      useIndexedDB: true,
      storagePassword: `nanoclaw-${config.deviceId}`,
      cryptoDatabasePrefix: config.storePath,
    });
    logger.info('Matrix E2E encryption initialized (Rust crypto)');
  } catch (err) {
    logger.error({ err }, 'Failed to initialize Matrix E2E crypto - messages in encrypted rooms will fail');
  }

  // Auto-join rooms when invited
  client.on(RoomEvent.MyMembership, (room: Room, membership: string) => {
    if (membership === KnownMembership.Invite) {
      client!.joinRoom(room.roomId)
        .then(() => {
          logger.info({ roomId: room.roomId, roomName: room.name }, 'Auto-joined Matrix room');
        })
        .catch((err) => {
          logger.error({ roomId: room.roomId, err }, 'Failed to auto-join Matrix room');
        });
    }
  });

  // Track which events we've already processed (avoid double-processing
  // when an encrypted event gets decrypted after initially hitting the timeline)
  const processedEvents = new Set<string>();

  // Handle timeline events (fires for both encrypted and unencrypted)
  client.on(RoomEvent.Timeline, (event: MatrixEvent, room: Room | undefined, toStartOfTimeline: boolean | undefined) => {
    if (toStartOfTimeline) return;

    const eventType = event.getType();
    const eventId = event.getId() || '';

    // For encrypted events, the type will be m.room.encrypted until decrypted.
    // The SDK decrypts async and re-fires a 'Event.decrypted' event.
    // We handle decrypted messages in that handler below.
    if (eventType === 'm.room.encrypted') {
      logger.debug({ eventId, roomId: event.getRoomId() }, 'Encrypted event received, waiting for decryption');
      return;
    }

    if (eventType !== 'm.room.message') return;

    // Mark as processed so the decrypted handler doesn't double-process
    if (processedEvents.has(eventId)) return;
    processedEvents.add(eventId);

    // Cap the set size
    if (processedEvents.size > 500) {
      const iter = processedEvents.values();
      for (let i = 0; i < 200; i++) iter.next();
      // Can't easily trim a Set, just rebuild
      const keep = [...processedEvents].slice(-300);
      processedEvents.clear();
      keep.forEach(id => processedEvents.add(id));
    }

    handleMessageEvent(event, room, config);
  });

  // Handle decrypted events — this fires when an m.room.encrypted event
  // gets successfully decrypted by the Rust crypto backend
  client.on(MatrixEventEvent.Decrypted, (event: MatrixEvent) => {
    const eventId = event.getId() || '';

    // Skip if we already processed this event
    if (processedEvents.has(eventId)) return;

    // Only handle message events
    if (event.getType() !== 'm.room.message') return;

    processedEvents.add(eventId);

    const roomId = event.getRoomId();
    const room = roomId ? client?.getRoom(roomId) ?? undefined : undefined;

    logger.debug({ eventId, roomId }, 'Decrypted event processed');
    handleMessageEvent(event, room, config);
  });

  // Handle sync errors
  client.on(ClientEvent.Sync, (state: string, prevState: string | null, data?: any) => {
    if (state === 'ERROR') {
      logger.error({ prevState, error: data?.error?.message }, 'Matrix sync error');
    } else if (state === 'RECONNECTING') {
      logger.warn('Matrix client reconnecting...');
    }
  });

  // Start the sync loop
  await client.startClient({
    initialSyncLimit: 10,
    pollTimeout: 30000,
  });

  // Wait for initial sync to complete
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Matrix initial sync timed out after 60s'));
    }, 60000);

    client!.once(ClientEvent.Sync, (state: string) => {
      clearTimeout(timeout);
      if (state === 'PREPARED' || state === 'SYNCING') {
        logger.info({ userId: config.userId }, 'Connected to Matrix');
        resolve();
      } else {
        reject(new Error(`Matrix sync failed with state: ${state}`));
      }
    });
  });

  return client;
}

export async function sendMatrixMessage(
  jid: string,
  text: string,
): Promise<void> {
  if (!client) {
    logger.error('Matrix client not initialized');
    return;
  }

  const roomId = jidToMatrix(jid);
  if (!roomId) {
    logger.error({ jid }, 'Invalid Matrix JID');
    return;
  }

  try {
    // Matrix has a ~65KB limit per event but we chunk at 4000 for readability
    const MAX_LENGTH = 4000;
    if (text.length <= MAX_LENGTH) {
      await client.sendTextMessage(roomId, text);
    } else {
      const chunks: string[] = [];
      let remaining = text;
      while (remaining.length > 0) {
        if (remaining.length <= MAX_LENGTH) {
          chunks.push(remaining);
          break;
        }
        let splitAt = remaining.lastIndexOf('\n', MAX_LENGTH);
        if (splitAt === -1 || splitAt < MAX_LENGTH / 2) {
          splitAt = remaining.lastIndexOf(' ', MAX_LENGTH);
        }
        if (splitAt === -1 || splitAt < MAX_LENGTH / 2) {
          splitAt = MAX_LENGTH;
        }
        chunks.push(remaining.slice(0, splitAt));
        remaining = remaining.slice(splitAt).trimStart();
      }
      for (const chunk of chunks) {
        await client.sendTextMessage(roomId, chunk);
      }
    }
    logger.info({ jid, length: text.length }, 'Matrix message sent');
  } catch (err) {
    logger.error({ jid, err }, 'Failed to send Matrix message');
  }
}

export async function setMatrixTyping(
  jid: string,
  isTyping: boolean,
): Promise<void> {
  if (!client) return;

  const roomId = jidToMatrix(jid);
  if (!roomId) return;

  try {
    await client.sendTyping(roomId, isTyping, isTyping ? 30000 : 0);
  } catch (err) {
    logger.debug({ jid, err }, 'Failed to set Matrix typing indicator');
  }
}

export function getMatrixClient(): sdk.MatrixClient | null {
  return client;
}

export async function disconnectMatrix(): Promise<void> {
  if (client) {
    client.stopClient();
    client = null;
    logger.info('Matrix client disconnected');
  }
}
