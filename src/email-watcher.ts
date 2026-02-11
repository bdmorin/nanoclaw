import fs from 'fs';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

import {
  EMAIL_RULES_PATH,
  POSTEO_IMAP_HOST,
  POSTEO_IMAP_PORT,
  POSTEO_IMAP_USER,
  POSTEO_IMAP_PASS,
} from './config.js';
import { logger } from './logger.js';

// --- Prefilter types ---

interface EmailRule {
  name: string;
  field: string; // 'from', 'to', 'subject', 'headers.<name>'
  match: 'contains' | 'equals' | 'regex' | 'exists' | 'not-exists';
  values?: string[];
  action: 'accept' | 'reject';
}

interface EmailRulesConfig {
  version: number;
  defaultAction: 'accept' | 'reject';
  rules: EmailRule[];
  maxBodySizeBytes: number;
}

// --- Config types ---

export interface EmailWatcherConfig {
  onEmail: (msg: EmailMessage) => void;
}

export interface EmailMessage {
  uid: number;
  from: string;       // "Alice Smith <alice@example.com>"
  subject: string;
  date: string;        // ISO 8601
  body: string;        // plain text, truncated
  attachments: string; // "report.pdf (2.1MB), photo.jpg (340KB)" or empty
}

// --- Reconnect constants ---

const BASE_DELAY_MS = 5000;
const BACKOFF_MULTIPLIER = 2;
const MAX_DELAY_MS = 300_000; // 5 minutes
const MAX_RECONNECT_ATTEMPTS = 20;
const FLOOD_THRESHOLD = 10;

export class EmailWatcher {
  private config: EmailWatcherConfig;
  private client: ImapFlow | null = null;
  private running = false;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private rules: EmailRulesConfig;

  constructor(config: EmailWatcherConfig) {
    this.config = config;
    this.rules = this.loadRules();
  }

  async start(): Promise<void> {
    this.running = true;
    await this.connectAndWatch();
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    await this.disconnect();
  }

  // --- Connection ---

  private async connectAndWatch(): Promise<void> {
    if (!this.running) return;

    try {
      this.client = new ImapFlow({
        host: POSTEO_IMAP_HOST,
        port: POSTEO_IMAP_PORT,
        secure: true,
        auth: {
          user: POSTEO_IMAP_USER,
          pass: POSTEO_IMAP_PASS,
        },
        logger: false, // imapflow is chatty; we log ourselves
        disableAutoIdle: true, // we manage IDLE manually
      });

      this.client.on('error', (err: Error) => {
        logger.error({ err }, 'IMAP connection error');
      });

      this.client.on('close', () => {
        logger.info('IMAP connection closed');
        if (this.running) {
          this.scheduleReconnect();
        }
      });

      await this.client.connect();
      logger.info(
        { host: POSTEO_IMAP_HOST },
        'IMAP connected to Posteo',
      );

      // Reset reconnect counter on successful connection
      this.reconnectAttempts = 0;

      // Process any unseen messages first
      await this.processUnseen();

      // Enter IDLE loop
      await this.idleLoop();
    } catch (err: any) {
      // Auth failures should not retry
      if (err?.authenticationFailed || err?.code === 'AUTHENTICATIONFAILED') {
        logger.error(
          { err },
          'IMAP authentication failed — check POSTEO_IMAP_USER/POSTEO_IMAP_PASS in .env. Not retrying.',
        );
        this.running = false;
        return;
      }

      logger.error({ err }, 'IMAP connection failed');
      if (this.running) {
        this.scheduleReconnect();
      }
    }
  }

  private async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.logout();
      } catch {
        // Best-effort
        try {
          this.client.close();
        } catch {
          // ignore
        }
      }
      this.client = null;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    if (this.reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
      logger.error(
        { attempts: this.reconnectAttempts },
        'IMAP max reconnect attempts reached — giving up',
      );
      this.running = false;
      return;
    }

    const delay = Math.min(
      BASE_DELAY_MS * Math.pow(BACKOFF_MULTIPLIER, this.reconnectAttempts - 1),
      MAX_DELAY_MS,
    );

    logger.info(
      { attempt: this.reconnectAttempts, delayMs: delay },
      'IMAP scheduling reconnect',
    );

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      await this.disconnect();
      await this.connectAndWatch();
    }, delay);
  }

  // --- IDLE loop ---

  private async idleLoop(): Promise<void> {
    if (!this.client || !this.running) return;

    const lock = await this.client.getMailboxLock('INBOX');
    try {
      while (this.running && this.client?.usable) {
        // Wait for new messages via IDLE
        // imapflow's idle() resolves when broken by server notification or timeout
        await this.client.idle();

        // IDLE was broken — check for new messages
        if (this.running && this.client?.usable) {
          await this.processUnseen();
        }
      }
    } catch (err) {
      logger.error({ err }, 'IMAP IDLE loop error');
    } finally {
      lock.release();
    }
    // If we get here and still running, the connection will fire 'close' → reconnect
  }

  // --- Message processing ---

  private async processUnseen(): Promise<void> {
    if (!this.client) return;

    const lock = await this.client.getMailboxLock('INBOX');
    try {
      // Search for unseen messages
      const uids = await this.client.search({ seen: false }, { uid: true });
      if (!uids || uids.length === 0) return;

      logger.info({ count: uids.length }, 'IMAP found unseen messages');

      // Flood protection: if too many, batch into summary
      if (uids.length > FLOOD_THRESHOLD) {
        await this.handleFlood(uids);
        return;
      }

      for (const uid of uids) {
        await this.processOneMessage(uid);
      }
    } catch (err) {
      logger.error({ err }, 'Error processing unseen messages');
    } finally {
      lock.release();
    }
  }

  private async processOneMessage(uid: number): Promise<void> {
    if (!this.client) return;

    try {
      // Phase 1: fetch headers only (does NOT set \Seen)
      const headerMsg = await this.client.fetchOne(
        String(uid),
        {
          uid: true,
          envelope: true,
          bodyStructure: true,
          size: true,
          headers: true,
        },
        { uid: true },
      );

      if (!headerMsg) {
        logger.warn({ uid }, 'Could not fetch message headers');
        return;
      }

      // Parse raw headers for prefilter
      const rawHeaders = headerMsg.headers?.toString('utf-8') || '';
      const envelope = headerMsg.envelope;

      const fromAddr = this.formatAddress(envelope?.from);
      const subject = envelope?.subject || '(no subject)';

      // Run prefilter on headers
      const filterResult = this.evaluateRules(fromAddr, subject, rawHeaders);
      if (filterResult === 'reject') {
        logger.info(
          { uid, from: fromAddr, subject },
          'Email rejected by prefilter',
        );
        // Mark as seen so we don't re-evaluate
        await this.client.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true });
        return;
      }

      // Phase 2: fetch full body (marks \Seen)
      const { content: bodyStream } = await this.client.download(String(uid), undefined, { uid: true });
      const chunks: Buffer[] = [];
      for await (const chunk of bodyStream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const rawSource = Buffer.concat(chunks);

      // Parse with mailparser
      const parsed = await simpleParser(rawSource);

      // Mark as seen
      await this.client.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true });

      // Extract body text
      let bodyText = parsed.text || '';
      if (!bodyText && parsed.html) {
        // Basic HTML to text fallback (simpleParser usually handles this)
        bodyText = parsed.html
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/\s+/g, ' ')
          .trim();
      }

      // Truncate
      const maxBytes = this.rules.maxBodySizeBytes || 102400;
      if (Buffer.byteLength(bodyText, 'utf-8') > maxBytes) {
        // Truncate at character boundary near the byte limit
        const buf = Buffer.from(bodyText, 'utf-8');
        bodyText = buf.subarray(0, maxBytes).toString('utf-8') + '\n\n[TRUNCATED]';
      }

      // Summarize attachments
      const attachmentSummary = (parsed.attachments || [])
        .map((att) => {
          const name = att.filename || 'unnamed';
          const size = this.formatSize(att.size);
          return `${name} (${size})`;
        })
        .join(', ');

      const rawDate = envelope?.date || parsed.date;
      const date = rawDate
        ? new Date(rawDate).toISOString()
        : new Date().toISOString();

      const emailMsg: EmailMessage = {
        uid,
        from: fromAddr,
        subject,
        date,
        body: bodyText,
        attachments: attachmentSummary,
      };

      this.config.onEmail(emailMsg);
      logger.info({ uid, from: fromAddr, subject }, 'Email accepted and queued');
    } catch (err) {
      logger.error({ uid, err }, 'Error processing email');
    }
  }

  private async handleFlood(uids: number[]): Promise<void> {
    if (!this.client) return;

    logger.warn(
      { count: uids.length },
      'Email flood detected — batching into summary',
    );

    // Fetch envelopes for all messages
    const summaries: string[] = [];
    for (const uid of uids) {
      try {
        const msg = await this.client.fetchOne(
          String(uid),
          { uid: true, envelope: true },
          { uid: true },
        );
        if (msg && msg.envelope) {
          const from = this.formatAddress(msg.envelope.from);
          const subject = msg.envelope.subject || '(no subject)';
          summaries.push(`- From: ${from} | Subject: ${subject}`);
        }
        // Mark all as seen
        await this.client.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true });
      } catch {
        // skip individual failures
      }
    }

    const batchMsg: EmailMessage = {
      uid: uids[0],
      from: 'system',
      subject: `Email batch: ${uids.length} messages arrived`,
      date: new Date().toISOString(),
      body: `${uids.length} emails arrived at once. Summary:\n\n${summaries.join('\n')}\n\nUse check_email.py to review individual messages.`,
      attachments: '',
    };

    this.config.onEmail(batchMsg);
  }

  // --- Prefilter ---

  private loadRules(): EmailRulesConfig {
    try {
      const raw = fs.readFileSync(EMAIL_RULES_PATH, 'utf-8');
      return JSON.parse(raw) as EmailRulesConfig;
    } catch (err) {
      logger.warn({ err }, 'Could not load email rules, using defaults');
      return {
        version: 1,
        defaultAction: 'accept',
        rules: [],
        maxBodySizeBytes: 102400,
      };
    }
  }

  private evaluateRules(from: string, subject: string, rawHeaders: string): 'accept' | 'reject' {
    // Parse raw headers into a map for header.* field access
    const headerMap = this.parseHeaders(rawHeaders);

    for (const rule of this.rules.rules) {
      const fieldValue = this.getFieldValue(rule.field, from, subject, headerMap);

      let matched = false;
      switch (rule.match) {
        case 'exists':
          matched = fieldValue !== null && fieldValue !== '';
          break;
        case 'not-exists':
          matched = fieldValue === null || fieldValue === '';
          break;
        case 'contains':
          if (fieldValue !== null && rule.values) {
            const lower = fieldValue.toLowerCase();
            matched = rule.values.some((v) => lower.includes(v.toLowerCase()));
          }
          break;
        case 'equals':
          if (fieldValue !== null && rule.values) {
            const lower = fieldValue.toLowerCase();
            matched = rule.values.some((v) => v.toLowerCase() === lower);
          }
          break;
        case 'regex':
          if (fieldValue !== null && rule.values) {
            matched = rule.values.some((v) => {
              try {
                return new RegExp(v, 'i').test(fieldValue);
              } catch {
                return false;
              }
            });
          }
          break;
      }

      if (matched) {
        logger.debug(
          { rule: rule.name, action: rule.action },
          'Email prefilter rule matched',
        );
        return rule.action;
      }
    }

    return this.rules.defaultAction;
  }

  private getFieldValue(
    field: string,
    from: string,
    subject: string,
    headerMap: Map<string, string>,
  ): string | null {
    switch (field) {
      case 'from':
        return from;
      case 'to':
        return headerMap.get('to') || null;
      case 'subject':
        return subject;
      default:
        // headers.<name>
        if (field.startsWith('headers.')) {
          const headerName = field.slice(8).toLowerCase();
          return headerMap.get(headerName) || null;
        }
        return null;
    }
  }

  private parseHeaders(rawHeaders: string): Map<string, string> {
    const map = new Map<string, string>();
    // Unfold continued header lines
    const unfolded = rawHeaders.replace(/\r?\n[ \t]+/g, ' ');
    for (const line of unfolded.split(/\r?\n/)) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim().toLowerCase();
        const value = line.slice(colonIdx + 1).trim();
        // Append if duplicate header
        const existing = map.get(key);
        map.set(key, existing ? `${existing}, ${value}` : value);
      }
    }
    return map;
  }

  // --- Helpers ---

  private formatAddress(addrs?: Array<{ name?: string; address?: string }>): string {
    if (!addrs || addrs.length === 0) return 'unknown';
    const first = addrs[0];
    if (first.name && first.address) return `${first.name} <${first.address}>`;
    return first.address || first.name || 'unknown';
  }

  private formatSize(bytes: number): string {
    if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)}MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${bytes}B`;
  }
}
