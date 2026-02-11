# Claude Code Changelog - Recent Updates

## Latest Version: 2.1.38 ⭐ NEW

### Bug Fixes & Security
- Fixed VS Code terminal scroll-to-top regression introduced in 2.1.37
- Fixed Tab key queueing slash commands instead of autocompleting
- Fixed bash permission matching for commands using environment variable wrappers
- Fixed text between tool uses disappearing when not using streaming
- Fixed duplicate sessions when resuming in VS Code extension
- Improved heredoc delimiter parsing to prevent command smuggling
- Blocked writes to `.claude/skills` directory in sandbox mode

---

## Version 2.1.37

### Bug Fix
- Fixed an issue where /fast was not immediately available after enabling /extra-usage

---

## Version 2.1.36

### Fast Mode for Opus 4.6
- Fast mode is now available for Opus 4.6. Learn more at https://code.claude.com/docs/en/fast-mode

---

## Version 2.1.34

### Bug Fixes
- Fixed a crash when agent teams setting changed between renders
- **SECURITY FIX:** Fixed a bug where commands excluded from sandboxing could bypass the Bash ask permission rule when `autoAllowBashIfSandboxed` was enabled

---

## Version 2.1.33

### Agent Teams & Hooks
- Fixed agent teammate sessions in tmux to send and receive messages
- Fixed warnings about agent teams not being available on your current plan
- Added `TeammmateIdle` and `TaskCompleted` hook events for multi-agent workflows
- Added support for restricting which sub-agents can be spawned via `Task(agent_type)` syntax
- Added `memory` frontmatter field support for agents with `user`, `project`, or `local` scope
- Added plugin name to skill descriptions and `/skills` menu

### VSCode Updates
- Added support for remote sessions, allowing OAuth users to browse and resume sessions from claude.ai
- Added git branch and message count to the session picker

---

## Version 2.1.32

### Major Features
- Claude Opus 4.6 is now available!
- Added research preview agent teams feature for multi-agent collaboration
- Claude now automatically records and recalls memories as it works
- Added "Summarize from here" to the message selector for partial conversation summarization

### Improvements
- Skills in `.claude/skills/` within additional directories are now loaded automatically
- Fixed `@` file completion showing incorrect relative paths
- Fixed Bash tool heredoc issues with JavaScript template literals

---

**Last checked:** 2026-02-10 UTC
