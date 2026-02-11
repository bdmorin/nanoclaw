import path from 'path';

export const ASSISTANT_NAME = process.env.ASSISTANT_NAME || 'Andy';
export const POLL_INTERVAL = 2000;
export const SCHEDULER_POLL_INTERVAL = 60000;

// Absolute paths needed for container mounts
const PROJECT_ROOT = process.cwd();
const HOME_DIR = process.env.HOME || '/Users/user';

// Mount security: allowlist stored OUTSIDE project root, never mounted into containers
export const MOUNT_ALLOWLIST_PATH = path.join(
  HOME_DIR,
  '.config',
  'nanoclaw',
  'mount-allowlist.json',
);
export const STORE_DIR = path.resolve(PROJECT_ROOT, 'store');
export const GROUPS_DIR = path.resolve(PROJECT_ROOT, 'groups');
export const DATA_DIR = path.resolve(PROJECT_ROOT, 'data');
export const MAIN_GROUP_FOLDER = 'main';

export const CONTAINER_IMAGE =
  process.env.CONTAINER_IMAGE || 'nanoclaw-agent:latest';
export const CONTAINER_TIMEOUT = parseInt(
  process.env.CONTAINER_TIMEOUT || '900000',
  10,
); // 15 minutes - research tasks need room to breathe
export const CONTAINER_MAX_OUTPUT_SIZE = parseInt(
  process.env.CONTAINER_MAX_OUTPUT_SIZE || '10485760',
  10,
); // 10MB default
export const IPC_POLL_INTERVAL = 1000;
export const MAX_CONCURRENT_CONTAINERS = Math.max(
  1,
  parseInt(process.env.MAX_CONCURRENT_CONTAINERS || '5', 10) || 5,
);

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const TRIGGER_PATTERN = new RegExp(
  `^@${escapeRegex(ASSISTANT_NAME)}\\b`,
  'i',
);

// Timezone for scheduled tasks (cron expressions, etc.)
// Uses system timezone by default
export const TIMEZONE =
  process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone;

// Channel configuration
// Set which channels are enabled (at least one required)
export const DISCORD_ENABLED = process.env.DISCORD_ENABLED === 'true';
export const WHATSAPP_ENABLED = process.env.WHATSAPP_ENABLED !== 'false'; // Default true for backwards compat

// Email / IMAP configuration
export const EMAIL_ENABLED = process.env.EMAIL_ENABLED === 'true';
export const POSTEO_IMAP_HOST = process.env.POSTEO_IMAP_HOST || 'posteo.de';
export const POSTEO_IMAP_PORT = parseInt(process.env.POSTEO_IMAP_PORT || '993', 10);
export const POSTEO_IMAP_USER = process.env.POSTEO_IMAP_USER || '';
export const POSTEO_IMAP_PASS = process.env.POSTEO_IMAP_PASS || '';
export const EMAIL_RULES_PATH = path.join(DATA_DIR, 'email-rules.json');

// Discord configuration
export const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';

// Matrix configuration
export const MATRIX_ENABLED = process.env.MATRIX_ENABLED === 'true';
export const MATRIX_HOMESERVER = process.env.MATRIX_HOMESERVER || '';
export const MATRIX_ACCESS_TOKEN = process.env.MATRIX_ACCESS_TOKEN || '';
export const MATRIX_USER_ID = process.env.MATRIX_USER_ID || '';
export const MATRIX_DEVICE_ID = process.env.MATRIX_DEVICE_ID || '';
export const MATRIX_STORE_PATH = path.resolve(STORE_DIR, 'matrix-crypto');
