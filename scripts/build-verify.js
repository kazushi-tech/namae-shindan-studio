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

  checkInlineScriptPreservation(a, b, src);
  checkExternalScripts(a, b, src);
  checkCssLinks(a, b, src);
  checkMainClass(a, b, src);
}

function checkExternalScripts(srcHtml, distHtml, fileName) {
  // <script src="..."> を抽出（クエリ文字列 ?v=... は無視して比較）
  const re = /<script[^>]*\bsrc="([^"]+)"/gi;
  const stripQuery = (s) => s.split('?')[0];
  const srcSet = [...srcHtml.matchAll(re)].map((m) => stripQuery(m[1]));
  const distSet = new Set([...distHtml.matchAll(re)].map((m) => stripQuery(m[1])));
  for (const s of srcSet) {
    // ローカル JS（/js/...）のみ検証対象。外部 CDN / GTM 等はスキップ
    if (!s.startsWith('/js/')) continue;
    if (!distSet.has(s)) {
      errors.push(`[${fileName}] external <script src="${s}"> present in src but missing in dist`);
    }
  }
}

function checkInlineScriptPreservation(srcHtml, distHtml, fileName) {
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  const srcInlines = [...srcHtml.matchAll(re)].map(m => m[1].trim()).filter(Boolean);
  const distInlines = [...distHtml.matchAll(re)].map(m => m[1].trim()).filter(Boolean);

  // 自動生成系・トラッキング系はスキップ
  const skipPatterns = [
    /gtm\.start/,           // GTM
    /googletagmanager/,     // GTM
    /adsbygoogle/,          // AdSense
    /\(adsbygoogle\s*=/,    // AdSense init
    /fbq\(/,                // Facebook Pixel
    /gtag\(/,               // GA4 direct (head-meta partial が出力)
    /window\.dataLayer\s*=/,// dataLayer init
  ];

  for (const src of srcInlines) {
    if (skipPatterns.some(p => p.test(src))) continue;
    // 主要識別子（変数名・関数名）を抽出
    const ident =
      src.match(/(?:window\.)?(__[A-Z_][A-Z0-9_]*__)/)?.[1] ??
      src.match(/(?:window\.)?([A-Za-z_]\w+)\s*=/)?.[1] ??
      src.match(/function\s+([A-Za-z_]\w+)/)?.[1];
    if (!ident) continue;
    const found = distInlines.some(d => d.includes(ident));
    if (!found) {
      errors.push(`[${fileName}] inline script with identifier "${ident}" lost in dist`);
    }
  }
}

function checkCssLinks(srcHtml, distHtml, fileName) {
  const srcCss = [...srcHtml.matchAll(/href="\/?css\/([^"?]+)/gi)].map(m => m[1]);
  const distCss = [...distHtml.matchAll(/href="\/?css\/([^"?]+)/gi)].map(m => m[1]);
  const missing = srcCss.filter(c => !distCss.includes(c));
  if (missing.length) {
    errors.push(`[${fileName}] CSS missing in dist: ${missing.join(', ')}`);
  }
}

function checkMainClass(srcHtml, distHtml, fileName) {
  const sm = srcHtml.match(/<main[^>]*\bclass="([^"]+)"/i);
  const dm = distHtml.match(/<main[^>]*\bclass="([^"]+)"/i);
  if (sm && (!dm || sm[1] !== dm[1])) {
    errors.push(`[${fileName}] main class mismatch: src="${sm[1]}" dist="${dm?.[1] ?? '(none)'}"`);
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
  const items = ['css', 'js', 'assets', 'data', 'tool', 'manifest.json', 'robots.txt', 'sitemap.xml', 'sw.js', 'site.config.json'];
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
