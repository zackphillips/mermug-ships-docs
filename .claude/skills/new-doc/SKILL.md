---
name: new-doc
description: Write or revise Mermug's ship's docs under docs/ (procedures, systems notes, checklists, planned projects) from notes, photos, manuals, invoices or a conversation. Use when asked to add, draft, update, correct or reorganize a doc in this repository.
---

# Write or revise a ship's document

1. Read `CLAUDE.md` if it is not already in context.
2. Find where the subject already lives: `grep -rn -i '<subject>' docs/`.
   Most subjects have a home in the table in `CLAUDE.md`: a procedure goes
   in `operations.md` under its own `##`, equipment in its `systems.md`
   section. Create a new file only for a subject that clearly stands alone
   (as `mob-procedure.md` does); start it from `_template.md`.
3. Write it:
   - Procedures: numbered steps, consequence first, `- [ ]` for checklists.
     Keep one procedure to one or two phone screens; move background to
     `systems.md` and link it.
   - Systems: current state only. What it is, where it is aboard, specs
     table, how to service it, known issues with status tags.
   - Anything you were not given is `—` or `[in brackets]`, never a guess.
4. Keep the rollups in sync. If you add or remove a `Planned` tag, do the
   same in `planned-projects.md`; for a `Maintenance` tag, do it in
   `maintenance.md`. If the change reflects work done on the boat, add a
   `changelog.md` entry too (see `/log-maintenance`).
5. If you renamed a heading, fix every link to its old anchor
   (`grep -rn '#old-anchor' docs/`).
6. Run `node scripts/build-index.mjs --check` and fix every problem.
7. Commit with a plain message (`Add reefing procedure`,
   `Correct AIS gateway model`). In your reply, list anything you left as
   `—` or `[…]` so the owner can fill it in.
