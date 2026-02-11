---
name: site-manage
description: Manage The Deportation Machine site infrastructure. Navigation via awesome-pages .pages files, Material theme config, CSS, plugins, build troubleshooting. Triggers on "site nav", "site theme", "site config", "fix site".
---

# Site Manager — The Deportation Machine

Manage the MkDocs site infrastructure: navigation, theme, plugins, CSS, and build pipeline.

## Key Paths

| What | Path |
|------|------|
| MkDocs config | `groups/main/site/mkdocs.yml` |
| Build script | `groups/main/site/build.sh` |
| Custom CSS | `groups/main/site/docs/stylesheets/extra.css` |
| Python deps | `groups/main/site/requirements.txt` |
| Root nav | `groups/main/site/docs/.pages` |
| Section navs | `groups/main/site/docs/*/.pages` |
| Templates | `groups/main/site/skills/templates/` |

## Navigation (awesome-pages)

Navigation is managed via `.pages` files in each directory, NOT in `mkdocs.yml`.

### .pages File Format

```yaml
# Explicit ordering:
nav:
  - Overview: index.md
  - Second Page: page2.md
  - Third Page: page3.md

# Auto-include remaining files:
nav:
  - Index: index.md
  - ...

# Just auto-include everything:
nav:
  - ...
```

### Current Structure

```
docs/.pages              — Top-level section order
docs/victims/.pages      — The Dead section
docs/dossiers/.pages     — Dossiers (uses ... glob for auto-discovery)
docs/violence/.pages     — Violence tracker
docs/infrastructure/.pages — Infrastructure
docs/cases/.pages        — Case studies (uses ... glob)
docs/methodology/.pages  — Methodology
docs/about/.pages        — About
```

### Adding a New Section

1. Create directory under `docs/`
2. Add an `index.md` page
3. Create a `.pages` file with nav order
4. Add the section to `docs/.pages` in the desired position

### Reordering Navigation

Edit the relevant `.pages` file. The order in the `nav:` list is the display order.

## Theme Configuration

The site uses Material for MkDocs with these features:

- **Color scheme:** Slate (dark) / Default (light) toggle
- **Primary color:** Red
- **Accent:** Deep orange
- **Font:** Inter (text), JetBrains Mono (code)
- **Logo:** material/shield-alert
- **Features:** navigation.tabs, navigation.sections, navigation.expand, navigation.top, search.suggest, search.highlight, content.tabs.link, toc.integrate

### Modifying Theme

Edit `mkdocs.yml` under the `theme:` key. See Material docs for available options.

Common requests:
- Add navigation feature: `theme.features` list
- Change colors: `theme.palette` entries
- Add social links: `extra.social` list

## CSS Customization

Custom styles in `docs/stylesheets/extra.css`.

Current custom classes:
- `.status-verified` / `.status-pending` / `.status-disputed` — Status badges
- `.dossier-card` — Bordered card with hover effect
- `.pipeline-arrow` — Large centered arrows

To add new CSS:
1. Edit `docs/stylesheets/extra.css`
2. Rebuild to verify

## Plugins

Current plugins (in `mkdocs.yml`):
- `search` — Built-in search
- `awesome-pages` — Directory-based navigation
- `git-revision-date-localized` — Shows last updated date on pages

To add a plugin:
1. Add to `requirements.txt`
2. Add to `plugins:` list in `mkdocs.yml`
3. Rebuild

## Build Pipeline

### Build Command

```bash
bash groups/main/site/build.sh
```

The build script:
1. Installs Python dependencies from `requirements.txt`
2. Syncs dossiers from `osint/dossiers/` → `docs/dossiers/`
3. Syncs standalone analysis files
4. Runs `mkdocs build --clean`
5. Reports page count and size
6. Warns if page count drops below 70

### Common Build Errors

**Plugin not found:**
```
ERROR - Config value 'plugins': The "awesome-pages" plugin is not installed
```
Fix: `pip install mkdocs-awesome-pages-plugin` or ensure `requirements.txt` is installed.

**Nav conflict:**
```
WARNING - The following pages exist in the docs directory, but are not included in the "nav" configuration
```
Fix: Remove `nav:` from `mkdocs.yml` — awesome-pages handles it via `.pages` files.

**Missing page referenced in .pages:**
```
WARNING - A navigation path 'some-page.md' ... does not exist
```
Fix: Check the `.pages` file in that directory, ensure the filename matches.

**Git revision date plugin error (no git repo):**
The build runs inside a container that may not have git history. The `fallback_to_build_date: true` setting handles this.

### Deployment — Codeberg Pages

**Live site**: `https://oilcloth.codeberg.page/the-deportation-machine/`

The site is hosted on **Codeberg Pages**. The repo is `oilcloth/the-deportation-machine` on Codeberg.

- **`main` branch**: Source markdown, mkdocs.yml, build script, templates
- **`pages` branch**: Built HTML (what Codeberg serves)
- **`codeberg` remote**: `https://codeberg.org/oilcloth/the-deportation-machine.git` (auth via CODEBERG_API_KEY in .env)

Build outputs to `groups/main/site/site/`. To deploy:

```bash
cd groups/main/site

# Copy build to temp, switch to pages branch, replace contents, push
cp -r site /tmp/site-deploy
git checkout pages
find . -maxdepth 1 ! -name '.git' ! -name '.' -exec rm -rf {} +
cp -r /tmp/site-deploy/* .
rm -rf .cache
git add -A && git commit -m "Deploy: [description]" && git push codeberg pages
git checkout main
rm -rf /tmp/site-deploy
```

If the `codeberg` remote is missing, re-add it:
```bash
CBTOKEN=$(grep '^CODEBERG_API_KEY' .env | cut -d= -f2 | tr -d "'\"")
git remote add codeberg "https://oilcloth:${CBTOKEN}@codeberg.org/oilcloth/the-deportation-machine.git"
```

### Root Pages Repo

`oilcloth.codeberg.page/` (domain root, no path) is a separate repo: `oilcloth/pages` on Codeberg, `main` branch. Contains a redirect to the site and Google site verification file. Only touch this for domain-level files.

## Troubleshooting Procedure

1. Read `mkdocs.yml` — check for syntax errors
2. Check `.pages` files — verify referenced files exist
3. Run build — read error output carefully
4. Check `requirements.txt` — ensure all plugins listed
5. Verify file structure — `ls` the docs directories

## Markdown Extensions

Available extensions (configured in `mkdocs.yml`):
- `admonition` — Callout boxes
- `pymdownx.details` — Collapsible sections
- `pymdownx.superfences` — Enhanced code blocks
- `pymdownx.tabbed` — Content tabs
- `pymdownx.critic` — Critic markup
- `pymdownx.caret` — Superscript (^^text^^)
- `pymdownx.mark` — Highlighting (==text==)
- `pymdownx.tilde` — Strikethrough (~~text~~)
- `tables` — Tables
- `attr_list` — Attribute lists for CSS classes
- `md_in_html` — Markdown inside HTML blocks
- `toc` — Table of contents with permalinks
