/**
 * Discourse Channel for NanoClaw
 * Webhook-driven (primary) with notification polling (fallback).
 * JID format: discourse::{topic_id}
 *
 * Routing: all human posts go to oilcloth by default.
 * @publisher or @researcher at start of post routes to that agent instead.
 */
import { createServer, IncomingMessage, ServerResponse, Server } from 'http';
import { createHmac } from 'crypto';
import { logger } from '../logger.js';
import { Channel, NewMessage, OnChatMetadata, OnInboundMessage, RegisteredGroup } from '../types.js';

export interface DiscourseChannelOpts {
  url: string;
  apiKey: string;
  botUsernames: string[];
  defaultUsername: string;
  pollInterval: number;
  webhookPort: number;
  webhookSecret: string;
  onMessage: OnInboundMessage;
  onChatMetadata: OnChatMetadata;
  registeredGroups: () => Record<string, RegisteredGroup>;
}

interface DiscoursePost {
  id: number;
  topic_id: number;
  username: string;
  name: string;
  cooked: string;
  raw?: string;
  created_at: string;
  post_number: number;
}

interface DiscourseNotification {
  id: number;
  notification_type: number;
  read: boolean;
  topic_id: number;
  post_number: number;
  data: {
    topic_title?: string;
    display_username?: string;
    original_username?: string;
  };
}

export class DiscourseChannel implements Channel {
  name = 'discourse';
  prefixAssistantName = false;

  private opts: DiscourseChannelOpts;
  private connected = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private webhookServer: Server | null = null;
  private lastNotificationId = 0;
  private processedPostIds = new Set<number>();

  constructor(opts: DiscourseChannelOpts) {
    this.opts = opts;
  }

  async connect(): Promise<void> {
    // Validate connection
    const about = await this.request('GET', '/about.json') as { about?: { title: string } };
    if (!about?.about?.title) {
      throw new Error('Failed to connect to Discourse — /about.json returned unexpected response');
    }
    logger.info({ site: about.about.title }, 'Discourse site validated');

    // Start webhook server (primary)
    await this.startWebhookServer();

    // Fetch initial notification cursor for polling fallback
    await this.initNotificationCursor();

    // Start polling fallback (low frequency)
    this.connected = true;
    this.pollTimer = setInterval(() => {
      this.poll().catch(err => {
        logger.error({ err }, 'Discourse poll error');
      });
    }, this.opts.pollInterval);

    logger.info({ pollInterval: this.opts.pollInterval }, 'Discourse polling fallback started');
  }

  async disconnect(): Promise<void> {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.webhookServer) {
      await new Promise<void>(resolve => this.webhookServer!.close(() => resolve()));
      this.webhookServer = null;
    }
    this.connected = false;
    logger.info('Discourse disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  ownsJid(jid: string): boolean {
    return jid.startsWith('discourse::');
  }

  async sendMessage(jid: string, text: string, username?: string): Promise<void> {
    const topicId = this.jidToTopicId(jid);
    if (!topicId) {
      logger.warn({ jid }, 'Invalid Discourse JID, cannot send');
      return;
    }

    const postUser = username || this.opts.defaultUsername;
    const result = await this.request('POST', '/posts.json', {
      topic_id: topicId,
      raw: text,
    }, postUser) as { id?: number; errors?: string[] };

    if (result?.errors) {
      logger.error({ topicId, errors: result.errors }, 'Discourse post failed');
      return;
    }

    if (result?.id) {
      this.processedPostIds.add(result.id);
    }

    logger.debug({ topicId, postUser, postId: result?.id }, 'Discourse message sent');
  }

  // --- HTTP Layer ---

  private async request(method: string, path: string, body?: unknown, asUser?: string): Promise<unknown> {
    const url = `${this.opts.url}${path}`;
    const headers: Record<string, string> = {
      'Api-Key': this.opts.apiKey,
      'Api-Username': asUser || this.opts.defaultUsername,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '10', 10);
          logger.warn({ path, retryAfter }, 'Discourse rate limited');
          if (retryAfter > 120) {
            throw new Error(`Discourse rate limited for ${retryAfter}s — too long to wait`);
          }
          await this.sleep(retryAfter * 1000);
          continue;
        }

        if (response.status >= 500) {
          lastError = new Error(`Discourse ${response.status}: ${await response.text()}`);
          logger.warn({ path, status: response.status, attempt }, 'Discourse server error, retrying');
          await this.sleep(Math.pow(2, attempt) * 1000);
          continue;
        }

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Discourse ${response.status}: ${text}`);
        }

        return await response.json();
      } catch (err) {
        if (err instanceof Error && err.message.startsWith('Discourse ')) throw err;
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < 2) {
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError || new Error('Discourse request failed after 3 attempts');
  }

  // --- Webhook Server (primary) ---

  private startWebhookServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      const server = createServer((req, res) => {
        this.handleWebhook(req, res).catch(err => {
          logger.error({ err }, 'Webhook handler error');
          res.writeHead(500);
          res.end('Internal error');
        });
      });

      server.on('error', (err) => {
        logger.error({ err, port: this.opts.webhookPort }, 'Webhook server error');
        reject(err);
      });

      server.listen(this.opts.webhookPort, '0.0.0.0', () => {
        logger.info({ port: this.opts.webhookPort }, 'Discourse webhook server listening');
        this.webhookServer = server;
        resolve();
      });
    });
  }

  private async handleWebhook(req: IncomingMessage, res: ServerResponse): Promise<void> {
    // Accept any POST (Discourse may hit /webhook/discourse or just /)
    if (req.method !== 'POST') {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    // Read body first (needed for HMAC verification)
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk as Buffer);
    }
    const bodyBuf = Buffer.concat(chunks);
    const body = bodyBuf.toString('utf-8');

    const eventType = req.headers['x-discourse-event'] as string | undefined;
    const eventId = req.headers['x-discourse-event-id'] as string | undefined;
    logger.info({ eventType, eventId, url: req.url, contentLength: body.length }, 'Discourse webhook received');

    // Verify HMAC signature if secret is configured
    if (this.opts.webhookSecret) {
      const signatureHeader = req.headers['x-discourse-event-signature'] as string | undefined;
      if (signatureHeader) {
        // Discourse sends "sha256=<hex>"
        const expected = 'sha256=' + createHmac('sha256', this.opts.webhookSecret).update(bodyBuf).digest('hex');
        if (signatureHeader !== expected) {
          logger.warn({ expected: expected.slice(0, 20) + '...', got: signatureHeader?.slice(0, 20) + '...' }, 'Webhook HMAC mismatch, rejecting');
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }
      }
    }

    // Respond immediately (Discourse retries on timeout)
    res.writeHead(200);
    res.end('OK');

    // Filter events
    if (eventType !== 'post_created') {
      logger.debug({ eventType }, 'Discourse webhook: ignoring non-post event');
      return;
    }

    let payload: { post?: DiscoursePost };
    try {
      payload = JSON.parse(body);
    } catch {
      logger.warn('Discourse webhook: invalid JSON payload');
      return;
    }

    const post = payload.post;
    if (!post) {
      logger.warn('Discourse webhook: no post in payload');
      return;
    }

    // Bot-loop prevention: ignore posts from any bot username
    if (this.opts.botUsernames.includes(post.username)) {
      logger.debug({ username: post.username }, 'Discourse webhook: ignoring bot post');
      return;
    }

    // Already processed (e.g. our own reply tracked by ID)
    if (this.processedPostIds.has(post.id)) {
      return;
    }

    const jid = `discourse::${post.topic_id}`;

    // Check registration
    if (!this.isRegisteredJid(jid)) {
      logger.debug({ jid }, 'Discourse webhook: unregistered topic');
      return;
    }

    logger.info({ postId: post.id, topicId: post.topic_id, username: post.username }, 'Discourse webhook: new post');

    // Build the message
    const content = this.htmlToPlainText(post.cooked);
    const msg: NewMessage = {
      id: `discourse-${post.id}`,
      chat_jid: jid,
      sender: post.username,
      sender_name: post.name || post.username,
      content,
      timestamp: post.created_at,
    };

    // Deliver metadata and message
    this.opts.onChatMetadata(jid, msg.timestamp);
    this.opts.onMessage(jid, msg);

    // Track to prevent reprocessing by poll fallback
    this.processedPostIds.add(post.id);

    // Trim processed set to prevent unbounded growth (keep last 1000)
    if (this.processedPostIds.size > 1000) {
      const arr = Array.from(this.processedPostIds);
      this.processedPostIds = new Set(arr.slice(-500));
    }
  }

  // --- Polling Fallback ---

  private async initNotificationCursor(): Promise<void> {
    try {
      const data = await this.request('GET', '/notifications.json?limit=1') as {
        notifications?: DiscourseNotification[];
      };
      if (data?.notifications?.length) {
        this.lastNotificationId = data.notifications[0].id;
        logger.debug({ lastNotificationId: this.lastNotificationId }, 'Discourse notification cursor initialized');
      }
    } catch (err) {
      logger.warn({ err }, 'Failed to init Discourse notification cursor, starting from 0');
    }
  }

  private async poll(): Promise<void> {
    try {
      const data = await this.request('GET', '/notifications.json?recent=true&limit=50') as {
        notifications?: DiscourseNotification[];
      };

      if (!data?.notifications?.length) return;

      const newNotifications = data.notifications.filter(n => n.id > this.lastNotificationId);
      if (newNotifications.length === 0) return;

      logger.info({ count: newNotifications.length }, 'Discourse poll: new notifications (fallback)');

      // Relevant notification types:
      // 1 = mentioned, 2 = replied, 6 = PM, 9 = posted
      const relevantTypes = new Set([1, 2, 6, 9]);

      for (const notif of newNotifications.reverse()) {
        if (notif.id > this.lastNotificationId) {
          this.lastNotificationId = notif.id;
        }

        if (!relevantTypes.has(notif.notification_type)) continue;
        if (!notif.topic_id) continue;

        const fromUser = notif.data?.original_username || notif.data?.display_username || '';
        if (this.opts.botUsernames.includes(fromUser)) continue;

        const jid = `discourse::${notif.topic_id}`;
        if (!this.isRegisteredJid(jid)) continue;

        // Fetch the specific post to check if we already processed it via webhook
        const messages = await this.getTopicContext(notif.topic_id);
        if (messages.length === 0) continue;

        const triggerMsg = messages[messages.length - 1];

        // Skip if already delivered by webhook
        const postId = parseInt(triggerMsg.id.replace('discourse-', ''), 10);
        if (this.processedPostIds.has(postId)) {
          logger.debug({ postId }, 'Discourse poll: already processed by webhook');
          continue;
        }

        logger.info({ jid, sender: triggerMsg.sender_name }, 'Discourse poll: delivering missed message');

        this.opts.onChatMetadata(jid, triggerMsg.timestamp, notif.data?.topic_title || `Topic ${notif.topic_id}`);
        this.opts.onMessage(jid, triggerMsg);
        this.processedPostIds.add(postId);

        try {
          await this.request('PUT', `/notifications/mark-read`, { id: notif.id });
        } catch {
          // Non-critical
        }
      }
    } catch (err) {
      logger.error({ err }, 'Discourse poll error');
    }
  }

  // --- Topic Context ---

  async getTopicContext(topicId: number, maxPosts = 20): Promise<NewMessage[]> {
    const data = await this.request('GET', `/t/${topicId}.json`) as {
      id: number;
      title: string;
      post_stream?: {
        posts?: DiscoursePost[];
      };
    };

    if (!data?.post_stream?.posts) return [];

    const posts = data.post_stream.posts;
    const humanPosts = posts
      .filter(p => !this.opts.botUsernames.includes(p.username))
      .filter(p => !this.processedPostIds.has(p.id))
      .slice(-maxPosts);

    return humanPosts.map(p => ({
      id: `discourse-${p.id}`,
      chat_jid: `discourse::${topicId}`,
      sender: p.username,
      sender_name: p.name || p.username,
      content: this.htmlToPlainText(p.cooked),
      timestamp: p.created_at,
    }));
  }

  // --- Helpers ---

  private jidToTopicId(jid: string): number | null {
    const match = jid.match(/^discourse::(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  }

  private isRegisteredJid(jid: string): boolean {
    const groups = this.opts.registeredGroups();
    if (groups[jid]) return true;
    if (groups['discourse::*']) return true;
    return false;
  }

  private htmlToPlainText(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/?(p|div|h[1-6]|li|ul|ol|blockquote|pre|code|em|strong|a|span|img)[^>]*>/gi, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// --- Exported utility functions for agent tools ---

export async function discourseRequest(
  url: string, apiKey: string, username: string,
  method: string, path: string, body?: unknown,
): Promise<unknown> {
  const response = await fetch(`${url}${path}`, {
    method,
    headers: {
      'Api-Key': apiKey,
      'Api-Username': username,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Discourse ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

export async function discourseSearch(
  url: string, apiKey: string, username: string, query: string,
): Promise<{ topic_id: number; title: string; excerpt: string; url: string }[]> {
  const data = await discourseRequest(url, apiKey, username, 'GET',
    `/search.json?q=${encodeURIComponent(query)}`) as {
    topics?: Array<{ id: number; title: string; excerpt: string; slug: string }>;
  };

  return (data?.topics || []).map(t => ({
    topic_id: t.id,
    title: t.title,
    excerpt: t.excerpt || '',
    url: `${url}/t/${t.slug}/${t.id}`,
  }));
}

export async function discourseCreateTopic(
  url: string, apiKey: string, username: string,
  opts: { title: string; raw: string; category: number; tags?: string[] },
): Promise<{ topic_id: number; url: string }> {
  const data = await discourseRequest(url, apiKey, username, 'POST', '/posts.json', {
    title: opts.title,
    raw: opts.raw,
    category: opts.category,
    tags: opts.tags,
  }) as { topic_id: number; topic_slug: string };

  return {
    topic_id: data.topic_id,
    url: `${url}/t/${data.topic_slug}/${data.topic_id}`,
  };
}

export async function discourseGetTopic(
  url: string, apiKey: string, username: string, topicId: number,
): Promise<{ title: string; posts: Array<{ username: string; content: string; created_at: string }> }> {
  const data = await discourseRequest(url, apiKey, username, 'GET', `/t/${topicId}.json`) as {
    title: string;
    post_stream?: { posts?: DiscoursePost[] };
  };

  return {
    title: data.title,
    posts: (data.post_stream?.posts || []).map(p => ({
      username: p.username,
      content: p.cooked.replace(/<[^>]*>/g, '').trim(),
      created_at: p.created_at,
    })),
  };
}

export async function discourseListCategories(
  url: string, apiKey: string, username: string,
): Promise<Array<{ id: number; name: string; slug: string; description: string; topic_count: number }>> {
  const data = await discourseRequest(url, apiKey, username, 'GET', '/categories.json') as {
    category_list?: {
      categories?: Array<{
        id: number; name: string; slug: string;
        description_text: string; topic_count: number;
      }>;
    };
  };

  return (data?.category_list?.categories || []).map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description_text || '',
    topic_count: c.topic_count,
  }));
}
