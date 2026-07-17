#!/usr/bin/env node
/**
 * scripts/build.js — Handlebars ビルドパイプライン本実装
 *
 *   入力: site.config.json + DESIGN.md frontmatter + templates/**.hbs + content/**.json + data/kanji-meanings.json
 *   出力: dist/**.html + dist/css|js|assets|data|tool|manifest.json|robots.txt|sitemap.xml|sw.js
 *
 * 設計方針:
 *  - partial は kebab-case ファイル名 → camelCase 名で全自動登録
 *  - content JSON 1 つ = 1 出力ページ。kanji 詳細だけは data/kanji-meanings.json をループで展開
 *  - hbs テンプレートが見つからない場合は content.bodyHtml を直接流し込み (passthrough モード)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import Handlebars from 'handlebars';
import fg from 'fast-glob';
import fse from 'fs-extra';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const PARTIALS_DIR = path.join(TEMPLATES_DIR, 'partials');
const LAYOUTS_DIR = path.join(TEMPLATES_DIR, 'layouts');
const PAGES_DIR = path.join(TEMPLATES_DIR, 'pages');
const CONTENT_DIR = path.join(ROOT, 'content');
const DIST_DIR = path.join(ROOT, 'dist');
const CONFIG_PATH = path.join(ROOT, 'site.config.json');
const DESIGN_PATH = path.join(ROOT, 'DESIGN.md');
const KANJI_DATA_PATH = path.join(ROOT, 'data', 'kanji-meanings.json');
const FORTUNE_CLASS = {
  大吉: 'daikichi',
  吉: 'kichi',
  半吉: 'hankichi',
  凶: 'kyo',
  大凶: 'daikyo',
};

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function getBuildVersion() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
  } catch {
    return new Date().toISOString().slice(0, 10).replace(/-/g, '');
  }
}

function kebabToCamel(name) {
  return name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function registerPartials() {
  const files = fg.sync(['**/*.hbs'], { cwd: PARTIALS_DIR });
  for (const rel of files) {
    const baseName = rel.replace(/\.hbs$/, '');
    const partialName = baseName
      .split('/')
      .map((seg, i) => (i === 0 ? kebabToCamel(seg) : kebabToCamel(seg)))
      .join('/');
    const src = fs.readFileSync(path.join(PARTIALS_DIR, rel), 'utf8');
    Handlebars.registerPartial(partialName, src);
  }
}

function registerHelpers() {
  Handlebars.registerHelper('eq', (a, b) => a === b);
  Handlebars.registerHelper('neq', (a, b) => a !== b);
  Handlebars.registerHelper('isArray', (v) => Array.isArray(v));
  Handlebars.registerHelper('and', function () {
    return Array.prototype.slice.call(arguments, 0, -1).every(Boolean);
  });
  Handlebars.registerHelper('or', function () {
    return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
  });
  Handlebars.registerHelper('not', (v) => !v);
  Handlebars.registerHelper('encodeURI', (v) => encodeURIComponent(String(v ?? '')));
  Handlebars.registerHelper('json', (v) => JSON.stringify(v));

  Handlebars.registerHelper('jsonLd', (obj) => {
    if (!obj) return '';
    const arr = Array.isArray(obj) ? obj : [obj];
    const out = arr
      .map(
        (o) =>
          `<script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n</script>`
      )
      .join('\n');
    return new Handlebars.SafeString(out);
  });

  Handlebars.registerHelper('isActive', function (matchArr, navActive, currentPath) {
    if (!matchArr) return false;
    const arr = Array.isArray(matchArr) ? matchArr : [matchArr];
    if (navActive && arr.some((m) => m === navActive)) return true;
    if (currentPath && arr.some((m) => m === currentPath)) return true;
    if (
      currentPath
      && arr.some((m) => typeof m === 'string' && m !== '/' && m.endsWith('/') && currentPath.startsWith(m))
    ) {
      return true;
    }
    return false;
  });

  Handlebars.registerHelper('inc', (v) => Number(v) + 1);
  Handlebars.registerHelper('safe', (v) => new Handlebars.SafeString(v ?? ''));
}

function loadDesignFrontmatter() {
  if (!fs.existsSync(DESIGN_PATH)) return {};
  const raw = fs.readFileSync(DESIGN_PATH, 'utf8');
  try {
    return matter(raw).data || {};
  } catch (e) {
    console.warn('[build] DESIGN.md frontmatter parse failed:', e.message);
    return {};
  }
}

function loadKanjiWhitelist() {
  if (!fs.existsSync(KANJI_DATA_PATH)) return {};
  const data = readJson(KANJI_DATA_PATH);
  const map = {};
  for (const k of Object.keys(data.kanji || {})) map[k] = 1;
  return map;
}

function buildSiteContext() {
  const config = readJson(CONFIG_PATH);
  const design = loadDesignFrontmatter();
  const kanjiPages = loadKanjiWhitelist();
  return { ...config, design, kanjiPages };
}

function compileLayout() {
  const layoutPath = path.join(LAYOUTS_DIR, 'base.hbs');
  return Handlebars.compile(fs.readFileSync(layoutPath, 'utf8'), { noEscape: false });
}

function findPageTemplate(content) {
  if (content.templatePath) {
    const p = path.join(PAGES_DIR, content.templatePath.replace(/\.hbs$/, '') + '.hbs');
    if (fs.existsSync(p)) return p;
  }
  const tries = [
    `${content.page}.hbs`,
    `${content.page.replace(/-/g, '/')}.hbs`,
    path.basename(content.path || content.page, '.html') + '.hbs',
  ];
  for (const t of tries) {
    const p = path.join(PAGES_DIR, t);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function rankingHref(name, autoFavorite = false) {
  const params = new URLSearchParams({ mei: name });
  if (autoFavorite) params.set('autofav', '1');
  return `/shindan?${params.toString()}`;
}

function enrichRankingContent(content, ctxBase) {
  if (!content.rankingDataPath) return content;

  const dataPath = path.resolve(ROOT, content.rankingDataPath);
  if (dataPath !== ROOT && !dataPath.startsWith(`${ROOT}${path.sep}`)) {
    throw new Error(`rankingDataPath must stay inside project root: ${content.rankingDataPath}`);
  }
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Ranking data not found: ${content.rankingDataPath}`);
  }

  const rankingData = readJson(dataPath);
  if (!Array.isArray(rankingData.entries) || rankingData.entries.length === 0) {
    throw new Error(`Ranking entries are empty: ${content.rankingDataPath}`);
  }

  const medalByRank = { 1: 'gold', 2: 'silver', 3: 'bronze' };
  const entries = rankingData.entries
    .map((entry) => ({
      ...entry,
      fortuneClass: FORTUNE_CLASS[entry.fortune] || 'kichi',
      shindanUrl: rankingHref(entry.name),
      favoriteUrl: rankingHref(entry.name, true),
    }))
    .sort((a, b) => Number(a.rank) - Number(b.rank));
  const top3 = entries.slice(0, 3).map((entry, index) => ({
    ...entry,
    medalClass: medalByRank[entry.rank] || 'bronze',
    buttonClass: entry.rank === 1 ? 'primary' : 'outline',
    buttonLabel: entry.rank === 1 ? '詳細診断' : '診断する',
    animationDelay: `${index * 0.1}s`,
  }));
  const remainingEntries = entries.slice(3);
  const siteUrl = ctxBase.site.domain.url.replace(/\/$/, '');
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: rankingData.title,
    description: rankingData.methodology,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: entries.length,
    itemListElement: entries.map((entry) => ({
      '@type': 'ListItem',
      position: entry.rank,
      name: entry.name,
      url: `${siteUrl}${entry.shindanUrl}`,
    })),
  };
  const jsonLd = content.jsonLd
    ? [...(Array.isArray(content.jsonLd) ? content.jsonLd : [content.jsonLd]), itemList]
    : itemList;

  return {
    ...content,
    jsonLd,
    rankingData: { ...rankingData, entries },
    top3,
    remainingEntries,
  };
}

function renderPage(content, ctxBase, layoutFn) {
  const enrichedContent = enrichRankingContent(content, ctxBase);
  const ctx = { ...ctxBase, ...enrichedContent };
  let body = '';
  const tplPath = findPageTemplate(enrichedContent);
  if (tplPath) {
    const tplSrc = fs.readFileSync(tplPath, 'utf8');
    const tplFn = Handlebars.compile(tplSrc, { noEscape: false });
    body = tplFn(ctx);
  } else if (typeof enrichedContent.bodyHtml === 'string') {
    body = enrichedContent.bodyHtml;
  } else {
    throw new Error(
      `No template or bodyHtml for page: ${enrichedContent.page} (${enrichedContent.path})`
    );
  }
  return layoutFn({ ...ctx, body });
}

function outputPathFor(content) {
  if (content.outputPath) return content.outputPath;
  const p = content.path || '/';
  if (p === '/' || p === '') return 'index.html';
  if (p.endsWith('/')) return path.posix.join(p.replace(/^\//, ''), 'index.html');
  if (p.endsWith('.html')) return p.replace(/^\//, '');
  return p.replace(/^\//, '') + '.html';
}

function writeDist(relPath, html) {
  const out = path.join(DIST_DIR, relPath);
  const normalizedHtml = html.replace(/^[\t ]+$/gm, '');
  fse.ensureDirSync(path.dirname(out));
  fs.writeFileSync(out, normalizedHtml, 'utf8');
}

function buildContentPages(ctxBase, layoutFn) {
  const files = fg.sync(['**/*.json'], { cwd: CONTENT_DIR });
  let count = 0;
  for (const rel of files) {
    if (rel === 'README.md') continue;
    const full = path.join(CONTENT_DIR, rel);
    let content;
    try {
      content = readJson(full);
    } catch (e) {
      console.error(`[build] JSON parse failed: ${rel}: ${e.message}`);
      throw e;
    }
    if (content.page === 'kanji-detail-loop') continue;
    const html = renderPage(content, ctxBase, layoutFn);
    const out = outputPathFor(content);
    writeDist(out, html);
    count++;
    console.log(`  built: ${out}`);
  }
  return count;
}

function buildKanjiDetailPages(ctxBase, layoutFn) {
  if (!fs.existsSync(KANJI_DATA_PATH)) {
    console.warn('[build] data/kanji-meanings.json not found — skip kanji loop');
    return 0;
  }
  const tplPath = path.join(PAGES_DIR, 'kanji', '_detail.hbs');
  if (!fs.existsSync(tplPath)) {
    console.warn('[build] templates/pages/kanji/_detail.hbs not found — skip kanji loop');
    return 0;
  }
  const tplFn = Handlebars.compile(fs.readFileSync(tplPath, 'utf8'), { noEscape: false });
  const data = readJson(KANJI_DATA_PATH);
  let count = 0;
  for (const [kanji, d] of Object.entries(data.kanji || {})) {
    const content = {
      page: 'kanji-detail',
      bodyClass: 'kanji-bg',
      navActive: '/kanji/',
      pageCss: 'kanji',
      path: `/kanji/${encodeURIComponent(kanji)}`,
      meta: {
        title: `名前に使う「${kanji}」の意味・読み・画数 | 漢字辞典 — 赤ちゃん名前診断`,
        description: d.summary,
        og: { type: 'article' },
      },
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'DefinedTerm',
        name: kanji,
        description: d.summary,
        inDefinedTermSet: {
          '@type': 'DefinedTermSet',
          name: '赤ちゃん名前診断 漢字辞典',
          url: 'https://namae-studio.com/kanji',
        },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://namae-studio.com/' },
            { '@type': 'ListItem', position: 2, name: '漢字辞典', item: 'https://namae-studio.com/kanji' },
            { '@type': 'ListItem', position: 3, name: kanji },
          ],
        },
      },
      kanji,
      detail: d,
    };
    const ctx = { ...ctxBase, ...content };
    const body = tplFn(ctx);
    const html = layoutFn({ ...ctx, body });
    writeDist(`kanji/${kanji}.html`, html);
    count++;
    console.log(`  built: kanji/${kanji}.html`);
  }
  return count;
}

function copyStaticAssets() {
  const items = [
    'css',
    'js',
    'assets',
    'data',
    'tool',
    'manifest.json',
    'robots.txt',
    'sitemap.xml',
    'sw.js',
    'site.config.json',
  ];
  for (const item of items) {
    const src = path.join(ROOT, item);
    if (!fs.existsSync(src)) continue;
    const dst = path.join(DIST_DIR, item);
    fse.copySync(src, dst, { dereference: true });
    console.log(`  copied: ${item}`);
  }
}

function main() {
  console.log('[build] start');

  if (!fs.existsSync(CONFIG_PATH)) {
    console.error('[build] site.config.json not found — abort');
    process.exit(1);
  }

  fse.emptyDirSync(DIST_DIR);

  registerHelpers();
  registerPartials();

  const site = buildSiteContext();
  const buildVersion = getBuildVersion();
  const ctxBase = { site, buildVersion };

  const layoutFn = compileLayout();

  const a = buildContentPages(ctxBase, layoutFn);
  const b = buildKanjiDetailPages(ctxBase, layoutFn);

  copyStaticAssets();

  console.log(`[build] done: ${a} content pages + ${b} kanji pages → dist/`);
  console.log(`[build] buildVersion=${buildVersion}`);
}

main();
