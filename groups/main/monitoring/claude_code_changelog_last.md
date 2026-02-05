# Claude Code Changelog - Recent Updates

## Latest Version: 2.1.31

### Key Features & Fixes

**Session Management:**
- Added session resume hint on exit, showing how to continue conversations later
- Fixed PDF too large errors permanently locking up sessions
- Fixed crashes when entering plan mode with missing config fields

**PDF & File Handling:**
- Added `pages` parameter to Read tool for PDFs (e.g., `pages: "1-5"`)
- Large PDFs (>10 pages) return lightweight reference when @mentioned instead of being inlined
- Improved PDF and request size error messages showing actual limits (100 pages, 20MB)

**Performance & Stability:**
- Fixed `temperatureOverride` being silently ignored in streaming API path
- Fixed prompt cache not invalidating when tool descriptions changed
- Reduced layout jitter in terminal during spinner animations
- Fixed bash commands failing with "Read-only file system" errors in sandbox mode

**MCP & Tool Improvements:**
- Added pre-configured OAuth client credentials for MCP servers (use `--client-id` and `--client-secret`)
- Added support for additional `git log` and `git show` flags in read-only mode
- Improved system prompts to guide model toward dedicated tools (Read, Edit, Glob, Grep) over bash equivalents

**User Interface:**
- Added support for full-width (zenkaku) space input from Japanese IME
- Removed misleading Anthropic API pricing from model selector for third-party provider users
- Fixed permission dialogs stealing focus while typing

**Other Fixes:**
- Fixed subagents not accessing SDK-provided MCP tools
- Fixed Windows users with `.bashrc` files unable to run bash commands
- Fixed LSP shutdown/exit compatibility with strict language servers

## Version 2.1.30 (Notable Changes)

- Added `pages` parameter to Read tool for PDFs with range support
- 68% memory reduction for `--resume` with lightweight stat-based loading
- Added `/debug` command to troubleshoot sessions
- Fixed phantom "(no content)" text blocks in API conversation history
- Fixed 400 errors after running `/login` with thinking blocks
- Improved MCP tool descriptions handling to reduce context waste

## Version 2.1.29

- Fixed startup performance issues with `saved_hook_context`

## Version 2.1.27

- Added `--from-pr` flag to resume sessions linked to GitHub PRs
- Sessions automatically linked to PRs via `gh pr create`
- Fixed OAuth token expiration causing 401 errors in VSCode after extended sessions
- Windows: Fixed console windows flashing when spawning processes

---

The changelog shows active development with focus on stability, performance optimization, and feature enhancements across session management, tool integration, and user experience.
