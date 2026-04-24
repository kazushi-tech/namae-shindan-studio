/**
 * js/ranking-page.js — /ranking/2026-* ページのレンダラ
 * data/rankings/{year}-{gender}.json を fetch して TOP3 + リストを描画する。
 */
(function () {
  'use strict';

  const FORTUNE_CLASS = {
    '大吉': 'daikichi',
    '吉': 'kichi',
    '半吉': 'hankichi',
    '凶': 'kyo',
    '大凶': 'daikyo'
  };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  function shindanHref(name) {
    // 名前のみ (姓はユーザーが後で入力) — shindan ページに飛ばし、mei だけプリセット
    return `/shindan?mei=${encodeURIComponent(name)}`;
  }

  // お気に入り登録導線: 姓入力後に自動で Favorites.add するよう autofav=1 を付与
  function favHref(name) {
    return `/shindan?mei=${encodeURIComponent(name)}&autofav=1`;
  }

  async function render(jsonUrl) {
    try {
      const res = await fetch(jsonUrl, { cache: 'no-cache' });
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      renderPage(data);
    } catch (e) {
      console.error('[ranking] failed to load', jsonUrl, e);
      const err = document.getElementById('ranking-error');
      if (err) err.hidden = false;
    }
  }

  function renderPage(data) {
    // メタ情報の埋め込み
    const titleEl = document.getElementById('ranking-title');
    if (titleEl) titleEl.textContent = data.title;
    const updatedEl = document.getElementById('ranking-updated');
    if (updatedEl) updatedEl.textContent = `最終更新: ${data.updatedAt}`;

    // TOP3
    const top3El = document.getElementById('ranking-top3');
    if (top3El && data.entries) {
      top3El.innerHTML = '';
      const medals = [
        { key: 'gold',   suffix: '--gold',   order: [0, 1] },
        { key: 'silver', suffix: '--silver', order: [1, 0] },
        { key: 'bronze', suffix: '--bronze', order: [2, 2] }
      ];
      // 配列順: gold(0), silver(1), bronze(2) → DOMは silver, gold, bronze の順で並べる
      // （CSS order でデスクトップ時に 2,1,3 表示、モバイルは 1,2,3 表示）
      const order = ['silver', 'gold', 'bronze'];
      order.forEach((key) => {
        const medalIdx = key === 'gold' ? 0 : key === 'silver' ? 1 : 2;
        const e = data.entries[medalIdx];
        if (!e) return;
        const fortuneCls = FORTUNE_CLASS[e.fortune] || 'kichi';
        const tile = document.createElement('article');
        tile.className = `top3__card top3__card--${key} animate-slide-up`;
        tile.style.animationDelay = `${medalIdx * 0.1}s`;
        tile.innerHTML = `
          <a class="ranking-fav-btn ranking-fav-btn--top3"
             href="${favHref(e.name)}"
             aria-label="「${esc(e.name)}」をお気に入りに追加 (診断後自動保存)"
             title="姓を入力して診断すると、自動でお気に入り登録されます">
            <span aria-hidden="true">☆</span>
          </a>
          <div class="top3__rank-badge top3__rank-badge--${key}">${e.rank}</div>
          <h2 class="top3__name">${esc(e.name)}</h2>
          <p class="top3__reading">${esc(e.reading || '')}</p>
          <div class="top3__meta">
            <span class="top3__meta-item">${e.strokes}画</span>
            <span class="top3__meta-item">${esc(e.fortune)}</span>
          </div>
          <a class="btn btn--${key === 'gold' ? 'primary' : 'outline'} btn--sm" href="${shindanHref(e.name)}">
            ${key === 'gold' ? '詳細診断' : '診断する'}
          </a>
        `;
        top3El.appendChild(tile);
      });
    }

    // 4〜30位リスト
    const listEl = document.getElementById('ranking-list');
    if (listEl && data.entries) {
      listEl.innerHTML = '';
      data.entries.slice(3).forEach((e) => {
        const fortuneCls = FORTUNE_CLASS[e.fortune] || 'kichi';
        const row = document.createElement('a');
        row.className = 'ranking-list__row';
        row.href = shindanHref(e.name);
        row.innerHTML = `
          <span class="ranking-list__rank">${e.rank}</span>
          <div class="ranking-list__name-wrap">
            <span class="ranking-list__name">${esc(e.name)}</span>
            <span class="ranking-list__reading">${esc(e.reading || '')}</span>
            <div class="ranking-list__meta">
              <span class="ranking-list__strokes">${e.strokes}画</span>
              <span class="ranking-list__fortune ranking-list__fortune--${fortuneCls}">${esc(e.fortune)}</span>
            </div>
          </div>
          <button type="button" class="ranking-fav-btn ranking-fav-btn--row"
             data-fav-target="${esc(e.name)}"
             aria-label="「${esc(e.name)}」をお気に入りに追加 (診断後自動保存)"
             title="姓を入力して診断すると、自動でお気に入り登録されます">
            <span aria-hidden="true">☆</span>
          </button>
          <span class="ranking-list__action">診断</span>
        `;
        const favBtn = row.querySelector('.ranking-fav-btn');
        if (favBtn) {
          favBtn.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            location.href = favHref(e.name);
          });
        }
        listEl.appendChild(row);
      });
    }

    // JSON-LD ItemList を注入
    try {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: data.title,
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        numberOfItems: data.entries.length,
        itemListElement: data.entries.map((e) => ({
          '@type': 'ListItem',
          position: e.rank,
          name: e.name
        }))
      });
      document.head.appendChild(script);
    } catch (e) { /* swallow */ }
  }

  window.RankingPage = { render };
})();
