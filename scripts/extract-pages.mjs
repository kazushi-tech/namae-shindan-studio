#!/usr/bin/env node
/**
 * scripts/extract-pages.mjs — 既存 HTML を解析して content/*.json + templates/pages/*.hbs を生成する。
 *
 * 一回限りのマイグレーションスクリプト。実行後はもう使わない (ハンドメンテに移行)。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fse from 'fs-extra';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PAGES_DIR = path.join(ROOT, 'templates', 'pages');
const CONTENT_DIR = path.join(ROOT, 'content');

// マッピング: 入力 HTML → page識別子, content path, output path
const TARGETS = [
  { html: 'index.html',                  page: 'home',              path: '/',                       contentPath: 'home.json',                 templatePath: 'index.hbs' },
  { html: 'shindan.html',                page: 'shindan',           path: '/shindan',                contentPath: 'shindan.json',              templatePath: 'shindan.hbs' },
  { html: 'about.html',                  page: 'about',             path: '/about',                  contentPath: 'about.json',                templatePath: 'about.hbs' },
  { html: 'favorites.html',              page: 'favorites',         path: '/favorites',              contentPath: 'favorites.json',            templatePath: 'favorites.hbs' },
  { html: 'privacy-policy.html',         page: 'privacy-policy',    path: '/privacy-policy',         contentPath: 'privacy-policy.json',       templatePath: 'privacy-policy.hbs' },
  { html: 'suggestion.html',             page: 'suggestion',        path: '/suggestion',             contentPath: 'suggestion.json',           templatePath: 'suggestion.hbs' },
  { html: '404.html',                    page: '404',               path: '/404.html',               contentPath: '404.json',                  templatePath: '404.hbs',          outputPath: '404.html' },
  { html: 'kanji/index.html',            page: 'kanji-index',       path: '/kanji/',                 contentPath: 'kanji/index.json',          templatePath: 'kanji/index.hbs' },
  { html: 'ranking/index.html',          page: 'ranking-index',     path: '/ranking/',               contentPath: 'ranking/index.json',        templatePath: 'ranking/index.hbs' },
  { html: 'ranking/2026-boys.html',      page: 'ranking-boys',      path: '/ranking/2026-boys',      contentPath: 'ranking/2026-boys.json',    templatePath: 'ranking/2026-boys.hbs' },
  { html: 'ranking/2026-girls.html',     page: 'ranking-girls',     path: '/ranking/2026-girls',     contentPath: 'ranking/2026-girls.json',   templatePath: 'ranking/2026-girls.hbs' },
  { html: 'guide/index.html',            page: 'guide-index',       path: '/guide/',                 contentPath: 'guide/index.json',          templatePath: 'guide/index.hbs' },
  { html: 'guide/faq.html',              page: 'guide-faq',         path: '/guide/faq',              contentPath: 'guide/faq.json',            templatePath: 'guide/faq.hbs' },
  { html: 'guide/meimei-hikaku.html',    page: 'guide-meimei-hikaku', path: '/guide/meimei-hikaku',  contentPath: 'guide/meimei-hikaku.json',  templatePath: 'guide/meimei-hikaku.hbs' },
  { html: 'guide/meimei-tools.html',     page: 'guide-meimei-tools', path: '/guide/meimei-tools',    contentPath: 'guide/meimei-tools.json',   templatePath: 'guide/meimei-tools.hbs' },
  { html: 'guide/miyamairi.html',        page: 'guide-miyamairi',   path: '/guide/miyamairi',        contentPath: 'guide/miyamairi.json',      templatePath: 'guide/miyamairi.hbs' },
  { html: 'guide/shussan-list.html',     page: 'guide-shussan',     path: '/guide/shussan-list',     contentPath: 'guide/shussan-list.json',   templatePath: 'guide/shussan-list.hbs' },
];

function readFile(p) { return fs.readFileSync(p, 'utf8'); }

function pickAttr(html, re, group = 1) {
  const m = html.match(re);
  return m ? m[group].trim() : '';
}

function pickMeta(html, name) {
  const re = new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"`, 'i');
  return pickAttr(html, re);
}

function pickProperty(html, prop) {
  const re = new RegExp(`<meta\\s+property="${prop}"\\s+content="([^"]*)"`, 'i');
  return pickAttr(html, re);
}

function pickPageCss(html) {
  const m = html.match(/href="\/?css\/pages\/([a-z0-9-]+)\.css/i);
  return m ? m[1] : null;
}

function pickBodyAttrs(html) {
  const m = html.match(/<body([^>]*)>/i);
  if (!m) return { dataPage: '', bodyClass: '' };
  const attrs = m[1];
  const dp = attrs.match(/data-page="([^"]+)"/);
  const cls = attrs.match(/\sclass="([^"]+)"/);
  return { dataPage: dp ? dp[1] : '', bodyClass: cls ? cls[1] : '' };
}

function pickJsonLd(html) {
  const blocks = [];
  const re = /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      blocks.push(JSON.parse(m[1].trim()));
    } catch (e) {
      // ignore parse errors
    }
  }
  if (blocks.length === 0) return null;
  if (blocks.length === 1) return blocks[0];
  return blocks;
}

function pickMainBody(html) {
  // Pattern A: <main ...> ... </main>
  const mainRe = /<main\b[^>]*>([\s\S]*?)<\/main>/i;
  const m = html.match(mainRe);
  if (m) return m[1].trim();
  // Pattern B: between </nav> and <footer
  const a = html.search(/<\/nav>/i);
  const b = html.search(/<footer\b/i);
  if (a < 0 || b < 0) return '';
  return html.slice(a + 6, b).trim();
}

function pickInlineScriptsAfterMain(html) {
  // Capture inline <script>...</script> blocks that appear AFTER the page JS bundle but BEFORE the SW unregister script
  // Simpler: take everything between </footer> and the SW unregister marker.
  const footerEnd = html.search(/<\/footer>/i);
  if (footerEnd < 0) return '';
  const tail = html.slice(footerEnd + 9); // after </footer>
  // Strip core/page JS <script src=...> tags AND the SW unregister inline script
  const scripts = [];
  const re = /<script(?:\s+([^>]*))?>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(tail)) !== null) {
    const attrs = m[1] || '';
    const body = m[2];
    if (/\bsrc=/.test(attrs)) continue; // skip external
    if (/serviceWorker/.test(body) && /unregister/.test(body)) continue;
    scripts.push(body.trim());
  }
  return scripts.join('\n').trim();
}

function buildContent(target, html) {
  const { dataPage, bodyClass } = pickBodyAttrs(html);
  const pageCss = pickPageCss(html);
  const title = pickAttr(html, /<title>([^<]*)<\/title>/i);
  const description = pickMeta(html, 'description');
  const robots = pickMeta(html, 'robots');
  const og = {
    title:       pickProperty(html, 'og:title') || title,
    description: pickProperty(html, 'og:description') || description,
    type:        pickProperty(html, 'og:type') || 'website',
    image:       pickProperty(html, 'og:image').replace(/^https?:\/\/[^/]+/, ''),
  };
  const jsonLd = pickJsonLd(html);
  const extraInlineScript = pickInlineScriptsAfterMain(html);

  const navActive = (() => {
    if (target.path === '/') return '/';
    if (target.path.endsWith('/')) return target.path;
    return target.path;
  })();

  const obj = {
    page: target.page,
    path: target.path,
    templatePath: target.templatePath,
  };
  if (target.outputPath) obj.outputPath = target.outputPath;
  if (bodyClass) obj.bodyClass = bodyClass;
  obj.navActive = navActive;
  if (pageCss) obj.pageCss = pageCss;
  obj.meta = {
    title,
    description,
    ...(robots ? { robots } : {}),
    og,
  };
  if (jsonLd) obj.jsonLd = jsonLd;
  if (extraInlineScript) obj.extraInlineScript = extraInlineScript;
  if (target.page === '404') obj.skipExtraScripts = true;
  return obj;
}

function buildTemplate(html) {
  return pickMainBody(html);
}

function relAssets(html) {
  // Convert relative `assets/`, `css/`, `js/` references → absolute (`/assets/...`)
  return html
    .replace(/\b(src|href)="(?!\/)(assets|css|js|data|tool|manifest\.json|robots\.txt|sitemap\.xml|sw\.js)/g, '$1="/$2');
}

function writeOnce(p, content) {
  fse.ensureDirSync(path.dirname(p));
  fs.writeFileSync(p, content, 'utf8');
}

function main() {
  for (const t of TARGETS) {
    const src = path.join(ROOT, t.html);
    if (!fs.existsSync(src)) {
      console.warn(`[extract] missing: ${t.html}`);
      continue;
    }
    const raw = readFile(src);
    const content = buildContent(t, raw);
    const body = relAssets(buildTemplate(raw));

    writeOnce(path.join(CONTENT_DIR, t.contentPath), JSON.stringify(content, null, 2) + '\n');
    writeOnce(path.join(PAGES_DIR, t.templatePath), body + '\n');
    console.log(`  extracted: ${t.html} → content/${t.contentPath}, templates/pages/${t.templatePath}`);
  }
}

main();
