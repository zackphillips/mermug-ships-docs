---
name: log-maintenance
description: Add an entry to the maintenance log (docs/maintenance/log.md) for work done on the boat. Use when told about a repair, service, part replacement, inspection or fault.
---

# Log maintenance

1. Collect: date (default today), what was done, system, engine hours if the
   engine was involved, parts used and spares remaining, who did it. Ask only
   for what is missing and matters; leave engine hours out rather than guess.
2. Insert the entry in `docs/maintenance/log.md` directly below the intro
   paragraph, above every existing entry, in exactly this shape:

   ```markdown
   ## YYYY-MM-DD: <What was done, imperative past tense>

   - System: <Engine | Electrical | Plumbing | Rig | Sails | Hull | Electronics | Safety | Deck>
   - Engine hours: <n>
   - Logged by: <name>

   <Findings, parts and part numbers, spares left aboard, follow-ups.>
   ```

   Never edit or reorder existing entries.
3. If the work changes a fact in a Systems or Maintenance document (a new part
   number, a changed service interval, equipment replaced), update that
   document too and link the log entry from it.
4. If a follow-up is needed, say so at the end of the entry as
   `Follow-up: ...`.
5. Run `node scripts/build-index.mjs --check`, then commit as
   `Log <short description>`.
