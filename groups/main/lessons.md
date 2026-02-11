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

### pip packages lost on container rebuild
**Error**: `ModuleNotFoundError: No module named 'imap_tools'` after nanoclaw rebuilt container. Packages installed via `pip3 install --break-system-packages` don't survive container rebuilds.
**Fix**: Reinstall with `pip3 install --break-system-packages imap-tools`. Or add a `requirements.txt` to the build script (build.sh already handles this).
**Prevention**: Add required packages to `/workspace/group/site/requirements.txt` or a top-level requirements file. The build script auto-installs. For critical packages needed outside build (like email), create a setup script or add to container Dockerfile.

### Posteo requires app passwords for IMAP/SMTP
**Error**: `[AUTHENTICATIONFAILED] Authentication failed.` when using Posteo login password for IMAP.
**Fix**: Generate an "app and device password" in Posteo webmail: Settings → My account → Password and security. Use that password, not the web login password.
**Prevention**: Always use app passwords for programmatic email access. Posteo separates web auth from client auth.

### PEP 668 blocks pip install in containers
**Error**: `error: externally-managed-environment` when running `pip3 install`.
**Fix**: Use `pip3 install --break-system-packages` flag, or create a venv (requires `python3-venv` package which may not be installed).
**Prevention**: Use `--break-system-packages` flag. No sudo available in container, no apt access.

### gh and glab CLI not in container — install from tarballs
**Error**: `gh` and `glab` CLIs not available after container rebuild. No `apt` or `sudo`.
**Fix**: Download and extract to `~/bin/`:
```bash
# gh
curl -sL https://github.com/cli/cli/releases/download/v2.65.0/gh_2.65.0_linux_amd64.tar.gz -o /tmp/gh.tar.gz
tar -xzf /tmp/gh.tar.gz -C /tmp/
cp /tmp/gh_2.65.0_linux_amd64/bin/gh ~/bin/gh && chmod +x ~/bin/gh
# glab (needs XDG_CONFIG_HOME workaround)
curl -sL https://gitlab.com/gitlab-org/cli/-/releases/v1.52.0/downloads/glab_1.52.0_linux_amd64.tar.gz -o /tmp/glab.tar.gz
mkdir -p /tmp/glab_extract && tar -xzf /tmp/glab.tar.gz -C /tmp/glab_extract
cp /tmp/glab_extract/bin/glab ~/bin/glab && chmod +x ~/bin/glab
# glab config dir: XDG_CONFIG_HOME=/tmp ~/bin/glab version
```
**Prevention**: Ask nanoclaw to add to Dockerfile. Until then, install on each session start. PATH must include ~/bin.

### Git repos lost on container rebuild
**Error**: `.git` directory disappears after container rebuild. Content files survive (they're on mounted volume) but git history is lost.
**Fix**: Re-init with `git init`, re-add, re-commit. Can't recover history without pushing to remote first.
**Prevention**: Push to remote as soon as possible after initial commit. The content syncs from OSINT directory anyway, so repo can always be regenerated.

### Bash shell fails when cwd is deleted
**Error**: Every bash command returns exit code 1 with no output after the current working directory is deleted.
**Fix**: Use commands that explicitly `cd` to a valid directory first, e.g., `cd /workspace/group && ls`. The error output may appear in stderr while stdout has real output — check exit codes carefully.
**Prevention**: Never delete a directory you might be cd'd into. Always work from stable paths.

### Spawned processes hang waiting for stdin
**Error**: `fabric --listpatterns` hung indefinitely when spawned via Node.js `spawn()`. Process was waiting on `unix_stream_read_generic`.
**Fix**: Call `proc.stdin.end()` immediately after spawning if the process doesn't need stdin input.
**Prevention**: Always close stdin for spawned processes that don't require input. Add timeouts as a safety net.
