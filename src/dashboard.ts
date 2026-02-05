import { createServer, IncomingMessage, ServerResponse } from 'http';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { logger } from './logger.js';

const DASHBOARD_PORT = parseInt(process.env.DASHBOARD_PORT || '3002', 10);

// Event bus for dashboard updates
export const dashboardEvents = new EventEmitter();

// Store recent events for new connections
const recentEvents: DashboardEvent[] = [];
const MAX_RECENT_EVENTS = 50;

export interface DashboardEvent {
  type: 'message_in' | 'agent_start' | 'agent_done' | 'message_out' | 'error';
  timestamp: string;
  data: Record<string, unknown>;
}

// SSE clients for events
const eventClients: Set<ServerResponse> = new Set();
// SSE clients for logs
const logClients: Set<ServerResponse> = new Set();

function broadcast(event: DashboardEvent): void {
  recentEvents.push(event);
  if (recentEvents.length > MAX_RECENT_EVENTS) {
    recentEvents.shift();
  }

  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of eventClients) {
    client.write(data);
  }
}

// Listen for events and broadcast
dashboardEvents.on('message_in', (data) => {
  broadcast({ type: 'message_in', timestamp: new Date().toISOString(), data });
});

dashboardEvents.on('agent_start', (data) => {
  broadcast({ type: 'agent_start', timestamp: new Date().toISOString(), data });
});

dashboardEvents.on('agent_done', (data) => {
  broadcast({ type: 'agent_done', timestamp: new Date().toISOString(), data });
});

dashboardEvents.on('message_out', (data) => {
  broadcast({ type: 'message_out', timestamp: new Date().toISOString(), data });
});

dashboardEvents.on('error', (data) => {
  broadcast({ type: 'error', timestamp: new Date().toISOString(), data });
});

const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NanoClaw Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
      background: #0d1117;
      color: #c9d1d9;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      padding: 16px 20px;
      border-bottom: 1px solid #30363d;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    h1 {
      color: #58a6ff;
      font-size: 1.3rem;
    }
    .status {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.75rem;
    }
    .status.connected { background: #238636; }
    .status.disconnected { background: #da3633; }
    .container-status {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
    }
    .container-status .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #8b949e;
    }
    .container-status .dot.active {
      background: #f0883e;
      animation: pulse 1s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    main {
      flex: 1;
      display: flex;
      overflow: hidden;
    }
    .panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border-right: 1px solid #30363d;
    }
    .panel:last-child { border-right: none; }
    .panel-header {
      padding: 12px 16px;
      font-weight: 600;
      font-size: 0.85rem;
      color: #8b949e;
      border-bottom: 1px solid #30363d;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }
    .events { display: flex; flex-direction: column; gap: 8px; }
    .event {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 10px 12px;
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }
    .event-icon { font-size: 1rem; width: 24px; text-align: center; flex-shrink: 0; }
    .event-content { flex: 1; min-width: 0; }
    .event-header { display: flex; justify-content: space-between; margin-bottom: 2px; }
    .event-type { font-weight: 600; font-size: 0.8rem; }
    .event-time { color: #8b949e; font-size: 0.7rem; }
    .event-body { color: #8b949e; font-size: 0.8rem; word-break: break-word; }
    .event-body .sender { color: #58a6ff; }
    .event-body .group { color: #a371f7; }
    .event-body .message { color: #c9d1d9; }
    .message_in { border-left: 3px solid #58a6ff; }
    .agent_start { border-left: 3px solid #f0883e; }
    .agent_done { border-left: 3px solid #238636; }
    .message_out { border-left: 3px solid #a371f7; }
    .error { border-left: 3px solid #da3633; }
    .empty { color: #8b949e; font-style: italic; padding: 30px; text-align: center; }
    .logs {
      font-family: 'SF Mono', 'Consolas', monospace;
      font-size: 0.75rem;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .log-line { padding: 2px 0; }
    .log-line:hover { background: #161b22; }
    .log-time { color: #8b949e; }
    .log-level-INFO { color: #58a6ff; }
    .log-level-WARN { color: #f0883e; }
    .log-level-ERROR { color: #da3633; }
    .log-level-DEBUG { color: #8b949e; }
    .clear-btn {
      background: #21262d;
      border: 1px solid #30363d;
      color: #8b949e;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.7rem;
      cursor: pointer;
    }
    .clear-btn:hover { background: #30363d; }
    .sdk-event {
      background: #1c2128;
      border-left: 2px solid #f0883e;
      padding-left: 8px;
      margin: 2px 0;
    }
    .sdk-label {
      color: #f0883e;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <header>
    <h1>🦞 NanoClaw</h1>
    <span id="status" class="status disconnected">Connecting...</span>
    <div class="container-status">
      <span class="dot" id="containerDot"></span>
      <span id="containerText">Idle</span>
    </div>
  </header>
  <main>
    <div class="panel">
      <div class="panel-header">
        Events
        <button class="clear-btn" onclick="clearEvents()">Clear</button>
      </div>
      <div class="panel-content">
        <div id="events" class="events">
          <div class="empty">Waiting for activity...</div>
        </div>
      </div>
    </div>
    <div class="panel">
      <div class="panel-header">
        Live Logs
        <button class="clear-btn" onclick="clearLogs()">Clear</button>
      </div>
      <div class="panel-content">
        <div id="logs" class="logs"></div>
      </div>
    </div>
  </main>

  <script>
    const eventsDiv = document.getElementById('events');
    const logsDiv = document.getElementById('logs');
    const statusSpan = document.getElementById('status');
    const containerDot = document.getElementById('containerDot');
    const containerText = document.getElementById('containerText');
    let events = [];
    let agentActive = false;

    const icons = {
      message_in: '📥', agent_start: '🤖', agent_done: '✅',
      message_out: '📤', error: '❌'
    };
    const labels = {
      message_in: 'Message Received', agent_start: 'Agent Started',
      agent_done: 'Agent Finished', message_out: 'Response Sent', error: 'Error'
    };

    function formatTime(iso) { return new Date(iso).toLocaleTimeString(); }
    function truncate(s, n) { return s.length > n ? s.slice(0, n) + '...' : s; }
    function escapeHtml(s) {
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function formatEvent(e) {
      const d = e.data;
      switch (e.type) {
        case 'message_in':
          return '<span class="sender">' + escapeHtml(d.sender || 'Unknown') + '</span> in <span class="group">' + escapeHtml(d.group || 'Unknown') + '</span>: <span class="message">' + escapeHtml(truncate(d.content || '', 80)) + '</span>';
        case 'agent_start':
          return 'Processing for <span class="group">' + escapeHtml(d.group || 'Unknown') + '</span>...';
        case 'agent_done':
          return 'Completed in <span class="group">' + escapeHtml(d.group || 'Unknown') + '</span> (' + ((d.duration/1000).toFixed(1)) + 's)';
        case 'message_out':
          return 'To <span class="group">' + escapeHtml(d.group || 'Unknown') + '</span>: <span class="message">' + escapeHtml(truncate(d.content || '', 80)) + '</span>';
        case 'error':
          return '<span class="message">' + escapeHtml(d.error || 'Unknown error') + '</span>';
        default:
          return escapeHtml(JSON.stringify(d));
      }
    }

    function renderEvents() {
      if (events.length === 0) {
        eventsDiv.innerHTML = '<div class="empty">Waiting for activity...</div>';
        return;
      }
      eventsDiv.innerHTML = events.slice().reverse().map(e =>
        '<div class="event ' + e.type + '">' +
          '<div class="event-icon">' + icons[e.type] + '</div>' +
          '<div class="event-content">' +
            '<div class="event-header">' +
              '<span class="event-type">' + labels[e.type] + '</span>' +
              '<span class="event-time">' + formatTime(e.timestamp) + '</span>' +
            '</div>' +
            '<div class="event-body">' + formatEvent(e) + '</div>' +
          '</div>' +
        '</div>'
      ).join('');
    }

    function updateContainerStatus() {
      containerDot.className = 'dot' + (agentActive ? ' active' : '');
      containerText.textContent = agentActive ? 'Agent Running' : 'Idle';
    }

    function clearEvents() { events = []; renderEvents(); }
    function clearLogs() { logsDiv.innerHTML = ''; }

    function addLogLine(line) {
      const div = document.createElement('div');
      div.className = 'log-line';

      // Check for SDK events (highlight these specially)
      if (line.includes('[SDK]')) {
        div.className = 'log-line sdk-event';
        // Extract the SDK part
        const sdkMatch = line.match(/\\[SDK\\]\\s*(.*)/);
        if (sdkMatch) {
          const sdkContent = sdkMatch[1];
          // Parse time if present
          const timeMatch = line.match(/^[^\\[]*\\[(\\d{2}:\\d{2}:\\d{2})/);
          const time = timeMatch ? timeMatch[1] : '';
          div.innerHTML = (time ? '<span class="log-time">[' + time + ']</span> ' : '') +
            '<span class="sdk-label">[SDK]</span> ' + escapeHtml(sdkContent);
        } else {
          div.textContent = line;
        }
      } else {
        // Parse and colorize regular log line
        const match = line.match(/^\\[(\\d{2}:\\d{2}:\\d{2}\\.\\d{3})\\]\\s+(\\w+)/);
        if (match) {
          const time = match[1];
          const level = match[2];
          const rest = line.slice(match[0].length);
          div.innerHTML = '<span class="log-time">[' + time + ']</span> <span class="log-level-' + level + '">' + level + '</span>' + escapeHtml(rest);
        } else {
          div.textContent = line;
        }
      }

      logsDiv.appendChild(div);

      // Keep only last 200 lines
      while (logsDiv.children.length > 200) {
        logsDiv.removeChild(logsDiv.firstChild);
      }

      // Auto-scroll
      logsDiv.parentElement.scrollTop = logsDiv.parentElement.scrollHeight;
    }

    // Connect to events stream
    function connectEvents() {
      const es = new EventSource('/events');
      es.onopen = () => {
        statusSpan.textContent = 'Connected';
        statusSpan.className = 'status connected';
      };
      es.onmessage = (e) => {
        const event = JSON.parse(e.data);
        events.push(event);
        if (events.length > 50) events.shift();

        // Track agent status
        if (event.type === 'agent_start') { agentActive = true; updateContainerStatus(); }
        if (event.type === 'agent_done') { agentActive = false; updateContainerStatus(); }

        renderEvents();
      };
      es.onerror = () => {
        statusSpan.textContent = 'Disconnected';
        statusSpan.className = 'status disconnected';
        es.close();
        setTimeout(connectEvents, 3000);
      };
    }

    // Connect to logs stream
    function connectLogs() {
      const es = new EventSource('/logs');
      es.onmessage = (e) => {
        addLogLine(e.data);
      };
      es.onerror = () => {
        es.close();
        setTimeout(connectLogs, 3000);
      };
    }

    connectEvents();
    connectLogs();
  </script>
</body>
</html>`;

// Stream journalctl logs
function streamLogs(res: ServerResponse): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Spawn journalctl to follow nanoclaw logs
  const journal = spawn('journalctl', ['-u', 'nanoclaw', '-f', '-n', '50', '--no-pager', '-o', 'short-iso'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const sendLine = (line: string) => {
    if (line.trim()) {
      res.write(`data: ${line}\n\n`);
    }
  };

  let buffer = '';
  journal.stdout.on('data', (chunk: Buffer) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      sendLine(line);
    }
  });

  journal.stderr.on('data', (chunk: Buffer) => {
    sendLine(`[stderr] ${chunk.toString()}`);
  });

  logClients.add(res);

  res.on('close', () => {
    logClients.delete(res);
    journal.kill();
  });
}

// Get container status
async function getContainerStatus(): Promise<{ running: boolean; containers: string[] }> {
  return new Promise((resolve) => {
    const docker = spawn('docker', ['ps', '--filter', 'name=nanoclaw', '--format', '{{.Names}}']);
    let output = '';
    docker.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString();
    });
    docker.on('close', () => {
      const containers = output.trim().split('\n').filter(Boolean);
      resolve({ running: containers.length > 0, containers });
    });
    docker.on('error', () => {
      resolve({ running: false, containers: [] });
    });
  });
}

function handleRequest(req: IncomingMessage, res: ServerResponse): void {
  const url = req.url || '/';

  if (url === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    for (const event of recentEvents) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    eventClients.add(res);
    req.on('close', () => { eventClients.delete(res); });
  } else if (url === '/logs') {
    streamLogs(res);
  } else if (url === '/containers') {
    getContainerStatus().then((status) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(status));
    });
  } else if (url === '/' || url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(DASHBOARD_HTML);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
}

export function startDashboard(): void {
  const server = createServer(handleRequest);
  server.listen(DASHBOARD_PORT, () => {
    logger.info({ port: DASHBOARD_PORT }, 'Dashboard server started');
  });
}
