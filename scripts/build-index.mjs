#!/usr/bin/env node
// Build docs/index.json — the catalog behind index.html — and check the docs.
//
// A static site cannot list a directory, so the reader needs a manifest of the
// Markdown under docs/. Ported from the signalk-github-pages plugin's
// docsIndex.ts, with no dependencies so it runs anywhere Node 18+ does.
//
//   node scripts/build-index.mjs                 write docs/index.json
//   node scripts/build-index.mjs --out _site     write _site/docs/index.json
//   node scripts/build-index.mjs --check         write nothing; exit 1 on problems
//
// Problems (always reported, fatal with --check): a relative link to a .md file
// or an image that does not exist, a #anchor that matches no h2/h3 heading, a
// document with no title, a Planned or Maintenance tag in systems.md whose
// section is not rolled up in planned-projects.md / maintenance.md, and a line
// that looks like a credential (this repository is public).

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS_DIR = 'docs';
const DEFAULT_CATEGORY = 'General';
const DEFAULT_ORDER = 100;
/** Descriptions are teaser text — keep them one line. */
const DESCRIPTION_MAX_CHARS = 180;

const FRONT_MATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/;
const ATX_HEADING_RE = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
const FENCE_RE = /^\s*(```|~~~)/;
const LINK_RE = /\[([^\]]*)\]\([^)]*\)/g;
const EMPHASIS_RE = /[*_`]+/g;
const HTML_COMMENT_RE = /<!--[\s\S]*?-->/g;
// Inline links and images: [text](target "title") / ![alt](target)
const TARGET_RE = /(!?)\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;

// Rollups: every tag of a kind in `systems.md` must be reachable from the
// rollup page that CLAUDE.md says carries it. The check is per section (h2/h3),
// not per bullet: a link to the section, or to the h2 that contains it, counts.
const ROLLUP_SOURCE = 'docs/systems.md';
const ROLLUPS = [
  { tag: 'planned', page: 'docs/planned-projects.md', label: 'Planned' },
  { tag: 'maintenance', page: 'docs/maintenance.md', label: 'Maintenance' },
];
const TAG_RE = /doc-tag--(\w+)/g;

// Anything matching is reported unless the line carries this marker.
const SECRET_OK = '<!-- secrets-ok -->';
const SECRET_PATTERNS = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
  [/\b(?:ghp|gho|ghs|github_pat)_[A-Za-z0-9_]{20,}/, 'GitHub token'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'AWS access key'],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}/, 'Slack token'],
  [/^\s*(?:Private|Preshared)Key\s*=\s*\S{20,}/im, 'WireGuard key'],
  [
    /\b(?:pass(?:word|phrase)|passwd|psk|pre-?shared key|api[ _-]?key|secret|(?:gate|lock|door|keypad) code|combination)\b\W{0,3}(?:is\b|[:=])\s*[`"']?[^\s`"'<>|]{4,}/i,
    'looks like a credential or access code',
  ],
];

/** Instruction files and drafts are not ship's documents. */
const NOT_DOCUMENTS = new Set(['agents.md', 'claude.md', 'readme.md']);

/**
 * Front matter is flat `key: value` lines — title, category, order,
 * description. Anything fancier is ignored rather than thrown: a typo in one
 * procedure must not take the whole site offline.
 */
export function splitFrontMatter(text) {
  const match = FRONT_MATTER_RE.exec(text);
  if (!match) return { meta: {}, body: text };
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_][\w-]*)\s*:\s*(.*?)\s*$/.exec(line);
    if (!kv) continue;
    let value = kv[2];
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
    meta[kv[1]] = value;
  }
  return { meta, body: text.slice(match[0].length) };
}

export function stripInlineMarkdown(text) {
  return text
    .replace(HTML_COMMENT_RE, '')
    .replace(LINK_RE, '$1')
    .replace(EMPHASIS_RE, '')
    .split(/\s+/)
    .filter(Boolean)
    .join(' ');
}

/** Yield `[line, inCodeFence]` — headings inside fences are examples, not structure. */
function* contentLines(body) {
  let inFence = false;
  for (const line of body.split(/\r?\n/)) {
    if (FENCE_RE.test(line)) {
      inFence = !inFence;
      yield [line, true];
      continue;
    }
    yield [line, inFence];
  }
}

export function extractHeadings(body) {
  const headings = [];
  for (const [line, inFence] of contentLines(body)) {
    if (inFence) continue;
    const match = ATX_HEADING_RE.exec(line);
    if (!match) continue;
    const text = stripInlineMarkdown(match[2]);
    if (text) headings.push({ level: match[1].length, text });
  }
  return headings;
}

/** First paragraph of prose, skipping headings, quotes, lists and tables. */
export function deriveDescription(body) {
  const parts = [];
  for (const [line, inFence] of contentLines(body)) {
    if (inFence) continue;
    const stripped = line.trim();
    if (!stripped) {
      if (parts.length) break;
      continue;
    }
    const skip = /^[#>|\-*+<!]/.test(stripped) || stripped === '---' || /^\d+\.\s/.test(stripped);
    if (skip) {
      if (parts.length) break;
      continue;
    }
    parts.push(stripped);
  }
  const text = stripInlineMarkdown(parts.join(' '));
  if (text.length <= DESCRIPTION_MAX_CHARS) return text;
  const truncated = text.slice(0, DESCRIPTION_MAX_CHARS);
  const cut = truncated.lastIndexOf(' ');
  return `${cut > 0 ? truncated.slice(0, cut) : truncated}…`;
}

function titleCase(text) {
  return text
    .split(' ')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word))
    .join(' ');
}

function titleFromFilename(path) {
  const stem = path.split('/').pop().replace(/\.md$/i, '');
  return titleCase(stem.replace(/[-_]/g, ' ').trim());
}

export function isPublishedDoc(path) {
  if (!path.startsWith(`${DOCS_DIR}/`) || !path.toLowerCase().endsWith('.md')) return false;
  const name = path.split('/').pop();
  return !name.startsWith('_') && !NOT_DOCUMENTS.has(name.toLowerCase());
}

export function buildEntry(doc) {
  const { meta, body } = splitFrontMatter(doc.text);
  const headings = extractHeadings(body);
  const h1 = headings.find((heading) => heading.level === 1)?.text;
  const rel = doc.path.slice(DOCS_DIR.length + 1);
  const parent = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '';
  const order = Number.parseInt(String(meta.order ?? DEFAULT_ORDER), 10);

  const entry = {
    slug: rel.replace(/\.md$/i, ''),
    path: doc.path,
    title: String(meta.title || h1 || titleFromFilename(doc.path)),
    category: String(
      meta.category || (parent ? titleCase(parent.split('/')[0].replace(/[-_]/g, ' ')) : DEFAULT_CATEGORY),
    ),
    order: Number.isFinite(order) ? order : DEFAULT_ORDER,
    description: String(meta.description || deriveDescription(body)),
    // Level 1 duplicates the title; the reader builds its table of contents
    // from the rendered DOM. This list exists so search finds text not yet
    // on screen.
    headings: headings.filter((heading) => heading.level > 1),
    words: body.split(/\s+/).filter(Boolean).length,
  };
  if (doc.updated) entry.updated = doc.updated;
  return { entry, hasTitle: Boolean(meta.title || h1) };
}

// Mirrors slugify() and decorateHeadings() in assets/docs.js: the reader gives
// ids to h2 and h3 headings only, numbering repeats "-2", "-3", …
function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function headingText(markdown) {
  return markdown
    .replace(/<[^>]*>/g, '')
    .replace(LINK_RE, '$1')
    .replace(/[`*]/g, '')
    .replace(/(^|\W)_+|_+(?=\W|$)/g, '$1')
    .replace(/&amp;/g, '&')
    .trim();
}

/** Sections the reader can link to: `[{ id, level }]` for each h2/h3, in order. */
export function headingSections(body) {
  const used = new Set();
  const sections = [];
  for (const [line, inFence] of contentLines(body)) {
    if (inFence) continue;
    const match = ATX_HEADING_RE.exec(line);
    if (!match || match[1].length < 2 || match[1].length > 3) continue;
    const id = slugify(headingText(match[2])) || 'section';
    let candidate = id;
    for (let n = 1; used.has(candidate); ) candidate = `${id}-${++n}`;
    used.add(candidate);
    sections.push({ id: candidate, level: match[1].length });
  }
  return sections;
}

/** Relative link/image targets that do not exist on disk, and anchors that match no heading. Mirrors docs.js. */
export function findBrokenTargets(doc, exists, anchorsOf = () => null) {
  const problems = [];
  const { body } = splitFrontMatter(doc.text);
  for (const [line, inFence] of contentLines(body)) {
    if (inFence) continue;
    for (const match of line.matchAll(TARGET_RE)) {
      const [, bang, raw] = match;
      if (/^([a-z][a-z0-9+.-]*:|\/)/i.test(raw)) continue;
      const target = decodeURIComponent(raw.split('#')[0].split('?')[0]);
      const fragment = raw.includes('#') ? decodeURIComponent(raw.slice(raw.indexOf('#') + 1)) : '';
      if (!target) {
        // `#anchor` within this document.
        if (fragment && !anchorsOf(doc.path)?.has(fragment)) {
          problems.push(`${doc.path}: link "${raw}" matches no h2/h3 heading in this document`);
        }
        continue;
      }
      const resolved = posix.normalize(posix.join(posix.dirname(doc.path), target));
      if (!bang && !resolved.toLowerCase().endsWith('.md')) continue;
      if (!resolved.startsWith(`${DOCS_DIR}/`)) {
        problems.push(`${doc.path}: ${bang ? 'image' : 'link'} "${raw}" → ${resolved} is outside ${DOCS_DIR}/ and is not published; use an absolute GitHub URL`);
      } else if (!exists(resolved)) {
        problems.push(`${doc.path}: ${bang ? 'image' : 'link'} "${raw}" → ${resolved} does not exist`);
      } else if (!bang && fragment && !anchorsOf(resolved)?.has(fragment)) {
        problems.push(`${doc.path}: link "${raw}" → ${resolved} has no h2/h3 heading with that anchor`);
      }
    }
  }
  return problems;
}

/**
 * Planned / Maintenance tags in systems.md whose section no rollup page links
 * to. `rollupTexts` maps a rollup path to its text.
 */
export function findUnrolledTags(sourceText, rollupTexts) {
  const problems = [];
  const { body } = splitFrontMatter(sourceText);
  const sections = headingSections(body);
  const tagged = sections.map(() => new Set());
  let index = -1;
  let seen = 0;
  for (const [line, inFence] of contentLines(body)) {
    if (inFence) continue;
    const heading = ATX_HEADING_RE.exec(line);
    if (heading) {
      const level = heading[1].length;
      if (level === 1) index = -1;
      else if (level <= 3) index = seen++;
      if (level <= 3) continue;
    }
    if (index < 0) continue;
    for (const [, tag] of line.matchAll(TAG_RE)) tagged[index].add(tag);
  }
  const sourceName = ROLLUP_SOURCE.split('/').pop();
  for (const { tag, page, label } of ROLLUPS) {
    const text = rollupTexts[page] ?? '';
    const linked = new Set(
      [...text.matchAll(new RegExp(`\\]\\(\\s*${sourceName}#([^)\\s]+)`, 'g'))].map((m) => decodeURIComponent(m[1])),
    );
    let parent = null;
    sections.forEach((section, i) => {
      if (section.level === 2) parent = section;
      if (!tagged[i].has(tag)) return;
      const container = section.level === 3 ? parent : null;
      if (linked.has(section.id) || (container && linked.has(container.id))) return;
      problems.push(
        `${ROLLUP_SOURCE}: "#${section.id}" has a ${label} tag but ${page} does not link to it (or to its h2); add it there, or remove the tag`,
      );
    });
  }
  return problems;
}

/** Lines that look like a credential. This repository is public. */
export function findSecrets(doc) {
  const problems = [];
  doc.text.split(/\r?\n/).forEach((line, i) => {
    if (line.includes(SECRET_OK)) return;
    for (const [pattern, what] of SECRET_PATTERNS) {
      if (pattern.test(line)) {
        problems.push(`${doc.path}:${i + 1}: ${what} — remove it, or append ${SECRET_OK} if it is not one`);
        break;
      }
    }
  });
  return problems;
}

function walk(dir) {
  const out = [];
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, item.name);
    if (item.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

/** Last commit date per path, from one `git log` pass. Empty outside a checkout. */
function lastCommitDates() {
  const dates = new Map();
  let log;
  try {
    log = execFileSync('git', ['log', '--format=%x00%cI', '--name-only', '--', DOCS_DIR], {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return dates;
  }
  let current = null;
  for (const line of log.split('\n')) {
    if (line.startsWith('\0')) current = line.slice(1);
    else if (line && current && !dates.has(line)) dates.set(line, current);
  }
  return dates;
}

function main(argv) {
  const check = argv.includes('--check');
  const outFlag = argv.indexOf('--out');
  const outRoot = outFlag >= 0 ? resolve(argv[outFlag + 1]) : ROOT;

  const docsRoot = join(ROOT, DOCS_DIR);
  const files = existsSync(docsRoot)
    ? walk(docsRoot).map((full) => relative(ROOT, full).split('\\').join('/'))
    : [];
  const fileSet = new Set(files);
  const dates = lastCommitDates();

  const problems = [];
  const entries = [];
  const docs = files
    .filter(isPublishedDoc)
    .sort()
    .map((path) => ({ path, text: readFileSync(join(ROOT, path), 'utf8'), updated: dates.get(path) }));
  const anchors = new Map(
    docs.map((doc) => [doc.path, new Set(headingSections(splitFrontMatter(doc.text).body).map((s) => s.id))]),
  );
  for (const doc of docs) {
    const { entry, hasTitle } = buildEntry(doc);
    if (!hasTitle) problems.push(`${doc.path}: no "# Heading" or title: front matter`);
    problems.push(...findBrokenTargets(doc, (p) => fileSet.has(p), (p) => anchors.get(p)));
    problems.push(...findSecrets(doc));
    entries.push(entry);
  }
  const byPath = Object.fromEntries(docs.map((doc) => [doc.path, doc.text]));
  if (byPath[ROLLUP_SOURCE]) problems.push(...findUnrolledTags(byPath[ROLLUP_SOURCE], byPath));
  entries.sort(
    (a, b) =>
      a.category.toLowerCase().localeCompare(b.category.toLowerCase()) ||
      a.order - b.order ||
      a.title.toLowerCase().localeCompare(b.title.toLowerCase()),
  );

  for (const problem of problems) console.error(`✗ ${problem}`);

  if (check) {
    console.log(`${entries.length} document(s), ${problems.length} problem(s).`);
    process.exit(problems.length ? 1 : 0);
  }

  const outPath = join(outRoot, DOCS_DIR, 'index.json');
  mkdirSync(dirname(outPath), { recursive: true });
  const index = { generated: new Date().toISOString(), docs: entries };
  writeFileSync(outPath, `${JSON.stringify(index, null, 2)}\n`);
  console.log(`Wrote ${relative(process.cwd(), outPath) || outPath}: ${entries.length} document(s).`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
