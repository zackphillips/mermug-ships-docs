---
name: log-maintenance
description: Record work done on Mermug (repair, service, install, part replacement, haul-out, inspection, fault) in the ship's docs. Use when told about maintenance or handed an invoice or receipt.
---

# Log work

## Work at the dock or on the hard → `docs/changelog.md`

1. Collect the date, what was done, by whom (yard or person), parts and
   part numbers, cost if given, engine hours if the engine was involved.
   Ask only for what is missing and matters. Unknown day of month is
   written `YYYY-MM-XX`, as existing entries do.
2. Append the entry after the last dated `###` entry in the `## 2025`
   section. That section holds everything since purchase; keep it
   chronological. Match the existing shape:

   ```markdown
   ### 2026-09-20: Raw-water impeller replaced
   - Old impeller had two vanes torn; spare used, one left aboard.
   - Engine hours: **6,512**.
   - See [Engine & Drive](systems.md#2-engine-drive).
   ```

3. Update what the work changed:
   - **Last Done** in `maintenance.md`, and the matching row in the
     changelog's Recurring Maintenance Schedule table.
   - The equipment's section in `systems.md` (current state; clear or
     change an `Unresolved` / `Partial Fix` tag when the work resolves it).
   - `planned-projects.md`: tick or remove a project the work completes,
     and remove its `Planned` tag in `systems.md`.

## Voyages

Not logged here: the voyage log lives with the tracker in
`zackphillips/zackphillips.github.io`. Maintenance done underway still goes
in `changelog.md` as above.

## Then

Run `node scripts/build-index.mjs --check` and commit as
`Log <short description>`.
