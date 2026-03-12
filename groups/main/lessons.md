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

### Matrix E2E decryption — RESOLVED: channel is now cleartext
**Error**: Messages from brahn's Matrix client showed "Unable to decrypt: DecryptionError" — E2E key sharing between client and bridge was unreliable.
**Resolution**: As of 2026-02-11, brahn evaluated the situation and switched this channel to cleartext. Keeping encryption keys in the agent container was too difficult, and for a private 1:1 channel the risk was acceptable.
**Note**: If the channel is ever shared with others or threat level changes, E2E should be revisited. For now, no more decrypt errors.

### GitHub will reject OSINT repositories — use Codeberg only
**Error**: GitHub rejected the deportation-machine-intelligence repository. No specific error message — likely content policy enforcement against documentation of government violence.
**Fix**: Codeberg (German non-profit, EU jurisdiction) is our publishing home. No corporate censorship pressure, no US government leverage.
**Prevention**: Don't bother with GitHub or GitLab for sensitive OSINT work. Codeberg only. sync.sh has been updated to target Codeberg exclusively. The MkDocs site at oilcloth.codeberg.page is the canonical public-facing output.

### Publisher dispatch may silently fail — always re-dispatch
**Error**: First publisher dispatch (1770845052343) didn't appear in task list after dispatch. Content didn't update on site.
**Fix**: Re-dispatched with explicit urgent priority. Check `list_tasks` to confirm dispatch registered.
**Prevention**: After dispatching publisher, verify it appears in task list. If not visible within a few minutes, re-dispatch.

### OPSEC grep hits on oilcloth@posteo.us in translated files are OK
**Error**: Pre-publish OPSEC grep (`grep -ri -E "oilcloth"`) triggers on `oilcloth@posteo.us` in i18n caveat banners. Every translated file has "Si encuentra errores, contáctenos: oilcloth@posteo.us" in the caveat.
**Fix**: This is a false positive — the contact email is intentional and public. The grep still catches it because "oilcloth" appears in the email address.
**Prevention**: When reviewing OPSEC grep results, check if all hits are on the caveat banner line (line 3 in translated files). If so, clean. Only worry about hits in the body content.

### OPSEC: Slack webhook goes to brahn's WORK Slack
**Error**: Mortui Vivos Docent / OSINT content was posted to brahn's work Slack channel via `send_slack`. This is an OPSEC violation — work colleagues should not see this content.
**Fix**: Updated CLAUDE.md Slack section to explicitly prohibit OSINT/deportation/dossier content. Slack is ONLY for non-sensitive technical updates (Claude Code changelog, etc.).
**Prevention**: NEVER post anything related to Mortui Vivos Docent, ICE/CBP research, dossiers, Cabinet of Horrors, or OSINT to Slack. The webhook goes to a *work* channel. Only post things brahn explicitly asked for (Claude Code changelog updates). When in doubt, don't post to Slack.

### Codeberg Pages serves from 'pages' branch, not 'gh-pages'
**Error**: `mkdocs gh-deploy` defaults to pushing to `gh-pages` branch (GitHub convention). Codeberg Pages serves from `pages`. Deploy "succeeds" but site doesn't update.
**Fix**: Deleted `gh-pages` branch on Codeberg, set `pages` as default. Deploy command uses `--remote-branch pages` flag.
**Prevention**: Use `bash build.sh --deploy` which calls `mkdocs gh-deploy --remote-name codeberg --remote-branch pages --force`. Always verify the URL before reporting "live."

### Bluesky post links must be verified before posting
**Error**: Posted a reply linking to `/reports/indigenous-americans-ice-targeting/` but the file is actually at `/dossiers/indigenous-americans-ice-targeting/`. Result: 404 link in a live reply.
**Fix**: Deleted the broken post, reposted with correct link. Bluesky doesn't support post editing.
**Prevention**: Before posting any Bluesky reply with a site link, verify the path exists: check `ls /workspace/group/site/docs/[path].md`. The site structure has reports/, dossiers/, infrastructure/, cabinet/, alerts/ — don't mix them up. Dossiers include both individual death cases AND analytical reports like the indigenous targeting report.

### StructuredOutput tool may disappear after core agent upgrades
**Error**: `StructuredOutput` tool (used for sending messages and controlling log-only output) disappeared mid-session after a nanoclaw core agent upgrade.
**Fix**: Use `mcp__nanoclaw__send_message` directly for all user-facing messages. For log-only output, wrap in `<internal>` tags per CLAUDE.md instructions.
**Prevention**: Don't depend on tools that may change between upgrades. `send_message` is the stable path.
