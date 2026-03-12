import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { join, resolve } from "path";
import type { Task } from "./types";

const BASE_DIR = resolve(import.meta.dir, "..");
const QUEUE_DIR = join(BASE_DIR, "queue");
const RESULTS_DIR = join(BASE_DIR, "results");

function generateId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${ts}-${rand}`;
}

async function createTask(args: string[]) {
  await mkdir(QUEUE_DIR, { recursive: true });

  // Parse flags
  let prompt = "";
  let contextFiles: string[] = [];
  let workingDir: string | undefined;
  let maxTurns: number | undefined;
  let allowedTools: string[] = [];
  let priority: "low" | "normal" | "high" = "normal";
  let id: string | undefined;
  let fromFile: string | undefined;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--prompt":
      case "-p":
        prompt = args[++i];
        break;
      case "--context":
      case "-c":
        contextFiles.push(args[++i]);
        break;
      case "--dir":
      case "-d":
        workingDir = args[++i];
        break;
      case "--max-turns":
        maxTurns = parseInt(args[++i]);
        break;
      case "--tools":
        allowedTools = args[++i].split(",");
        break;
      case "--priority":
        priority = args[++i] as "low" | "normal" | "high";
        break;
      case "--id":
        id = args[++i];
        break;
      case "--file":
      case "-f":
        fromFile = args[++i];
        break;
      default:
        // If no flag, treat as prompt
        if (!prompt) prompt = args[i];
    }
  }

  // Load prompt from file if specified
  if (fromFile) {
    prompt = await readFile(resolve(fromFile), "utf-8");
  }

  if (!prompt) {
    // Read from stdin if piped
    const chunks: Buffer[] = [];
    if (!process.stdin.isTTY) {
      for await (const chunk of process.stdin) {
        chunks.push(Buffer.from(chunk));
      }
      prompt = Buffer.concat(chunks).toString("utf-8").trim();
    }
  }

  if (!prompt) {
    console.error("Error: No prompt provided. Use -p, -f, or pipe stdin.");
    process.exit(1);
  }

  const task: Task = {
    id: id ?? generateId(),
    prompt,
    contextFiles: contextFiles.length ? contextFiles : undefined,
    workingDir,
    maxTurns,
    allowedTools: allowedTools.length ? allowedTools : undefined,
    priority,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  const filePath = join(QUEUE_DIR, `${task.id}.json`);
  await writeFile(filePath, JSON.stringify(task, null, 2));
  console.log(`Queued: ${task.id} (priority: ${priority})`);
}

async function listTasks() {
  await mkdir(QUEUE_DIR, { recursive: true });
  await mkdir(RESULTS_DIR, { recursive: true });

  const files = await readdir(QUEUE_DIR);
  const tasks: Task[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const raw = await readFile(join(QUEUE_DIR, file), "utf-8");
    tasks.push(JSON.parse(raw));
  }

  if (tasks.length === 0) {
    console.log("Queue is empty.");
    return;
  }

  const statusIcon: Record<string, string> = {
    pending: "○",
    running: "▶",
    completed: "✓",
    failed: "✗",
  };

  console.log(`\n${"ID".padEnd(14)} ${"Status".padEnd(12)} ${"Priority".padEnd(10)} ${"Tokens".padEnd(10)} Prompt`);
  console.log("─".repeat(80));

  for (const task of tasks) {
    const icon = statusIcon[task.status] ?? "?";
    const tokens = task.usage
      ? `${task.usage.inputTokens + task.usage.outputTokens}`
      : "—";
    const promptSnip = task.prompt.slice(0, 35).replace(/\n/g, " ");
    console.log(
      `${task.id.padEnd(14)} ${(icon + " " + task.status).padEnd(12)} ${(task.priority ?? "normal").padEnd(10)} ${tokens.padEnd(10)} ${promptSnip}`
    );
  }
  console.log();
}

async function showResult(taskId: string) {
  const resultPath = join(RESULTS_DIR, `${taskId}.md`);
  try {
    const content = await readFile(resultPath, "utf-8");
    console.log(content);
  } catch {
    // Try queue file for inline result
    const queuePath = join(QUEUE_DIR, `${taskId}.json`);
    try {
      const raw = await readFile(queuePath, "utf-8");
      const task: Task = JSON.parse(raw);
      if (task.result) {
        console.log(task.result);
      } else if (task.error) {
        console.error(`Task failed: ${task.error}`);
      } else {
        console.log(`Task ${taskId} status: ${task.status}`);
      }
    } catch {
      console.error(`No result found for task: ${taskId}`);
    }
  }
}

async function clearCompleted() {
  const files = await readdir(QUEUE_DIR);
  let cleared = 0;

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const raw = await readFile(join(QUEUE_DIR, file), "utf-8");
    const task: Task = JSON.parse(raw);
    if (task.status === "completed" || task.status === "failed") {
      const { unlink } = await import("fs/promises");
      await unlink(join(QUEUE_DIR, file));
      cleared++;
    }
  }

  console.log(`Cleared ${cleared} finished tasks.`);
}

// Main
const [command, ...rest] = process.argv.slice(2);

switch (command) {
  case "add":
    await createTask(rest);
    break;
  case "list":
  case "ls":
    await listTasks();
    break;
  case "result":
    if (!rest[0]) {
      console.error("Usage: bun run queue result <task-id>");
      process.exit(1);
    }
    await showResult(rest[0]);
    break;
  case "clear":
    await clearCompleted();
    break;
  default:
    console.log(`Usage:
  bun run queue add -p "prompt" [-c context.md] [-d /working/dir] [--max-turns N] [--priority high|normal|low]
  bun run queue add -f prompt-file.md
  echo "prompt" | bun run queue add
  bun run queue list
  bun run queue result <task-id>
  bun run queue clear`);
}
