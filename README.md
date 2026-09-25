# Mermug ship's docs

Procedures, systems reference and the maintenance log for Mermug, a 1994
Beneteau First 42s7, published as an offline-capable GitHub Pages site.

Site: https://zackphillips.github.io/mermug-ships-docs/

## Adding a document

Commit a Markdown file under `docs/`. The Pages workflow builds the index and
deploys on every push to `main`. Conventions, front matter and house rules are
in [`CLAUDE.md`](CLAUDE.md); Claude Code (and any agent that reads `AGENTS.md`)
picks them up automatically, and the `/new-doc` and `/log-maintenance` skills
cover the two common jobs.

```sh
node scripts/build-index.mjs --check                            # validate links and titles
node scripts/build-index.mjs && python3 -m http.server 8000     # preview locally
```

## Setup (once)

Settings → Pages → Build and deployment → Source: **GitHub Actions**.

## Origin

The reader (`index.html`, `assets/`, `sw.js`) and the index builder are ported
from the ship's docs feature of
[`signalk-github-pages`](https://github.com/zackphillips/signalk-github-pages)
at `archive/ships-docs` (753f785).
