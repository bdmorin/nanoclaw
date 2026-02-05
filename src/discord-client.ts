/**
 * Discord Client for NanoClaw
 * Connects to Discord and routes messages to the agent system
 */
import {
  Client,
  Events,
  GatewayIntentBits,
  Message,
  PartialMessage,
  TextChannel,
  DMChannel,
  NewsChannel,
} from 'discord.js';

import { ASSISTANT_NAME, TRIGGER_PATTERN } from './config.js';
import { logger } from './logger.js';
import { NewMessage } from './types.js';

let client: Client | null = null;
let messageHandler: ((msg: NewMessage) => void) | null = null;
let metadataHandler: ((jid: string, timestamp: string) => void) | null = null;

// Convert Discord channel ID to JID format
export function discordToJid(channelId: string, guildId?: string): string {
  if (guildId) {
    return `discord::${guildId}::${channelId}`;
  }
  // DM channel
  return `discord::dm::${channelId}`;
}

// Parse JID back to Discord IDs
export function jidToDiscord(jid: string): {
  channelId: string;
  guildId?: string;
} | null {
  if (!jid.startsWith('discord::')) return null;
  const parts = jid.split('::');
  if (parts.length === 3) {
    if (parts[1] === 'dm') {
      return { channelId: parts[2] };
    }
    return { guildId: parts[1], channelId: parts[2] };
  }
  return null;
}

// Check if a JID is a Discord JID
export function isDiscordJid(jid: string): boolean {
  return jid.startsWith('discord::');
}

// Convert Discord message to NewMessage format
function discordToNewMessage(msg: Message): NewMessage {
  const jid = discordToJid(msg.channelId, msg.guildId || undefined);
  return {
    id: msg.id,
    chat_jid: jid,
    sender: msg.author.id,
    sender_name: msg.author.displayName || msg.author.username,
    content: msg.content,
    timestamp: msg.createdAt.toISOString(),
  };
}

export interface DiscordConfig {
  token: string;
  onMessage: (msg: NewMessage) => void;
  onMetadata: (jid: string, timestamp: string) => void;
  registeredChannels: () => Set<string>;
}

export async function connectDiscord(config: DiscordConfig): Promise<Client> {
  messageHandler = config.onMessage;
  metadataHandler = config.onMetadata;

  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
    ],
  });

  client.once(Events.ClientReady, (c) => {
    logger.info({ user: c.user.tag }, 'Connected to Discord');
  });

  client.on(Events.MessageCreate, (msg) => {
    // Ignore bot messages
    if (msg.author.bot) return;

    const jid = discordToJid(msg.channelId, msg.guildId || undefined);
    const timestamp = msg.createdAt.toISOString();

    logger.debug(
      { jid, channelId: msg.channelId, guildId: msg.guildId, content: msg.content.slice(0, 50) },
      'Discord message received',
    );

    // Store metadata for all messages (for channel discovery)
    if (metadataHandler) {
      metadataHandler(jid, timestamp);
    }

    // Only process messages from registered channels
    const registered = config.registeredChannels();
    logger.debug({ registered: Array.from(registered), jid }, 'Checking registration');
    if (registered.has(jid) && messageHandler) {
      logger.info({ jid }, 'Processing registered channel message');
      const newMessage = discordToNewMessage(msg);
      messageHandler(newMessage);
    }
  });

  client.on(Events.Error, (err) => {
    logger.error({ err }, 'Discord client error');
  });

  await client.login(config.token);
  return client;
}

export async function sendDiscordMessage(
  jid: string,
  text: string,
): Promise<void> {
  if (!client) {
    logger.error('Discord client not initialized');
    return;
  }

  const parsed = jidToDiscord(jid);
  if (!parsed) {
    logger.error({ jid }, 'Invalid Discord JID');
    return;
  }

  try {
    const channel = await client.channels.fetch(parsed.channelId);
    if (
      channel &&
      (channel instanceof TextChannel ||
        channel instanceof DMChannel ||
        channel instanceof NewsChannel)
    ) {
      // Discord has a 2000 character limit - split long messages
      const MAX_LENGTH = 1990; // Leave room for potential formatting
      if (text.length <= MAX_LENGTH) {
        await channel.send(text);
      } else {
        // Split on newlines when possible, otherwise hard split
        const chunks: string[] = [];
        let remaining = text;
        while (remaining.length > 0) {
          if (remaining.length <= MAX_LENGTH) {
            chunks.push(remaining);
            break;
          }
          // Try to split at a newline
          let splitAt = remaining.lastIndexOf('\n', MAX_LENGTH);
          if (splitAt === -1 || splitAt < MAX_LENGTH / 2) {
            // No good newline, try space
            splitAt = remaining.lastIndexOf(' ', MAX_LENGTH);
          }
          if (splitAt === -1 || splitAt < MAX_LENGTH / 2) {
            // Hard split
            splitAt = MAX_LENGTH;
          }
          chunks.push(remaining.slice(0, splitAt));
          remaining = remaining.slice(splitAt).trimStart();
        }
        for (const chunk of chunks) {
          await channel.send(chunk);
        }
      }
      logger.info({ jid, length: text.length }, 'Discord message sent');
    } else {
      logger.error({ jid }, 'Channel not found or not a text channel');
    }
  } catch (err) {
    logger.error({ jid, err }, 'Failed to send Discord message');
  }
}

export async function setDiscordTyping(
  jid: string,
  isTyping: boolean,
): Promise<void> {
  if (!client || !isTyping) return;

  const parsed = jidToDiscord(jid);
  if (!parsed) return;

  try {
    const channel = await client.channels.fetch(parsed.channelId);
    if (
      channel &&
      (channel instanceof TextChannel ||
        channel instanceof DMChannel ||
        channel instanceof NewsChannel)
    ) {
      await channel.sendTyping();
    }
  } catch (err) {
    logger.debug({ jid, err }, 'Failed to set typing indicator');
  }
}

export function getDiscordClient(): Client | null {
  return client;
}

export function disconnectDiscord(): void {
  if (client) {
    client.destroy();
    client = null;
    logger.info('Discord client disconnected');
  }
}
