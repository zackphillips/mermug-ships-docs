# CLAUDE.md — Mermug's ship's docs

This repository is the ship's documentation for **Mermug**, a 1994 Beneteau
First 42s7: procedures, systems reference and the changelog. The docs moved here from `zackphillips/zackphillips.github.io` (the
mermug.com tracker) with their history. Every `.md` file
under `docs/` is published as a page of a static GitHub Pages site that works
offline on a phone. `AGENTS.md` is a symlink to this file.

Read this file before changing anything.

## Layout

| Path | What it is | Edit? |
|---|---|---|
| `docs/**.md` | The documents | **Yes** — this is the job |
| `docs/images/*` | Photos and diagrams referenced by a document | Yes |
| `index.html`, `sw.js`, `manifest.json`, `assets/` | The reader (ported from `signalk-github-pages`) | Only when asked to change the site |
| `scripts/build-index.mjs` | Builds `docs/index.json`; `--check` validates | Only when asked |
| `.github/workflows/pages.yml` | Checks PRs, deploys `main` to Pages | Only when asked |
| `docs/index.json` | Generated, gitignored | **Never commit it** |

## How a document becomes a page

There is no build step to run before committing. On every push to `main` the
Pages workflow runs `scripts/build-index.mjs`, which writes `docs/index.json`,
and deploys. The reader fetches that index, then each `.md` file, and renders
it client-side with `marked`. A pull request runs the same script with
`--check`, which fails on a broken relative link, a missing image, or a
document with no title.

Before committing, run:

```sh
node scripts/build-index.mjs --check
```

To preview locally: `node scripts/build-index.mjs && python3 -m http.server 8000`,
then open `http://localhost:8000/`.

## The documents

Flat files under `docs/`, each with front matter setting its category and
order. Revise the existing document that covers a subject before creating a
new one; most subjects already have a home.

| File | Category | What it holds |
|---|---|---|
| `operations.md` | Operations | Checklists and every stepwise how-to: departure, engine start, sails, anchoring, fueling, tanks, propane, heads, emergencies, radio |
| `mob-procedure.md` | Operations | Man overboard |
| `debugging.md` | Operations | Fault-finding |
| `signalk.md` | Systems | Signal K server, data sources, sensors, plugins, alarms |
| `remote-access.md` | Systems | VPN into the boat |
| `systems.md` | Systems | The source of truth for what is installed, numbered §1–13 |
| `changelog.md` | Maintenance | Repairs, installs, upgrades, haul-outs: the full history |
| `planned-projects.md` | Maintenance | Rollup of every Planned item |
| `project-ideas.md` | Maintenance | Longer design notes for projects not yet planned |
| `maintenance.md` | Maintenance | Rollup of every recurring Maintenance item, with Last Done |
| `_template.md` | (draft) | Starting point for a new document; not published |

Front matter is flat `key: value` (title, category, order, description).
`Operations`, `Systems`, `Maintenance`, `Voyages` sort first in the sidebar;
`order` sorts within a category, low first. A `_`-prefixed file is a draft.

### Conventions already in the docs

- **Status tags**, raw HTML inline, legend at the top of `systems.md`:
  `<span class="doc-tag doc-tag--issue">Unresolved</span>`,
  `<span class="doc-tag doc-tag--partial">Partial Fix</span>`,
  `<span class="doc-tag doc-tag--planned">Planned</span>`,
  `<span class="doc-tag doc-tag--maintenance">Maintenance</span>`.
  Every Planned item must also appear in `planned-projects.md` and every
  Maintenance item in `maintenance.md`. Add or remove both together.
- **Unconfirmed values** are `—` or `[in brackets]`. Never replace one with
  a guess or with the "typical" value for a First 42s7. A confident wrong
  number in a procedure is worse than a gap.
- **Current state vs. history**: `systems.md` describes the boat as it is
  now. What changed, when and why goes in `changelog.md`. A repair usually
  touches both.
- **Cross-links** are plain relative links with anchors:
  `[Engine & Drive](systems.md#2-engine-drive)`. Anchors are the heading
  lowercased, punctuation dropped, spaces to hyphens. Renaming a heading
  breaks every anchor to it: `grep -rn '#old-anchor' docs/` first.
- **Images** go under `docs/images/`, linked relative to the document
  (`images/panel.jpg`).
- **Links outside `docs/`** must be absolute GitHub URLs; they are not
  published. The checker enforces this.

### House rules

- **Write for the person holding the phone**: in the dark, wet,
  one-handed, no signal. Procedures are numbered steps, consequence first
  ("Close the seacock", then why). `- [ ]` items render as tickable boxes.
- **Tables** for specs, capacities, part numbers, valve positions; keep new
  ones to 4–5 columns so they read on a phone.
- **Units**: US English. Imperial where the hardware or the existing doc
  uses it (feet, gallons, chain, fasteners), metric in parentheses when it
  matters. °F for temperature.
- **Public repository.** Registration numbers, MMSI and home berth are
  already published on purpose. Never add credentials, Wi-Fi or VPN
  passwords, gate or lock codes, account numbers, or insurance policy
  details.

## Logging work

- **Repairs, installs, haul-outs** → `changelog.md`. Entries are
  `### YYYY-MM-DD: What was done` with bullets beneath, in chronological
  order; append new ones after the last dated entry in the `## 2025`
  section (it holds everything since purchase). Then update Last Done in
  `maintenance.md` and the affected `systems.md` section.
- **Voyages** are not logged here. The voyage log lives with the tracker
  in `zackphillips/zackphillips.github.io`; do not add voyage or trip
  entries to this repository.

## Working here

- Nothing to install. Node 18+ is only needed for the check script.
- Do not add a package manifest, linter or framework.
- Commit messages are plain and imperative: `Add reefing procedure`,
  `Log impeller change`.
- Keep commits and PRs small — they get reviewed on a phone.
- The `/new-doc` and `/log-maintenance` skills in `.claude/skills/` carry the
  step-by-step for the two common jobs.
- Facts about the boat come from the docs: the headers of `operations.md`
  and `systems.md`, then the relevant `systems.md` section.
