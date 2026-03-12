# Claude Code Changelog - Recent Updates

## Latest Version: 2.1.42 ⭐ NEW

### Bug Fixes & Improvements
- Fixed `/resume` showing interrupt messages as session titles
- Fixed Opus 4.6 launch announcement appearing to Bedrock, Vertex, and Foundry users who don't have access
- Improved error messages for dimension limit violations with multiple images, now includes `/compact` suggestion

---

## Version 2.1.41

### Bug Fixes & Improvements
- Fixed AWS auth refresh hanging indefinitely by adding a 3-minute timeout
- Added `claude auth login`, `claude auth status`, and `claude auth logout` CLI subcommands
- Added Windows ARM64 (win32-arm64) native binary support
- Improved `/rename` to auto-generate session name from conversation context when called without arguments
- Improved narrow terminal layout for prompt footer
- Fixed file resolution failing for @-mentions with anchor fragments (e.g., `@README.md#installation`)
- Fixed FileReadTool blocking the process on FIFOs, `/dev/stdin`, and large files
- Fixed background task notifications not being delivered in streaming Agent SDK mode
- Fixed cursor jumping to end on each keystroke in classifier rule input
- Fixed markdown link display text being dropped for raw URL
- Fixed auto-compact failure error notifications being shown to users
- Fixed permission wait time being included in subagent elapsed time display
- Fixed proactive ticks firing while in plan mode
- Fixed clear stale permission rules when settings change on disk
- Fixed hook blocking errors showing stderr content in UI

---

## Version 2.1.39

### Bug Fixes & Improvements
- Added guard against launching Claude Code inside another Claude Code session
- Fixed Agent Teams using wrong model identifier for Bedrock, Vertex, and Foundry customers
- Fixed a crash when MCP tools return image content during streaming
- Fixed /resume session previews showing raw XML tags instead of readable command names
- Improved model error messages for Bedrock/Vertex/Foundry users with fallback suggestions
- Fixed plugin browse showing misleading "Space to Toggle" hint for already-installed plugins
- Fixed hook blocking errors (exit code 2) not showing stderr to the user
- Added `speed` attribute to OTel events and trace spans for fast mode visibility
- Improved terminal rendering performance
- Fixed fatal errors being swallowed instead of displayed
- Fixed process hanging after session close
- Fixed character loss at terminal screen boundary
- Fixed blank lines in verbose transcript view

---

**Last checked:** 2026-02-13 UTC
