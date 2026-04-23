#!/usr/bin/env node
/**
 * scripts/build-kanji-pages.mjs
 *
 * data/kanji-meanings.json を読んで kanji/{漢字}.html を生成する。
 * 既存ファイルは上書き。
 *
 * 使い方: node scripts/build-kanji-pages.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/kanji-meanings.json'), 'utf8'));
const OUT_DIR = path.join(ROOT, 'kanji');
const VERSION = '20260424a';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function listItems(arr) {
  return arr.map(x => `<li>${esc(x)}</li>`).join('\n              ');
}

function namesGrid(names, active) {
  if (!names || !names.length) return '<p style="color: var(--color-muted); font-size: var(--text-sm)">該当する人気の名前はありません。</p>';
  return names.map(n => `
        <a class="kanji-name-card" href="/shindan?mei=${encodeURIComponent(n.name)}">
          <span class="kanji-name-card__name">${esc(n.name)}</span>
          <span class="kanji-name-card__reading">${esc(n.reading)}</span>
        </a>`).join('');
}

function chipsHtml(arr) {
  return arr.map(c => `<a class="kanji-chip" href="/kanji/${encodeURIComponent(c)}">${esc(c)}</a>`).join('\n          ');
}

function renderPage(kanji, d) {
  const title = `名前に使う「${kanji}」の意味・読み・画数 | 漢字辞典 — 赤ちゃん名前診断`;
  const description = d.summary;
  const urlPath = `/kanji/${encodeURIComponent(kanji)}`;
  const onyomi = (d.onyomi || []).join('・');
  const kunyomi = (d.kunyomi || []).join('・');
  const nanori = (d.nanori || []).join('・');
  const boys = d.popularNames && d.popularNames.boys ? d.popularNames.boys : [];
  const girls = d.popularNames && d.popularNames.girls ? d.popularNames.girls : [];
  const relatedKanji = d.relatedKanji || [];

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">

  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="ja_JP">
  <meta property="og:image" content="https://namae-studio.com/assets/images/og-image.png">
  <meta property="og:url" content="https://namae-studio.com${urlPath}">
  <link rel="canonical" href="https://namae-studio.com${urlPath}">
  <meta name="twitter:card" content="summary_large_image">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&family=Zen+Maru+Gothic:wght@400;500;700;900&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/css/reset.css?v=${VERSION}">
  <link rel="stylesheet" href="/css/variables.css?v=${VERSION}">
  <link rel="stylesheet" href="/css/base.css?v=${VERSION}">
  <link rel="stylesheet" href="/css/components.css?v=${VERSION}">
  <link rel="stylesheet" href="/css/layout.css?v=${VERSION}">
  <link rel="stylesheet" href="/css/animations.css?v=${VERSION}">
  <link rel="stylesheet" href="/css/pages/kanji.css?v=${VERSION}">

  <link rel="icon" type="image/png" href="/assets/images/favicon.png">
  <link rel="apple-touch-icon" href="/assets/images/logo-icon.png">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#E8725C">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "name": "${kanji}",
    "description": ${JSON.stringify(description)},
    "inDefinedTermSet": {
      "@type": "DefinedTermSet",
      "name": "赤ちゃん名前診断 漢字辞典",
      "url": "https://namae-studio.com/kanji/"
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "ホーム", "item": "https://namae-studio.com/" },
        { "@type": "ListItem", "position": 2, "name": "漢字辞典", "item": "https://namae-studio.com/kanji/" },
        { "@type": "ListItem", "position": 3, "name": "${kanji}" }
      ]
    }
  }
  </script>
</head>
<body data-page="kanji-detail" class="kanji-bg">

  <nav class="nav" role="navigation" aria-label="メインナビゲーション">
    <div class="container nav-container">
      <a href="/" class="nav__brand">
        <img src="/assets/images/logo-icon.png" alt="名前診断ロゴ" class="nav__logo">
        <span class="nav__title">名前診断</span>
      </a>
      <button class="nav__toggle" aria-label="メニュー" aria-expanded="false"><span></span><span></span><span></span></button>
      <ul class="nav__links">
        <li><a href="/" class="nav__link">ホーム</a></li>
        <li><a href="/shindan" class="nav__link">姓名判断</a></li>
        <li><a href="/suggestion" class="nav__link">名前候補</a></li>
        <li><a href="/ranking/" class="nav__link">ランキング</a></li>
        <li><a href="/kanji/" class="nav__link nav__link--active">漢字辞典</a></li>
        <li><a href="/guide/" class="nav__link">ガイド</a></li>
        <li><a href="/about" class="nav__link">五格</a></li>
      </ul>
    </div>
  </nav>

  <main class="section">
    <div class="container">

      <nav class="breadcrumb" aria-label="パンくずリスト">
        <ol class="breadcrumb__list">
          <li class="breadcrumb__item"><a href="/" class="breadcrumb__link">ホーム</a></li>
          <li class="breadcrumb__item"><a href="/kanji/" class="breadcrumb__link">漢字辞典</a></li>
          <li class="breadcrumb__item"><span class="breadcrumb__current">${esc(kanji)}</span></li>
        </ol>
      </nav>

      <img src="/assets/images/kanji-hero.png" alt="" class="kanji-hero__illust" width="600" height="300" loading="eager" decoding="async">

      <section class="kanji-hero">
        <div class="kanji-hero__badge-wrap">
          <div class="kanji-hero__big" aria-hidden="true">${esc(kanji)}</div>
          <span class="kanji-hero__strokes-badge">${d.strokes}画</span>
        </div>
        <div class="kanji-hero__content">
          <h1 class="kanji-hero__title">名前に使う「${esc(kanji)}」の意味・読み・人気の組み合わせ</h1>
          <p class="kanji-hero__summary">${esc(d.summary)}</p>
        </div>
      </section>

      <div class="kanji-layout">
        <div>
          <section class="kanji-section">
            <h2 class="kanji-section__heading">📖 「${esc(kanji)}」の意味</h2>
            <div class="kanji-section__body">
              ${(d.meanings || []).map(m => `<p>${esc(m)}</p>`).join('\n              ')}
            </div>
          </section>

          <section class="kanji-section">
            <h2 class="kanji-section__heading">💖 名前に込められる願い</h2>
            <ul class="kanji-section__list">
              ${listItems(d.wishes || [])}
            </ul>
          </section>

          <section class="kanji-section">
            <h2 class="kanji-section__heading">✨ 画数占いでの評価（${d.strokes}画）</h2>
            <div class="kanji-section__body"><p>${esc(d.fortuneNote)}</p></div>
          </section>

          <section class="kanji-section">
            <h2 class="kanji-section__heading">🌸 人気の名前リスト</h2>
            <div class="kanji-tabs" role="tablist">
              <button class="kanji-tab kanji-tab--active" data-tab="boys" role="tab" aria-selected="true">男の子</button>
              <button class="kanji-tab" data-tab="girls" role="tab" aria-selected="false">女の子</button>
            </div>
            <div class="kanji-names-grid" data-pane="boys">${namesGrid(boys)}</div>
            <div class="kanji-names-grid" data-pane="girls" hidden>${namesGrid(girls)}</div>
          </section>

          <section class="kanji-section">
            <h2 class="kanji-section__heading">🔗 関連する漢字</h2>
            <div class="kanji-chips">
              ${chipsHtml(relatedKanji)}
            </div>
          </section>

          <!-- Mini shindan embed -->
          <div class="shindan-embed">
            <h3 class="shindan-embed__title">「${esc(kanji)}」を使った名前を診断</h3>
            <p class="shindan-embed__sub">お子さまの姓と名を入れて五格の運勢をその場でチェック</p>
            <form class="shindan-embed__form" action="/shindan" method="get">
              <input type="text" class="shindan-embed__input" name="sei" placeholder="姓（例: 山田）" maxlength="10" required>
              <input type="text" class="shindan-embed__input" name="mei" value="${esc(kanji)}" maxlength="10" required>
              <button type="submit" class="btn btn--primary">診断する</button>
            </form>
          </div>
        </div>

        <aside>
          <div class="kanji-meta">
            <h3 class="kanji-meta__heading">${esc(kanji)} の基本情報</h3>
            <div class="kanji-meta__row"><span class="kanji-meta__label">画数</span><span class="kanji-meta__value">${d.strokes}画</span></div>
            <div class="kanji-meta__row"><span class="kanji-meta__label">部首</span><span class="kanji-meta__value">${esc(d.radical || '—')}</span></div>
            <div class="kanji-meta__row"><span class="kanji-meta__label">音読み</span><span class="kanji-meta__value">${esc(onyomi || '—')}</span></div>
            <div class="kanji-meta__row"><span class="kanji-meta__label">訓読み</span><span class="kanji-meta__value">${esc(kunyomi || '—')}</span></div>
            <div class="kanji-meta__row"><span class="kanji-meta__label">名のり</span><span class="kanji-meta__value">${esc(nanori || '—')}</span></div>
          </div>
        </aside>
      </div>
    </div>
  </main>

  <footer class="footer">
    <div class="container footer__inner">
      <div class="footer__brand">
        <span class="footer__brand-name">🌸 赤ちゃん名前診断</span>
        <p class="footer__brand-desc">大切なお子さまに最高の名前を</p>
      </div>
      <nav class="footer__nav" aria-label="フッターナビゲーション">
        <ul class="footer__links">
          <li><a href="/" class="footer__link">ホーム</a></li>
          <li><a href="/shindan" class="footer__link">姓名判断</a></li>
          <li><a href="/suggestion" class="footer__link">名前候補</a></li>
          <li><a href="/ranking/" class="footer__link">ランキング</a></li>
          <li><a href="/kanji/" class="footer__link">漢字辞典</a></li>
          <li><a href="/guide/" class="footer__link">ガイド</a></li>
          <li><a href="/favorites" class="footer__link">お気に入り</a></li>
          <li><a href="/about" class="footer__link">五格について</a></li>
          <li><a href="/privacy-policy" class="footer__link">プライバシーポリシー</a></li>
        </ul>
      </nav>
      <p class="footer__copyright">&copy; 2026 赤ちゃん名前診断</p>
    </div>
  </footer>

  <script src="/js/core/storage.js?v=${VERSION}"></script>
  <script src="/js/core/analytics.js?v=${VERSION}"></script>
  <script src="/js/core/nav.js?v=${VERSION}"></script>
  <script src="/js/core/boot.js?v=${VERSION}"></script>
  <script>
    // タブ切替
    document.querySelectorAll('.kanji-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        document.querySelectorAll('.kanji-tab').forEach(t => {
          const on = t.dataset.tab === target;
          t.classList.toggle('kanji-tab--active', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        document.querySelectorAll('[data-pane]').forEach(p => {
          p.hidden = p.dataset.pane !== target;
        });
      });
    });
  </script>
</body>
</html>
`;
}

let count = 0;
for (const [kanji, d] of Object.entries(DATA.kanji)) {
  const html = renderPage(kanji, d);
  const outPath = path.join(OUT_DIR, `${kanji}.html`);
  fs.writeFileSync(outPath, html, 'utf8');
  count++;
  console.log(`  generated: kanji/${kanji}.html`);
}
console.log(`[build-kanji] generated ${count} pages.`);
