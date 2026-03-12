import 'dotenv/config';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import {
  ASSISTANT_NAME,
  DATA_DIR,
  IDLE_TIMEOUT,
  MAIN_GROUP_FOLDER,
  POLL_INTERVAL,
  TRIGGER_PATTERN,
  WHATSAPP_ENABLED,
  MATRIX_ENABLED,
  MATRIX_HOMESERVER,
  MATRIX_ACCESS_TOKEN,
  MATRIX_USER_ID,
  MATRIX_DEVICE_ID,
  DISCOURSE_ENABLED,
  DISCOURSE_URL,
  DISCOURSE_API_KEY,
  DISCOURSE_BOT_USERNAMES,
  DISCOURSE_DEFAULT_USERNAME,
  DISCOURSE_POLL_INTERVAL,
  DISCOURSE_WEBHOOK_PORT,
  DISCOURSE_WEBHOOK_SECRET,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_BOT_POOL,
} from './config.js';
import { WhatsAppChannel } from './channels/whatsapp.js';
import { DiscourseChannel } from './channels/discourse.js';
import {
  connectTelegram,
  initBotPool,
  sendTelegramMessage,
  sendTelegramVoice,
  sendPoolMessage,
  setTelegramTyping,
  isTelegramConnected,
  stopTelegram,
} from './telegram.js';
import { generateSpeech, cleanupTtsFile } from './tts.js';
import {
  ContainerOutput,
  runContainerAgent,
  writeGroupsSnapshot,
  writeTasksSnapshot,
} from './container-runner.js';
import {
  getAllChats,
  getAllRegisteredGroups,
  getAllSessions,
  getAllTasks,
  getDistinctChatJids,
  getMessagesSince,
  getNewMessages,
  getRouterState,
  initDatabase,
  setRegisteredGroup,
  setRouterState,
  setSession,
  storeChatMetadata,
  storeMessage,
} from './db.js';
import { GroupQueue } from './group-queue.js';
import { startIpcWatcher } from './ipc.js';
import { formatMessages, formatOutbound } from './router.js';
import { startSchedulerLoop } from './task-scheduler.js';
import { NewMessage, RegisteredGroup } from './types.js';
import { logger } from './logger.js';

// Re-export for backwards compatibility during refactor
export { escapeXml, formatMessages } from './router.js';

let lastTimestamp = '';
let sessions: Record<string, string> = {};
let registeredGroups: Record<string, RegisteredGroup> = {};
let lastAgentTimestamp: Record<string, string> = {};
let messageLoopRunning = false;

let whatsapp: WhatsAppChannel | null = null;
let matrixConnected = false;
let discourse: DiscourseChannel | null = null;
const queue = new GroupQueue();

// Multi-channel send: route outbound messages to the right channel
async function sendToChannel(jid: string, text: string): Promise<void> {
  if (jid.startsWith('discourse::') && discourse?.isConnected()) {
    await discourse.sendMessage(jid, text);
  } else if (jid.startsWith('matrix::') && matrixConnected) {
    const { sendMatrixMessage } = await import('./matrix-client.js');
    await sendMatrixMessage(jid, text);
  } else if (jid.startsWith('tg:') && isTelegramConnected()) {
    await sendTelegramMessage(jid, text);
  } else if (whatsapp) {
    await whatsapp.sendMessage(jid, text);
  }
}

function loadState(): void {
  lastTimestamp = getRouterState('last_timestamp') || '';
  const agentTs = getRouterState('last_agent_timestamp');
  try {
    lastAgentTimestamp = agentTs ? JSON.parse(agentTs) : {};
  } catch {
    logger.warn('Corrupted last_agent_timestamp in DB, resetting');
    lastAgentTimestamp = {};
  }
  sessions = getAllSessions();
  registeredGroups = getAllRegisteredGroups();
  logger.info(
    { groupCount: Object.keys(registeredGroups).length },
    'State loaded',
  );
}

function saveState(): void {
  setRouterState('last_timestamp', lastTimestamp);
  setRouterState(
    'last_agent_timestamp',
    JSON.stringify(lastAgentTimestamp),
  );
}

function registerGroup(jid: string, group: RegisteredGroup): void {
  registeredGroups[jid] = group;
  setRegisteredGroup(jid, group);

  // Create group folder
  const groupDir = path.join(DATA_DIR, '..', 'groups', group.folder);
  fs.mkdirSync(path.join(groupDir, 'logs'), { recursive: true });

  logger.info(
    { jid, name: group.name, folder: group.folder },
    'Group registered',
  );
}

/**
 * Get available groups list for the agent.
 * Returns groups ordered by most recent activity.
 */
export function getAvailableGroups(): import('./container-runner.js').AvailableGroup[] {
  const chats = getAllChats();
  const registeredJids = new Set(Object.keys(registeredGroups));

  return chats
    .filter((c) => c.jid !== '__group_sync__' && c.jid.endsWith('@g.us'))
    .map((c) => ({
      jid: c.jid,
      name: c.name,
      lastActivity: c.last_message_time,
      isRegistered: registeredJids.has(c.jid),
    }));
}

/** @internal - exported for testing */
export function _setRegisteredGroups(groups: Record<string, RegisteredGroup>): void {
  registeredGroups = groups;
}

/**
 * Resolve a JID to its registered group, supporting wildcard JIDs.
 * e.g. "discourse::7" matches "discourse::*"
 */
function resolveGroup(jid: string): { groupJid: string; group: RegisteredGroup } | null {
  // Exact match first
  if (registeredGroups[jid]) return { groupJid: jid, group: registeredGroups[jid] };
  // Wildcard match: "discourse::7" → check "discourse::*"
  const colonIdx = jid.indexOf('::');
  if (colonIdx !== -1) {
    const wildcard = jid.slice(0, colonIdx + 2) + '*';
    if (registeredGroups[wildcard]) return { groupJid: wildcard, group: registeredGroups[wildcard] };
  }
  return null;
}

/**
 * Process all pending messages for a group.
 * Called by the GroupQueue when it's this group's turn.
 */
async function processGroupMessages(chatJid: string): Promise<boolean> {
  const resolved = resolveGroup(chatJid);
  if (!resolved) return true;
  const { group } = resolved;

  const isMainGroup = group.folder === MAIN_GROUP_FOLDER;

  const sinceTimestamp = lastAgentTimestamp[chatJid] || '';
  const missedMessages = getMessagesSince(
    chatJid,
    sinceTimestamp,
    ASSISTANT_NAME,
  );

  if (missedMessages.length === 0) return true;

  // For non-main groups, check if trigger is required and present
  if (!isMainGroup && group.requiresTrigger !== false) {
    const hasTrigger = missedMessages.some((m) =>
      TRIGGER_PATTERN.test(m.content.trim()),
    );
    if (!hasTrigger) return true;
  }

  const prompt = formatMessages(missedMessages);

  // Advance cursor so the piping path in startMessageLoop won't re-fetch
  // these messages. Save the old cursor so we can roll back on error.
  const previousCursor = lastAgentTimestamp[chatJid] || '';
  lastAgentTimestamp[chatJid] =
    missedMessages[missedMessages.length - 1].timestamp;
  saveState();

  logger.info(
    { group: group.name, messageCount: missedMessages.length },
    'Processing messages',
  );

  // Track idle timer for closing stdin when agent is idle
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  const resetIdleTimer = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      logger.debug({ group: group.name }, 'Idle timeout, closing container stdin');
      queue.closeStdin(chatJid);
    }, IDLE_TIMEOUT);
  };

  if (chatJid.startsWith('tg:')) {
    await setTelegramTyping(chatJid);
  } else if (whatsapp && !chatJid.startsWith('matrix::') && !chatJid.startsWith('discourse::')) {
    await whatsapp.setTyping(chatJid, true);
  }
  let hadError = false;

  const output = await runAgent(group, prompt, chatJid, async (result) => {
    // Streaming output callback — called for each agent result
    if (result.result) {
      const raw = typeof result.result === 'string' ? result.result : JSON.stringify(result.result);
      // Strip <internal>...</internal> blocks — agent uses these for internal reasoning
      const text = raw.replace(/<internal>[\s\S]*?<\/internal>/g, '').trim();
      logger.info({ group: group.name }, `Agent output: ${raw.slice(0, 200)}`);
      if (text) {
        // Discourse shows username natively, don't prefix with assistant name
        const prefixed = chatJid.startsWith('discourse::') ? text : `${ASSISTANT_NAME}: ${text}`;
        await sendToChannel(chatJid, prefixed);
      }
      // Only reset idle timer on actual results, not session-update markers (result: null)
      resetIdleTimer();
    }

    if (result.status === 'error') {
      hadError = true;
    }
  });

  if (!chatJid.startsWith('tg:') && whatsapp && !chatJid.startsWith('matrix::') && !chatJid.startsWith('discourse::')) {
    await whatsapp.setTyping(chatJid, false);
  }
  if (idleTimer) clearTimeout(idleTimer);

  if (output === 'error' || hadError) {
    // Roll back cursor so retries can re-process these messages
    lastAgentTimestamp[chatJid] = previousCursor;
    saveState();
    logger.warn({ group: group.name }, 'Agent error, rolled back message cursor for retry');
    return false;
  }

  return true;
}

async function runAgent(
  group: RegisteredGroup,
  prompt: string,
  chatJid: string,
  onOutput?: (output: ContainerOutput) => Promise<void>,
): Promise<'success' | 'error'> {
  const isMain = group.folder === MAIN_GROUP_FOLDER;
  const sessionId = sessions[group.folder];

  // Update tasks snapshot for container to read (filtered by group)
  const tasks = getAllTasks();
  writeTasksSnapshot(
    group.folder,
    isMain,
    tasks.map((t) => ({
      id: t.id,
      groupFolder: t.group_folder,
      prompt: t.prompt,
      schedule_type: t.schedule_type,
      schedule_value: t.schedule_value,
      status: t.status,
      next_run: t.next_run,
    })),
  );

  // Update available groups snapshot (main group only can see all groups)
  const availableGroups = getAvailableGroups();
  writeGroupsSnapshot(
    group.folder,
    isMain,
    availableGroups,
    new Set(Object.keys(registeredGroups)),
  );

  // Wrap onOutput to track session ID from streamed results
  const wrappedOnOutput = onOutput
    ? async (output: ContainerOutput) => {
        if (output.newSessionId) {
          sessions[group.folder] = output.newSessionId;
          setSession(group.folder, output.newSessionId);
        }
        await onOutput(output);
      }
    : undefined;

  try {
    const output = await runContainerAgent(
      group,
      {
        prompt,
        sessionId,
        groupFolder: group.folder,
        chatJid,
        isMain,
      },
      (proc, containerName) => queue.registerProcess(chatJid, proc, containerName, group.folder),
      wrappedOnOutput,
    );

    if (output.newSessionId) {
      sessions[group.folder] = output.newSessionId;
      setSession(group.folder, output.newSessionId);
    }

    if (output.status === 'error') {
      logger.error(
        { group: group.name, error: output.error },
        'Container agent error',
      );
      return 'error';
    }

    return 'success';
  } catch (err) {
    logger.error({ group: group.name, err }, 'Agent error');
    return 'error';
  }
}

async function startMessageLoop(): Promise<void> {
  if (messageLoopRunning) {
    logger.debug('Message loop already running, skipping duplicate start');
    return;
  }
  messageLoopRunning = true;

  logger.info(`NanoClaw running (trigger: @${ASSISTANT_NAME})`);

  while (true) {
    try {
      const jids = Object.keys(registeredGroups);
      const { messages, newTimestamp } = getNewMessages(
        jids,
        lastTimestamp,
        ASSISTANT_NAME,
      );

      if (messages.length > 0) {
        logger.info({ count: messages.length }, 'New messages');

        // Advance the "seen" cursor for all messages immediately
        lastTimestamp = newTimestamp;
        saveState();

        // Deduplicate by group
        const messagesByGroup = new Map<string, NewMessage[]>();
        for (const msg of messages) {
          const existing = messagesByGroup.get(msg.chat_jid);
          if (existing) {
            existing.push(msg);
          } else {
            messagesByGroup.set(msg.chat_jid, [msg]);
          }
        }

        for (const [chatJid, groupMessages] of messagesByGroup) {
          const resolved = resolveGroup(chatJid);
          if (!resolved) continue;
          const { group } = resolved;

          const isMainGroup = group.folder === MAIN_GROUP_FOLDER;
          const needsTrigger = !isMainGroup && group.requiresTrigger !== false;

          // For non-main groups, only act on trigger messages.
          // Non-trigger messages accumulate in DB and get pulled as
          // context when a trigger eventually arrives.
          if (needsTrigger) {
            const hasTrigger = groupMessages.some((m) =>
              TRIGGER_PATTERN.test(m.content.trim()),
            );
            if (!hasTrigger) continue;
          }

          // Pull all messages since lastAgentTimestamp so non-trigger
          // context that accumulated between triggers is included.
          const allPending = getMessagesSince(
            chatJid,
            lastAgentTimestamp[chatJid] || '',
            ASSISTANT_NAME,
          );
          const messagesToSend =
            allPending.length > 0 ? allPending : groupMessages;
          const formatted = formatMessages(messagesToSend);

          if (queue.sendMessage(chatJid, formatted)) {
            logger.debug(
              { chatJid, count: messagesToSend.length },
              'Piped messages to active container',
            );
            lastAgentTimestamp[chatJid] =
              messagesToSend[messagesToSend.length - 1].timestamp;
            saveState();
          } else {
            // No active container — enqueue for a new one
            queue.enqueueMessageCheck(chatJid);
          }
        }
      }
    } catch (err) {
      logger.error({ err }, 'Error in message loop');
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  }
}

/**
 * Startup recovery: check for unprocessed messages in registered groups.
 * Handles crash between advancing lastTimestamp and processing messages.
 */
function recoverPendingMessages(): void {
  for (const [chatJid, group] of Object.entries(registeredGroups)) {
    // For wildcard JIDs (e.g. "discourse::*"), expand to actual chat_jids with pending messages
    if (chatJid.endsWith('::*')) {
      const prefix = chatJid.slice(0, -1); // "discourse::*" → "discourse::"
      const sinceTimestamp = lastAgentTimestamp[chatJid] || '';
      const actualJids = getDistinctChatJids(`${prefix}%`, sinceTimestamp);
      for (const actualJid of actualJids) {
        logger.info(
          { group: group.name, jid: actualJid },
          'Recovery: found unprocessed wildcard messages',
        );
        queue.enqueueMessageCheck(actualJid);
      }
    } else {
      const sinceTimestamp = lastAgentTimestamp[chatJid] || '';
      const pending = getMessagesSince(chatJid, sinceTimestamp, ASSISTANT_NAME);
      if (pending.length > 0) {
        logger.info(
          { group: group.name, pendingCount: pending.length },
          'Recovery: found unprocessed messages',
        );
        queue.enqueueMessageCheck(chatJid);
      }
    }
  }
}

function ensureContainerSystemRunning(): void {
  // Verify Docker is available
  try {
    execSync('docker info', { stdio: 'pipe' });
    logger.debug('Docker available');
  } catch {
    throw new Error('Docker is required but not available. Install Docker and ensure the daemon is running.');
  }

  // Kill and clean up orphaned NanoClaw containers from previous runs
  try {
    const output = execSync('docker ps --filter "name=nanoclaw-" --format "{{.Names}}"', {
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8',
    });
    const orphans = output.trim().split('\n').filter(Boolean);
    for (const name of orphans) {
      try {
        execSync(`docker stop ${name}`, { stdio: 'pipe' });
      } catch { /* already stopped */ }
    }
    if (orphans.length > 0) {
      logger.info({ count: orphans.length, names: orphans }, 'Stopped orphaned containers');
    }
  } catch (err) {
    logger.warn({ err }, 'Failed to clean up orphaned containers');
  }
}

async function main(): Promise<void> {
  ensureContainerSystemRunning();
  initDatabase();
  logger.info('Database initialized');
  loadState();

  // Auto-register Discourse wildcard group if enabled and not yet registered
  if (DISCOURSE_ENABLED && !registeredGroups['discourse::*']) {
    registerGroup('discourse::*', {
      name: 'Discourse',
      folder: MAIN_GROUP_FOLDER,
      trigger: '@oilcloth',
      added_at: new Date().toISOString(),
      requiresTrigger: false,
    });
    logger.info('Discourse wildcard group auto-registered');
  }

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received');
    await queue.shutdown(10000);
    stopTelegram();
    if (discourse) await discourse.disconnect();
    if (whatsapp) await whatsapp.disconnect();
    if (matrixConnected) {
      const { disconnectMatrix } = await import('./matrix-client.js');
      await disconnectMatrix();
    }
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // --- Channel setup ---

  // WhatsApp (optional)
  if (WHATSAPP_ENABLED) {
    whatsapp = new WhatsAppChannel({
      onMessage: (_chatJid, msg) => storeMessage(msg),
      onChatMetadata: (_chatJid, timestamp) => storeChatMetadata(_chatJid, timestamp),
      registeredGroups: () => registeredGroups,
    });
    await whatsapp.connect();
    logger.info('WhatsApp connected');
  }

  // Matrix (optional)
  if (MATRIX_ENABLED) {
    if (!MATRIX_HOMESERVER || !MATRIX_ACCESS_TOKEN || !MATRIX_USER_ID || !MATRIX_DEVICE_ID) {
      throw new Error('MATRIX_HOMESERVER, MATRIX_ACCESS_TOKEN, MATRIX_USER_ID, and MATRIX_DEVICE_ID required when MATRIX_ENABLED=true');
    }
    const { connectMatrix } = await import('./matrix-client.js');
    await connectMatrix({
      homeserver: MATRIX_HOMESERVER,
      accessToken: MATRIX_ACCESS_TOKEN,
      userId: MATRIX_USER_ID,
      deviceId: MATRIX_DEVICE_ID,
      registeredChannels: () => new Set(Object.keys(registeredGroups)),
      onMessage: (msg: NewMessage) => {
        storeMessage(msg);
      },
      onMetadata: (jid: string, timestamp: string) => storeChatMetadata(jid, timestamp),
      storePath: path.resolve(DATA_DIR, '..', 'store', 'matrix-crypto'),
    });
    matrixConnected = true;
    logger.info('Matrix connected with E2E encryption');
  }

  // Discourse (optional)
  if (DISCOURSE_ENABLED) {
    if (!DISCOURSE_URL || !DISCOURSE_API_KEY) {
      throw new Error('DISCOURSE_URL and DISCOURSE_API_KEY required when DISCOURSE_ENABLED=true');
    }
    discourse = new DiscourseChannel({
      url: DISCOURSE_URL,
      apiKey: DISCOURSE_API_KEY,
      botUsernames: DISCOURSE_BOT_USERNAMES,
      defaultUsername: DISCOURSE_DEFAULT_USERNAME,
      pollInterval: DISCOURSE_POLL_INTERVAL,
      webhookPort: DISCOURSE_WEBHOOK_PORT,
      webhookSecret: DISCOURSE_WEBHOOK_SECRET,
      onMessage: (_chatJid, msg) => storeMessage(msg),
      onChatMetadata: (_chatJid, timestamp, name) => storeChatMetadata(_chatJid, timestamp, name),
      registeredGroups: () => registeredGroups,
    });
    await discourse.connect();
    logger.info('Discourse connected');
  }

  // Telegram (optional)
  if (TELEGRAM_BOT_TOKEN) {
    await connectTelegram(TELEGRAM_BOT_TOKEN);
    if (TELEGRAM_BOT_POOL.length > 0) {
      await initBotPool(TELEGRAM_BOT_POOL);
    }
    logger.info('Telegram connected');
  }

  if (!whatsapp && !matrixConnected && !discourse && !isTelegramConnected()) {
    logger.warn('No messaging channels enabled — running in scheduler-only mode');
  }

  // Start subsystems
  startSchedulerLoop({
    registeredGroups: () => registeredGroups,
    getSessions: () => sessions,
    queue,
    onProcess: (groupJid, proc, containerName, groupFolder) => queue.registerProcess(groupJid, proc, containerName, groupFolder),
    sendMessage: async (jid, rawText) => {
      const text = whatsapp ? formatOutbound(whatsapp, rawText) : rawText;
      if (text) await sendToChannel(jid, text);
    },
  });
  startIpcWatcher({
    sendMessage: (jid, text) => sendToChannel(jid, text),
    sendVoiceMessage: async (jid, text) => {
      // Generate TTS audio and send as voice note (Telegram only for now)
      if (jid.startsWith('tg:') && isTelegramConnected()) {
        const audioPath = await generateSpeech(text);
        if (audioPath) {
          await sendTelegramVoice(jid, audioPath, text.slice(0, 200) + (text.length > 200 ? '...' : ''));
          cleanupTtsFile(audioPath);
        } else {
          // TTS failed — fall back to text
          await sendToChannel(jid, `${ASSISTANT_NAME}: ${text}`);
        }
      } else {
        // Non-Telegram channels get text only
        await sendToChannel(jid, `${ASSISTANT_NAME}: ${text}`);
      }
    },
    registeredGroups: () => registeredGroups,
    registerGroup,
    syncGroupMetadata: (force) => whatsapp ? whatsapp.syncGroupMetadata(force) : Promise.resolve(),
    getAvailableGroups,
    writeGroupsSnapshot: (gf, im, ag, rj) => writeGroupsSnapshot(gf, im, ag, rj),
  });
  queue.setProcessMessagesFn(processGroupMessages);
  recoverPendingMessages();
  startMessageLoop();
}

// Guard: only run when executed directly, not when imported by tests
const isDirectRun =
  process.argv[1] &&
  new URL(import.meta.url).pathname === new URL(`file://${process.argv[1]}`).pathname;

if (isDirectRun) {
  main().catch((err) => {
    logger.error({ err }, 'Failed to start NanoClaw');
    process.exit(1);
  });
}
