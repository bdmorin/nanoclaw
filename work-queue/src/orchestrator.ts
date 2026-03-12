import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { join, resolve } from "path";
import type {
  Task,
  ClaudeResult,
  OrchestratorConfig,
  OrchestratorState,
} from "./types";

const BASE_DIR = resolve(import.meta.dir, "..");

const config: OrchestratorConfig = {
  maxConcurrent: parseInt(process.env.MAX_CONCURRENT ?? "3"),
  queueDir: join(BASE_DIR, "queue"),
  resultsDir: join(BASE_DIR, "results"),
  pollIntervalMs: parseInt(process.env.POLL_INTERVAL ?? "2000"),
  claudePath: process.env.CLAUDE_PATH ?? "claude",
};

const state: OrchestratorState = {
  activeWorkers: 0,
  totalCompleted: 0,
  totalFailed: 0,
  totalTokens: { input: 0, output: 0, cache: 0 },
  totalCostUsd: 0,
  startedAt: new Date().toISOString(),
};

const activeProcs = new Map<string, ReturnType<typeof Bun.spawn>>();
let shuttingDown = false;

function log(msg: string) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

async function loadTask(filePath: string): Promise<Task | null> {
  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as Task;
  } catch {
    return null;
  }
}

async function saveTask(task: Task) {
  const filePath = join(config.queueDir, `${task.id}.json`);
  await writeFile(filePath, JSON.stringify(task, null, 2));
}

async function getPendingTasks(): Promise<Task[]> {
  const files = await readdir(config.queueDir);
  const tasks: Task[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const task = await loadTask(join(config.queueDir, file));
    if (task?.status === "pending") tasks.push(task);
  }

  // Sort by priority, then by creation time
  const priorityOrder = { high: 0, normal: 1, low: 2 };
  tasks.sort((a, b) => {
    const pa = priorityOrder[a.priority ?? "normal"];
    const pb = priorityOrder[b.priority ?? "normal"];
    if (pa !== pb) return pa - pb;
    return a.createdAt.localeCompare(b.createdAt);
  });

  return tasks;
}

function buildPrompt(task: Task): string {
  let prompt = task.prompt;

  if (task.contextFiles?.length) {
    const contextRefs = task.contextFiles
      .map((f) => `@${f}`)
      .join(" ");
    prompt = `${contextRefs}\n\n${prompt}`;
  }

  return prompt;
}

async function runWorker(task: Task) {
  task.status = "running";
  task.startedAt = new Date().toISOString();
  await saveTask(task);
  state.activeWorkers++;

  log(`▶ Starting: ${task.id} (${state.activeWorkers}/${config.maxConcurrent} slots)`);

  const args = [
    "-p",
    buildPrompt(task),
    "--output-format",
    "stream-json",
    "--no-session-persistence",
  ];

  if (task.maxTurns) {
    args.push("--max-turns", String(task.maxTurns));
  }

  if (task.allowedTools?.length) {
    args.push("--allowedTools", task.allowedTools.join(","));
  }

  const cwd = task.workingDir
    ? resolve(task.workingDir)
    : resolve(BASE_DIR, "..");

  try {
    const proc = Bun.spawn([config.claudePath, ...args], {
      cwd,
      env: { ...process.env, CLAUDECODE: "" },
      stdout: "pipe",
      stderr: "pipe",
    });

    activeProcs.set(task.id, proc);

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    activeProcs.delete(task.id);

    if (exitCode !== 0) {
      throw new Error(`claude exited ${exitCode}: ${stderr.slice(0, 500)}`);
    }

    // Parse stream-json: each line is a JSON object
    const lines = stdout.trim().split("\n");
    let resultObj: ClaudeResult | null = null;

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === "result") {
          resultObj = parsed as ClaudeResult;
        }
      } catch {
        // skip non-JSON lines
      }
    }

    if (!resultObj) {
      throw new Error("No result object in claude output");
    }

    task.status = "completed";
    task.completedAt = new Date().toISOString();
    task.sessionId = resultObj.session_id;
    task.result = resultObj.result;
    task.usage = {
      inputTokens: resultObj.usage.input_tokens,
      outputTokens: resultObj.usage.output_tokens,
      cacheReadTokens: resultObj.usage.cache_read_input_tokens,
      cacheCreationTokens: resultObj.usage.cache_creation_input_tokens,
      costUsd: resultObj.total_cost_usd,
      durationMs: resultObj.duration_ms,
      numTurns: resultObj.num_turns,
    };

    // Save result to results dir
    const resultPath = join(config.resultsDir, `${task.id}.md`);
    await writeFile(resultPath, task.result);

    state.totalCompleted++;
    state.totalTokens.input += task.usage.inputTokens;
    state.totalTokens.output += task.usage.outputTokens;
    state.totalTokens.cache += task.usage.cacheReadTokens;
    state.totalCostUsd += task.usage.costUsd;

    log(`✓ Completed: ${task.id} (${task.usage.numTurns} turns, ${task.usage.inputTokens + task.usage.outputTokens} tokens, $${task.usage.costUsd.toFixed(4)})`);
  } catch (err) {
    task.status = "failed";
    task.completedAt = new Date().toISOString();
    task.error = err instanceof Error ? err.message : String(err);
    state.totalFailed++;
    log(`✗ Failed: ${task.id} — ${task.error.slice(0, 100)}`);
  }

  await saveTask(task);
  state.activeWorkers--;
}

async function tick() {
  if (shuttingDown) return;

  const slots = config.maxConcurrent - state.activeWorkers;
  if (slots <= 0) return;

  const pending = await getPendingTasks();
  const toRun = pending.slice(0, slots);

  for (const task of toRun) {
    // Fire and forget — don't await, let workers run concurrently
    runWorker(task);
  }
}

async function printStatus() {
  log(
    `Status: ${state.activeWorkers} active, ${state.totalCompleted} done, ${state.totalFailed} failed | Tokens: ${state.totalTokens.input + state.totalTokens.output} total | Cost: $${state.totalCostUsd.toFixed(4)}`
  );
}

async function shutdown() {
  shuttingDown = true;
  log("Shutting down...");

  for (const [id, proc] of activeProcs) {
    log(`Stopping worker: ${id}`);
    proc.kill("SIGTERM");
  }

  // Wait up to 10s for workers to finish
  const deadline = Date.now() + 10_000;
  while (activeProcs.size > 0 && Date.now() < deadline) {
    await Bun.sleep(500);
  }

  if (activeProcs.size > 0) {
    log(`Force killing ${activeProcs.size} workers`);
    for (const [, proc] of activeProcs) {
      proc.kill("SIGKILL");
    }
  }

  log(
    `Final: ${state.totalCompleted} completed, ${state.totalFailed} failed, $${state.totalCostUsd.toFixed(4)} total cost`
  );
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const mode = process.argv.includes("--drain") ? "drain" : "daemon";

async function main() {
  await mkdir(config.queueDir, { recursive: true });
  await mkdir(config.resultsDir, { recursive: true });

  log(`Orchestrator started (mode: ${mode}, max ${config.maxConcurrent} workers)`);
  log(`Queue: ${config.queueDir}`);
  log(`Results: ${config.resultsDir}`);

  if (mode === "drain") {
    // Process all pending tasks, then exit
    while (!shuttingDown) {
      const pending = await getPendingTasks();
      if (pending.length === 0 && state.activeWorkers === 0) break;
      await tick();
      await Bun.sleep(config.pollIntervalMs);
    }
    log(
      `Drain complete: ${state.totalCompleted} completed, ${state.totalFailed} failed, $${state.totalCostUsd.toFixed(4)} total cost`
    );
    process.exit(0);
  }

  // Daemon mode: poll forever
  let statusCounter = 0;
  while (!shuttingDown) {
    await tick();

    statusCounter++;
    if (statusCounter % 15 === 0) {
      await printStatus();
    }

    await Bun.sleep(config.pollIntervalMs);
  }
}

main().catch((err) => {
  console.error("Orchestrator crashed:", err);
  process.exit(1);
});
