# CLAUDE.md — Mermug's ship's docs

This repository is the ship's documentation for **Mermug**, a 1994 Beneteau
First 42s7: procedures, systems notes, the maintenance log. Every `.md` file
under `docs/` is published as a page of a static GitHub Pages site that works
offline on a phone. `AGENTS.md` is a symlink to this file.

Read this file before changing anything.

## Layout

| Path | What it is | Edit? |
|---|---|---|
| `docs/**.md` | The documents | **Yes** — this is the job |
| `docs/**/images/*` | Photos and diagrams referenced by a document | Yes |
| `docs/maintenance/log.md` | The maintenance log, newest first | Add entries at the top only |
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

## Document format

Front matter is optional and flat (`key: value`, one per line; nothing nested):

```markdown
---
title: Man Overboard
category: Operations
order: 10
---

# Man Overboard

Stop the boat. Throw flotation. Assign a spotter.
```

- **Title**: `title:` or the first `# H1`. One of them is required.
- **Category** groups the sidebar. Default is the top-level folder name
  (`docs/systems/x.md` → `Systems`), else `General`. `Operations`, `Systems`,
  `Maintenance` and `Voyages` sort first, in that order; anything else sorts
  alphabetically after.
- **Order** sorts within a category, low first. Default 100.
- **Description** for the search index defaults to the first paragraph.
- A file whose name starts with `_` is a draft: committed, not published.

Where files go:

| Category | Folder | Examples |
|---|---|---|
| Operations | `docs/operations/` | MOB, reefing, anchoring, engine start, departure checklist |
| Systems | `docs/systems/` | Electrical, plumbing, rig, Signal K / N2K network, engine |
| Maintenance | `docs/maintenance/` | Service intervals, spares list, winterizing, the log |
| Voyages | `docs/voyages/` | Passage notes, `YYYY-MM-DD-<destination>.md` |

## House rules

- **One subject per file, named for the subject**, lowercase-hyphenated:
  `docs/systems/raw-water.md`, not `docs/notes-2.md`. The filename is the URL.
- **Write for the person holding the phone** — in the dark, wet, one-handed,
  no signal. Numbered steps, in order. Consequence first: "Close the seacock"
  before the paragraph explaining why. A procedure should fit on one or two
  phone screens; move background to a Systems doc and link to it.
- **Checklists** (`- [ ] item`) render as tickable boxes, stored per device.
  Use them for anything done in sequence under time pressure.
- **Links and images are relative to the document's own folder**, exactly as
  on GitHub: from `docs/operations/mob.md`, link `[Engine](../systems/engine.md)`
  and embed `![Panel](images/panel.jpg)` for `docs/operations/images/panel.jpg`.
  Anchors work: `[Bleeding](../systems/engine.md#bleeding-the-fuel-system)`.
- **Tables** for specs, capacities, part numbers, valve positions. They scroll
  sideways on a phone; keep them to 4–5 columns.
- **Units**: US English. Metric by default, °F for temperature. Imperial where
  the hardware standard is imperial (chain, shackles, fasteners, hose ID),
  with metric in parentheses when it matters.
- **Do not invent equipment.** If a model number, torque spec, capacity or
  part number is not in what you were given, write `**Unverified:**` and what
  is unknown. A confident wrong number in a procedure is worse than a gap.
  Never fill a gap with the "typical" value for a First 42s7.
- **This repository is public.** No credentials, Wi-Fi passwords, gate codes,
  MMSI-linked personal details, home address, or slip number.

## Vessel facts

Only what is confirmed. Add to this list as facts are confirmed; mark
anything else unverified in the document that uses it.

- Name: Mermug
- Hull: 1994 Beneteau First 42s7
- Electronics: Signal K server on OpenPlotter (Raspberry Pi 5), NMEA 2000
  backbone. ESP32/SensESP sensors live in
  [`zackphillips/mermug-esp`](https://github.com/zackphillips/mermug-esp); the
  public tracker is published by
  [`zackphillips/signalk-github-pages`](https://github.com/zackphillips/signalk-github-pages).

## The maintenance log

`docs/maintenance/log.md` is one file, newest entry first, each entry a
level-2 heading. Insert new entries directly below the intro; never rewrite or
reorder existing ones.

```markdown
## 2026-09-20: Replaced the raw-water impeller

- System: Engine
- Engine hours: 1204.5
- Logged by: Zack

Old impeller had two vanes torn. Spare used; one left aboard.
```

## Working here

- Nothing to install. Node 18+ is only needed for the check script.
- Do not add a package manifest, linter or framework.
- Commit messages are plain and imperative: `Add reefing procedure`,
  `Log impeller change`.
- Keep commits and PRs small — they get reviewed on a phone.
- The `/new-doc` and `/log-maintenance` skills in `.claude/skills/` carry the
  step-by-step for the two common jobs.
