#!/usr/bin/env node
/**
 * scripts/build-verify.js
 *
 *   ルート *.html と dist/*.html (ビルド出力) のセマンティック差分を検査する。
 *   不一致が許容セット (バージョンタグ・空白・インデントの揺れ) を超えたら exit 1。
 *
 *   実行: npm run build:verify   (前提: 直前に npm run build が実行済み)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const GTM_ID = 'GTM-TKF64R7Q';

const PAIRS = [
  { src: 'index.html',                  dist: 'index.html' },
  { src: 'shindan.html',                dist: 'shindan.html' },
  { src: 'about.html',                  dist: 'about.html' },
  { src: 'favorites.html',              dist: 'favorites.html' },
  { src: 'privacy-policy.html',         dist: 'privacy-policy.html' },
  { src: 'suggestion.html',             dist: 'suggestion.html' },
  { src: '404.html',                    dist: '404.html' },
  { src: 'kanji/index.html',            dist: 'kanji/index.html' },
  { src: 'ranking/index.html',          dist: 'ranking/index.html' },
  { src: 'ranking/2026-boys.html',      dist: 'ranking/2026-boys.html' },
  { src: 'ranking/2026-girls.html',     dist: 'ranking/2026-girls.html' },
  { src: 'guide/index.html',            dist: 'guide/index.html' },
  { src: 'guide/faq.html',              dist: 'guide/faq.html' },
  { src: 'guide/meimei-hikaku.html',    dist: 'guide/meimei-hikaku.html' },
  { src: 'guide/meimei-tools.html',     dist: 'guide/meimei-tools.html' },
  { src: 'guide/miyamairi.html',        dist: 'guide/miyamairi.html' },
  { src: 'guide/shussan-list.html',     dist: 'guide/shussan-list.html' },
];

const KANJI_DATA_PATH = path.join(ROOT, 'data', 'kanji-meanings.json');

const errors = [];

function readFile(p) { return fs.readFileSync(p, 'utf8'); }

function pickTitle(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? m[1].trim() : '';
}

function pickMeta(html, name) {
  const re = new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"`, 'i');
  const m = html.match(re);
  return m ? m[1].trim() : '';
}

function pickProperty(html, prop) {
  const re = new RegExp(`<meta\\s+property="${prop}"\\s+content="([^"]*)"`, 'i');
  const m = html.match(re);
  return m ? m[1].trim() : '';
}

function pickJsonLd(html) {
  const blocks = [];
  const re = /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      blocks.push(JSON.parse(m[1].trim()));
    } catch (e) {
      errors.push(`JSON-LD parse error in ${html.slice(0, 40)}…: ${e.message}`);
    }
  }
  return blocks;
}

function checkPair({ src, dist }) {
  const srcPath = path.join(ROOT, src);
  const dstPath = path.join(DIST, dist);
  if (!fs.existsSync(srcPath)) {
    errors.push(`Missing source: ${src}`);
    return;
  }
  if (!fs.existsSync(dstPath)) {
    errors.push(`Missing dist: ${dist}`);
    return;
  }
  const a = readFile(srcPath);
  const b = readFile(dstPath);

  const aTitle = pickTitle(a);
  const bTitle = pickTitle(b);
  if (aTitle !== bTitle) {
    errors.push(`[${src}] title mismatch: src="${aTitle}" dist="${bTitle}"`);
  }
  const aDesc = pickMeta(a, 'description');
  const bDesc = pickMeta(b, 'description');
  if (aDesc !== bDesc) {
    errors.push(`[${src}] description mismatch`);
  }
  for (const prop of ['og:title', 'og:description', 'og:type', 'og:image', 'og:url']) {
    const av = pickProperty(a, prop);
    const bv = pickProperty(b, prop);
    if (av && bv && av !== bv) {
      errors.push(`[${src}] ${prop} mismatch: src="${av}" dist="${bv}"`);
    } else if (av && !bv) {
      errors.push(`[${src}] ${prop} present in src but missing in dist`);
    }
  }

  if (!b.includes(GTM_ID)) errors.push(`[${dist}] GTM ID ${GTM_ID} missing`);
  if (!/<noscript>[\s\S]*?googletagmanager\.com\/ns\.html\?id=/i.test(b)) {
    errors.push(`[${dist}] GTM noscript iframe missing`);
  }

  const aLd = pickJsonLd(a);
  const bLd = pickJsonLd(b);
  if (aLd.length !== bLd.length) {
    errors.push(`[${src}] JSON-LD count mismatch: src=${aLd.length} dist=${bLd.length}`);
  }

  const aPageCss = (a.match(/href="\/?css\/pages\/([a-z0-9-]+)\.css/i) || [])[1];
  const bPageCss = (b.match(/href="\/?css\/pages\/([a-z0-9-]+)\.css/i) || [])[1];
  if (aPageCss !== bPageCss) {
    errors.push(`[${src}] page CSS mismatch: src=${aPageCss} dist=${bPageCss}`);
  }

  if (!/<a class="skip-link" href="#main-content">/i.test(b)) {
    errors.push(`[${dist}] skip-link missing`);
  }

  const swMatches = b.match(/getRegistrations/g) || [];
  if (swMatches.length > 1) {
    errors.push(`[${dist}] service-worker unregister duplicated (${swMatches.length} occurrences)`);
  }
}

function checkKanji() {
  if (!fs.existsSync(KANJI_DATA_PATH)) return;
  const data = JSON.parse(readFile(KANJI_DATA_PATH));
  for (const kanji of Object.keys(data.kanji || {})) {
    const dst = path.join(DIST, 'kanji', `${kanji}.html`);
    if (!fs.existsSync(dst)) {
      errors.push(`Missing kanji dist: kanji/${kanji}.html`);
      continue;
    }
    const html = readFile(dst);
    if (!html.includes(GTM_ID)) errors.push(`[kanji/${kanji}.html] GTM ID missing`);
    if (!html.includes('"DefinedTerm"')) errors.push(`[kanji/${kanji}.html] JSON-LD DefinedTerm missing`);
    if (!html.includes(`「${kanji}」の意味`)) errors.push(`[kanji/${kanji}.html] kanji body missing`);
  }
}

function checkStaticAssets() {
  const items = ['css', 'js', 'assets', 'data', 'tool', 'manifest.json', 'robots.txt', 'sitemap.xml', 'sw.js'];
  for (const item of items) {
    const p = path.join(DIST, item);
    if (!fs.existsSync(p)) {
      errors.push(`Missing static asset in dist: ${item}`);
    }
  }
}

function main() {
  if (!fs.existsSync(DIST)) {
    console.error('[verify] dist/ not found — did you run npm run build?');
    process.exit(1);
  }
  for (const pair of PAIRS) checkPair(pair);
  checkKanji();
  checkStaticAssets();

  if (errors.length === 0) {
    console.log(`[verify] PASS — ${PAIRS.length} pairs + kanji loop + static assets all match`);
    process.exit(0);
  } else {
    console.error(`[verify] FAIL — ${errors.length} issues:`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
}

main();
