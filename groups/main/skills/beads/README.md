# Beads - Research Issue Tracker

Track research projects and long-running tasks using beads.

## Scope

oilcloth uses the `research-` prefix for all issues. Development issues use `nanoclaw-`.

**Your issues**: `research-*`
**Dev issues**: `nanoclaw-*` (read-only for you)

## Commands

```bash
# List your research issues
./skills/beads/list.sh

# Create a new research issue
./skills/beads/create.sh "Research topic title" "Description of what to investigate"

# Update issue status
./skills/beads/update.sh research-abc in_progress
./skills/beads/update.sh research-abc completed

# Show issue details
./skills/beads/show.sh research-abc
```

## Workflow

1. **User asks for research** → Create issue with `create.sh`
2. **Start working** → Update to `in_progress`
3. **Create dossier** → Link to issue in description
4. **Complete** → Update to `completed`

## Status Values

- `open` - Not started
- `in_progress` - Currently working on it
- `completed` - Done
- `blocked` - Waiting on something

## Integration with Dossiers

When creating a dossier for a research issue, add the issue ID to the dossier metadata:

```json
{
  "related_issues": ["research-abc"]
}
```
