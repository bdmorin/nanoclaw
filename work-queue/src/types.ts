export interface Task {
  id: string;
  prompt: string;
  contextFiles?: string[];
  workingDir?: string;
  maxTurns?: number;
  allowedTools?: string[];
  priority?: "low" | "normal" | "high";
  status: "pending" | "running" | "completed" | "failed";
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  sessionId?: string;
  result?: string;
  error?: string;
  usage?: TaskUsage;
}

export interface TaskUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  costUsd: number;
  durationMs: number;
  numTurns: number;
}

export interface ClaudeResult {
  type: "result";
  subtype: "success" | "error";
  is_error: boolean;
  result: string;
  session_id: string;
  total_cost_usd: number;
  duration_ms: number;
  num_turns: number;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens: number;
    cache_creation_input_tokens: number;
  };
}

export interface OrchestratorConfig {
  maxConcurrent: number;
  queueDir: string;
  resultsDir: string;
  pollIntervalMs: number;
  claudePath: string;
}

export interface OrchestratorState {
  activeWorkers: number;
  totalCompleted: number;
  totalFailed: number;
  totalTokens: { input: number; output: number; cache: number };
  totalCostUsd: number;
  startedAt: string;
}
