# Lessons Learned

When you encounter an error and solve it, add the pattern here so you don't repeat it.

## Format

```
### [Short description]
**Error**: What went wrong
**Fix**: What worked
**Prevention**: How to avoid next time
```

## Lessons

### Spawned processes hang waiting for stdin
**Error**: `fabric --listpatterns` hung indefinitely when spawned via Node.js `spawn()`. Process was waiting on `unix_stream_read_generic`.
**Fix**: Call `proc.stdin.end()` immediately after spawning if the process doesn't need stdin input.
**Prevention**: Always close stdin for spawned processes that don't require input. Add timeouts as a safety net.
