# Filesystem-Based Skills Pattern

**Source:** [Daniel Miessler - Anthropic Changes MCP Calls Into Filesystem-based Skills](https://danielmiessler.com/blog/anthropic-downplays-mcps)

## The Problem with MCP

Traditional MCP tool calls are token-heavy:
- Every tool definition gets loaded into context
- 10 tools × 15k tokens each = 150k tokens before you even start
- Agent pays this cost even if it only needs 1 tool

## The Solution: Filesystem + TypeScript

Instead of MCP servers, expose tools as **TypeScript files** the agent discovers and reads on-demand:

```
skills/
├── github/
│   ├── create_issue.ts
│   ├── list_repos.ts
│   └── README.md          # Directory description
├── slack/
│   └── send_message.ts
└── fabric/
    ├── analyze_claims.ts
    └── youtube_wisdom.ts
```

### How the Agent Works

1. **Discovery**: Agent reads `skills/` directory to see what's available
2. **Selection**: Based on task, agent reads specific `.ts` file
3. **Execution**: Agent writes code to call that tool (or runs it directly)
4. **Results**: Agent processes results using code, not AI calls

### Token Savings

| Approach | Tokens | Cost |
|----------|--------|------|
| Traditional MCP | 150,000 | High |
| Filesystem Skills | 2,000 | Low |
| **Savings** | **98.7%** | |

## Key Principles

1. **Text is the primitive** - Files are the universal interface
2. **Lazy loading** - Only read what you need
3. **Code over prompts** - AI orchestrates, TypeScript executes
4. **Discoverability** - README.md files describe directories

## Miessler's Philosophy

> "MCPs are still powerful, but more as a directory of what's possible...as opposed to the mechanism for actually doing it."

> "Skills are full of TypeScript utilities that do the heavy lifting—with AI just orchestrating them."

## Application to NanoClaw

Currently oilcloth uses MCP tools (`mcp__nanoclaw__*`, `mcp__gmail__*`).

Alternative approach:
- Create `skills/` directory in container workspace
- Each skill is a TypeScript/bash file oilcloth can read and execute
- Agent discovers available skills by listing directory
- Agent reads only the skills it needs
- Massive token savings, more flexibility

## Trade-offs

**Pros:**
- Dramatically lower token usage
- Agent can modify/create new skills
- More transparent (just files)
- Works with any AI, not tied to MCP protocol

**Cons:**
- Requires agent to have code execution (we have this)
- Less structured than MCP schema
- Agent needs to understand how to use each skill
