// Settings for the reader. Uses var (not const) so docs.js can read it as
// window.VESSEL_CONSTANTS.

var VESSEL_CONSTANTS = Object.freeze({
  // Cycle order for the floating theme button. The first two are dark.
  THEMES:      ['marine', 'amber', 'bright'],
  DARK_THEMES: ['marine', 'amber'],

  // Built from docs/**.md by scripts/build-index.mjs. Never committed: the
  // Pages workflow generates it on every deploy.
  DOCS_INDEX_URL: 'docs/index.json',
  // Sidebar section order. docs/index.json sorts categories alphabetically so
  // it stays predictable to diff; this list is what the sidebar follows.
  // Categories not listed here sort alphabetically after the ones that are.
  DOCS_CATEGORY_ORDER: ['Operations', 'Systems', 'Maintenance', 'Voyages'],
  // Checklist ticks are per-device UI state. They live in localStorage under
  // this prefix and are never committed anywhere.
  DOCS_CHECKLIST_PREFIX: 'shipsdocs.checklist.',

  // "Edit on GitHub" links. Only collaborators can commit straight to the
  // branch; GitHub routes everyone else through fork + pull request.
  GITHUB_REPO: 'zackphillips/mermug-ships-docs',
  GITHUB_DEFAULT_BRANCH: 'main',
});
