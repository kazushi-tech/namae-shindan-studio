#!/usr/bin/env node
/**
 * scripts/build-diff.js
 *
 *   ルート HTML と dist HTML の unified diff を Markdown 形式で出力する (人間レビュー用)。
 *   実行: npm run build:diff > diff-report.md
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTwoFilesPatch } from 'diff';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const PAIRS = [
  'index.html',
  'shindan.html',
  'about.html',
  'favorites.html',
  'privacy-policy.html',
  'suggestion.html',
  '404.html',
  'kanji/index.html',
  'ranking/index.html',
  'ranking/2026-boys.html',
  'ranking/2026-girls.html',
  'guide/index.html',
  'guide/faq.html',
  'guide/meimei-hikaku.html',
  'guide/meimei-tools.html',
  'guide/miyamairi.html',
  'guide/shussan-list.html',
];

function normalizeForDiff(s) {
  // Strip cache-busting version tags so diff focuses on semantic changes
  return s
    .replace(/\?v=[a-z0-9]+/g, '?v=VERSION')
    .replace(/\s+$/gm, '')
    .replace(/\r\n/g, '\n');
}

function diffPair(rel) {
  const srcPath = path.join(ROOT, rel);
  const dstPath = path.join(DIST, rel);
  if (!fs.existsSync(srcPath) || !fs.existsSync(dstPath)) {
    console.log(`\n## ${rel}\n\n_skipped (file missing)_\n`);
    return;
  }
  const a = normalizeForDiff(fs.readFileSync(srcPath, 'utf8'));
  const b = normalizeForDiff(fs.readFileSync(dstPath, 'utf8'));
  if (a === b) {
    console.log(`\n## ${rel}\n\n_no diff_\n`);
    return;
  }
  const patch = createTwoFilesPatch(rel, `dist/${rel}`, a, b, '', '', { context: 3 });
  console.log(`\n## ${rel}\n\n\`\`\`diff\n${patch}\`\`\`\n`);
}

function main() {
  console.log('# Build Diff Report\n');
  console.log(`Generated: ${new Date().toISOString()}\n`);
  for (const rel of PAIRS) diffPair(rel);
}

main();
