---
name: new-doc
description: Write or revise a ship's document (procedure, systems note, checklist, passage note) under docs/ from notes, photos, manuals or a conversation. Use when asked to add, draft, update or reorganize a doc in this repository.
---

# New or revised ship's document

1. Read `CLAUDE.md` if it is not already in context.
2. Search `docs/` for an existing document on the subject (`grep -ril`). Revise
   it rather than creating a near-duplicate; split it only if it now covers two
   subjects.
3. Pick the category folder and a subject filename per the table in
   `CLAUDE.md`. Add front matter only when the defaults are wrong (e.g. an
   `order:` to put MOB first in Operations).
4. Write it:
   - Procedures: a one-line purpose, then numbered steps, consequence first.
     Checklists as `- [ ]`. Fit on one or two phone screens; move background
     to a Systems doc and link it.
   - Systems notes: what it is, where it is on the boat, specs table, how to
     service it, known failure modes, links to the procedures that use it.
   - Every number you were not given is `**Unverified:**`, not a guess.
5. Link it from related documents in both directions, using paths relative to
   each file.
6. Images: save under `images/` next to the document, lowercase-hyphenated,
   and reference them relatively. Resize anything over ~1600 px on the long
   edge before committing if a tool is available.
7. Run `node scripts/build-index.mjs --check` and fix every problem it reports.
8. Commit with a plain message (`Add reefing procedure`). List every
   `Unverified` item in your reply so the owner can fill them in.
