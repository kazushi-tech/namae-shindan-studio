/**
 * js/suggestion-page.js — /suggestion ページの Tier A フィルタエンジン
 *
 * - data/popular-names.json を読み込んで各条件で絞り込む
 * - 結果カードに 姓名判断リンクを生成
 * - URLパラメータから初期条件を復元
 */
(function () {
  'use strict';

  const HEAD_GROUPS = {
    'a': ['あ','い','う','え','お','ア','イ','ウ','エ','オ'],
    'ka': ['か','き','く','け','こ','カ','キ','ク','ケ','コ','が','ぎ','ぐ','げ','ご','ガ','ギ','グ','ゲ','ゴ'],
    'sa': ['さ','し','す','せ','そ','サ','シ','ス','セ','ソ','ざ','じ','ず','ぜ','ぞ'],
    'ta': ['た','ち','つ','て','と','タ','チ','ツ','テ','ト','だ','ぢ','づ','で','ど'],
    'na': ['な','に','ぬ','ね','の','ナ','ニ','ヌ','ネ','ノ'],
    'ha': ['は','ひ','ふ','へ','ほ','ハ','ヒ','フ','ヘ','ホ','ば','び','ぶ','べ','ぼ','ぱ','ぴ','ぷ','ぺ','ぽ'],
    'ma': ['ま','み','む','め','も','マ','ミ','ム','メ','モ'],
    'ya': ['や','ゆ','よ','ヤ','ユ','ヨ'],
    'ra': ['ら','り','る','れ','ろ','ラ','リ','ル','レ','ロ'],
    'wa': ['わ','を','ん','ワ','ヲ','ン']
  };

  let DATA = null;

  async function loadData() {
    if (DATA) return DATA;
    const res = await fetch('/data/popular-names.json', { cache: 'no-cache' });
    DATA = await res.json();
    return DATA;
  }

  function getSoukakuFortune(strokes) {
    if (!window.FortuneData || !window.FortuneData.getFortune) return null;
    return window.FortuneData.getFortune(normalizeStrokes(strokes));
  }
  function normalizeStrokes(s) {
    if (!s || s <= 0) return 1;
    if (s > 81) return ((s - 1) % 80) + 1;
    return s;
  }

  function ratingToClass(rating) {
    switch (rating) {
      case '大吉': return 'daikichi';
      case '吉':   return 'kichi';
      case '半吉': return 'hankichi';
      case '凶':   return 'kyo';
      case '大凶': return 'daikyo';
      default:     return 'kichi';
    }
  }

  function filterNames(entries, filters) {
    return entries.filter(n => {
      if (filters.gender && filters.gender !== 'any' && n.gender !== filters.gender) return false;
      if (filters.chars && filters.chars.length > 0) {
        const charCount = [...n.name].length;
        if (!filters.chars.includes(String(charCount))) return false;
      }
      if (filters.includeKanji && filters.includeKanji.trim()) {
        const targets = [...filters.includeKanji.trim()];
        const nameChars = [...n.name];
        if (!targets.every(t => nameChars.includes(t))) return false;
      }
      if (filters.headGroup) {
        const allowed = HEAD_GROUPS[filters.headGroup] || [];
        if (!allowed.includes(n.reading[0])) return false;
      }
      if (filters.fortune && filters.fortune !== 'any') {
        const f = getSoukakuFortune(n.strokes);
        // 画数が取れない／strokes=0 等は通過（件数確保）
        if (f) {
          if (filters.fortune === 'daikichi' && f.rating !== '大吉') return false;
          if (filters.fortune === 'kichi' && !['大吉', '吉'].includes(f.rating)) return false;
        }
      }
      if (filters.targetSoukaku && Number(n.strokes) !== Number(filters.targetSoukaku)) {
        return false;
      }
      return true;
    });
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  // 0 件時、どの条件を緩めると何件になるかを提示
  const RELAX_LABELS = {
    headGroup: '頭文字',
    chars: '文字数',
    fortune: '運勢',
    includeKanji: '含める漢字'
  };

  function renderFallbackSuggestions(host, filters, allEntries) {
    if (!host || !Array.isArray(allEntries)) return;
    // 既存ノード差し替え
    host.innerHTML = `
      <div class="suggestion-empty__icon" aria-hidden="true">🌱</div>
      <p class="suggestion-empty__lead">条件に合う名前が見つかりませんでした。</p>
      <p class="suggestion-empty__sub">以下の条件を緩めてみるとどうじゃ？</p>
      <ul class="suggestion-empty__relax-list" role="list"></ul>
    `;
    const list = host.querySelector('.suggestion-empty__relax-list');
    if (!list) return;

    const relaxKeys = ['headGroup', 'chars', 'fortune', 'includeKanji'];
    const suggestions = [];
    relaxKeys.forEach(key => {
      const value = filters[key];
      const isActive =
        (key === 'chars' && Array.isArray(value) && value.length > 0) ||
        (key === 'fortune' && value && value !== 'any') ||
        (key === 'headGroup' && value) ||
        (key === 'includeKanji' && value && String(value).trim());
      if (!isActive) return;
      const relaxed = { ...filters };
      if (key === 'chars') relaxed.chars = [];
      else if (key === 'fortune') relaxed.fortune = 'any';
      else relaxed[key] = '';
      const count = filterNames(allEntries, relaxed).length;
      suggestions.push({ key, count });
    });

    if (suggestions.length === 0) {
      const li = document.createElement('li');
      li.className = 'suggestion-empty__relax-item';
      li.textContent = '「姓」以外の条件が設定されていません。';
      list.appendChild(li);
      return;
    }

    suggestions.forEach(s => {
      const li = document.createElement('li');
      li.className = 'suggestion-empty__relax-item';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn--outline btn--sm';
      btn.dataset.relaxKey = s.key;
      btn.textContent = `${RELAX_LABELS[s.key] || s.key} をはずす（${s.count}件）`;
      btn.addEventListener('click', () => applyRelax(s.key));
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  function applyRelax(key) {
    const form = document.getElementById('suggestion-form');
    if (!form) return;
    if (key === 'chars') {
      form.querySelectorAll('input[name="chars"]:checked').forEach(el => { el.checked = false; });
    } else if (key === 'fortune') {
      const any = form.querySelector('input[name="fortune"][value="any"]');
      if (any) any.checked = true;
    } else if (key === 'headGroup') {
      form.querySelectorAll('input[name="headGroup"]:checked').forEach(el => { el.checked = false; });
    } else if (key === 'includeKanji' && form.elements['includeKanji']) {
      form.elements['includeKanji'].value = '';
    }
    form.dispatchEvent(new Event('submit', { cancelable: true }));
  }

  function renderResults(results, seiInput, filters, allEntries) {
    const host = document.getElementById('suggestion-results-grid');
    const count = document.getElementById('suggestion-result-count');
    const empty = document.getElementById('suggestion-empty');
    if (!host) return;
    host.innerHTML = '';

    if (count) count.textContent = `${results.length} 件の候補が見つかりました`;

    if (results.length === 0) {
      if (empty) {
        empty.hidden = false;
        renderFallbackSuggestions(empty, filters, allEntries);
      }
      if (count) count.hidden = true;
      return;
    }
    if (empty) empty.hidden = true;
    if (count) count.hidden = false;

    results.slice(0, 60).forEach((n, i) => {
      const f = getSoukakuFortune(n.strokes);
      const ratingCls = f ? ratingToClass(f.rating) : 'kichi';
      const shindanHref = seiInput
        ? `/shindan?sei=${encodeURIComponent(seiInput)}&mei=${encodeURIComponent(n.name)}`
        : `/shindan?mei=${encodeURIComponent(n.name)}`;
      const card = document.createElement('article');
      card.className = 'suggestion-card animate-slide-up';
      card.style.animationDelay = `${Math.min(i, 6) * 0.05}s`;
      card.dataset.meiName = n.name;
      const favId = _computeFavoriteId(seiInput, n.name);
      const isSaved = favId && typeof Favorites !== 'undefined' && Favorites.has(favId);
      card.innerHTML = `
        <button type="button"
          class="suggestion-card__fav${isSaved ? ' suggestion-card__fav--active' : ''}"
          aria-label="${isSaved ? 'お気に入りから削除' : 'お気に入りに追加'}"
          aria-pressed="${isSaved ? 'true' : 'false'}">
          <span class="suggestion-card__fav-icon" aria-hidden="true">${isSaved ? '★' : '☆'}</span>
        </button>
        <div class="suggestion-card__reading">${esc(n.reading)}</div>
        <div class="suggestion-card__name">${esc(n.name)}</div>
        ${f ? `<div class="suggestion-card__fortune"><span class="badge badge--${ratingCls}">${esc(f.rating)}</span></div>` : ''}
        <div class="suggestion-card__strokes">
          <span>合計 ${n.strokes}画</span>
          <span>${esc(n.gender === 'boys' ? '男の子向け' : n.gender === 'girls' ? '女の子向け' : '兼用')}</span>
        </div>
        <div class="suggestion-card__actions">
          <a class="btn btn--outline btn--sm" href="${shindanHref}">詳しく診断</a>
        </div>
      `;
      const favBtn = card.querySelector('.suggestion-card__fav');
      if (favBtn) {
        favBtn.addEventListener('click', (ev) => {
          ev.preventDefault();
          onFavoriteToggle(n.name);
        });
      }
      host.appendChild(card);
    });
  }

  // 現在の姓入力値を取得（未入力なら空）
  function _currentSei() {
    const form = document.getElementById('suggestion-form');
    if (!form || !form.elements['sei']) return '';
    return form.elements['sei'].value.trim();
  }

  function _computeFavoriteId(sei, mei) {
    if (!sei || !mei || typeof Favorites === 'undefined') return '';
    try {
      return Favorites.idFor({ permalinkParams: { sei, mei } });
    } catch (e) { return ''; }
  }

  // ⭐ クリック: 姓未入力なら誘導、入力済みならその場で計算→保存
  async function onFavoriteToggle(meiName) {
    const sei = _currentSei();
    if (!sei) {
      const seiField = document.getElementById('sei-input');
      if (seiField) {
        seiField.focus();
        seiField.placeholder = '先に姓を入力してください';
      }
      const live = document.getElementById('ns-live-alert');
      if (live) live.textContent = 'お気に入り登録には姓の入力が必要です。';
      return;
    }
    if (typeof Favorites === 'undefined' || typeof SeimeiHandan === 'undefined'
      || typeof KanjiStrokes === 'undefined') {
      console.warn('依存モジュール未ロード');
      return;
    }
    // KanjiStrokes が未ロードなら待つ
    if (!KanjiStrokes.isLoaded()) {
      try { await KanjiStrokes.load(); } catch (e) { /* noop */ }
    }
    const seiData = KanjiStrokes.getStrokesArray(sei);
    const meiData = KanjiStrokes.getStrokesArray(meiName);
    if (seiData.unknownChars.length > 0 || meiData.unknownChars.length > 0) {
      const live = document.getElementById('ns-live-alert');
      if (live) live.textContent = '画数の取得に失敗しました。姓の文字を見直してください。';
      return;
    }
    const gokaku = SeimeiHandan.calculate(seiData.strokes, meiData.strokes);
    const result = SeimeiHandan.toResultV1(sei, meiName, gokaku);
    if (!result) return;
    const id = Favorites.idFor(result);
    if (Favorites.has(id)) {
      Favorites.remove(id);
    } else {
      Favorites.add(result);
    }
    // このカードのボタン表示を更新
    const host = document.getElementById('suggestion-results-grid');
    if (host) {
      host.querySelectorAll(`.suggestion-card[data-mei-name="${CSS.escape(meiName)}"]`).forEach(card => {
        const btn = card.querySelector('.suggestion-card__fav');
        const icon = card.querySelector('.suggestion-card__fav-icon');
        if (!btn) return;
        const nowSaved = Favorites.has(id);
        btn.classList.toggle('suggestion-card__fav--active', nowSaved);
        btn.setAttribute('aria-pressed', nowSaved ? 'true' : 'false');
        btn.setAttribute('aria-label', nowSaved ? 'お気に入りから削除' : 'お気に入りに追加');
        if (icon) icon.textContent = nowSaved ? '★' : '☆';
      });
    }
    const live = document.getElementById('ns-live');
    if (live) live.textContent = Favorites.has(id) ? `${sei} ${meiName} をお気に入りに登録しました。` : `${sei} ${meiName} をお気に入りから削除しました。`;
  }

  function getFormFilters(form) {
    const fd = new FormData(form);
    const chars = fd.getAll('chars').map(String);
    return {
      gender: fd.get('gender') || 'any',
      chars,
      headGroup: fd.get('headGroup') || '',
      fortune: fd.get('fortune') || 'any',
      includeKanji: fd.get('includeKanji') || '',
      // URL 経由でのみ設定される（UI 上の入力欄は無い）— /suggestion?soukaku=N
      targetSoukaku: form.dataset.targetSoukaku || ''
    };
  }

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const seiInput = form.elements['sei'] ? form.elements['sei'].value.trim() : '';
    const filters = getFormFilters(form);
    const data = await loadData();
    const results = filterNames(data.names, filters);
    renderResults(results, seiInput, filters, data.names);
    renderSoukakuBadge(filters.targetSoukaku);
    const resultsSection = document.querySelector('.suggestion-results');
    if (resultsSection) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      resultsSection.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
    // URL に条件を反映
    const params = new URLSearchParams();
    if (seiInput) params.set('sei', seiInput);
    if (filters.gender && filters.gender !== 'any') params.set('gender', filters.gender);
    if (filters.chars.length) params.set('chars', filters.chars.join(','));
    if (filters.headGroup) params.set('head', filters.headGroup);
    if (filters.fortune && filters.fortune !== 'any') params.set('fortune', filters.fortune);
    if (filters.includeKanji) params.set('k', filters.includeKanji);
    if (filters.targetSoukaku) params.set('soukaku', filters.targetSoukaku);
    const qs = params.toString();
    history.replaceState(null, '', qs ? `${location.pathname}?${qs}` : location.pathname);

    // 計測
    if (window.Analytics) window.Analytics.toolCompleted('suggestion', '', { count: results.length });
  }

  // 総画フィルタ（URL 経由）の状態バッジ — 解除ボタン付き
  function renderSoukakuBadge(target) {
    const count = document.getElementById('suggestion-result-count');
    if (!count) return;
    const old = document.getElementById('suggestion-soukaku-badge');
    if (old) old.remove();
    if (!target) return;
    const badge = document.createElement('div');
    badge.id = 'suggestion-soukaku-badge';
    badge.style.cssText = 'margin:var(--space-3) 0;display:flex;align-items:center;gap:var(--space-2);flex-wrap:wrap;font-size:var(--text-sm)';
    badge.innerHTML = `
      <span>🔢 総画 <strong>${esc(String(target))}</strong> 画で絞り込み中</span>
      <button type="button" class="btn btn--ghost btn--sm" id="suggestion-soukaku-clear">解除</button>
    `;
    count.parentNode && count.parentNode.insertBefore(badge, count.nextSibling);
    const clear = badge.querySelector('#suggestion-soukaku-clear');
    if (clear) clear.addEventListener('click', () => {
      const form = document.getElementById('suggestion-form');
      if (!form) return;
      delete form.dataset.targetSoukaku;
      form.dispatchEvent(new Event('submit', { cancelable: true }));
    });
  }

  function initFromUrl(form) {
    const params = new URLSearchParams(location.search);
    if (params.get('sei') && form.elements['sei']) form.elements['sei'].value = params.get('sei');
    const g = params.get('gender');
    if (g && form.querySelector(`input[name="gender"][value="${g}"]`)) {
      form.querySelector(`input[name="gender"][value="${g}"]`).checked = true;
    }
    const chars = (params.get('chars') || '').split(',').filter(Boolean);
    chars.forEach(c => {
      const el = form.querySelector(`input[name="chars"][value="${c}"]`);
      if (el) el.checked = true;
    });
    const head = params.get('head');
    if (head && form.querySelector(`input[name="headGroup"][value="${head}"]`)) {
      form.querySelector(`input[name="headGroup"][value="${head}"]`).checked = true;
    }
    const fort = params.get('fortune');
    if (fort && form.querySelector(`input[name="fortune"][value="${fort}"]`)) {
      form.querySelector(`input[name="fortune"][value="${fort}"]`).checked = true;
    }
    const k = params.get('k');
    if (k && form.elements['includeKanji']) form.elements['includeKanji'].value = k;
    // 総画で絞り込み（/suggestion?soukaku=N 来訪時）
    const sou = params.get('soukaku');
    if (sou) {
      form.dataset.targetSoukaku = sou;
    }
    if (params.toString()) {
      // 条件付きアクセスは自動で結果表示
      form.dispatchEvent(new Event('submit', { cancelable: true }));
    }
  }

  function init() {
    const form = document.getElementById('suggestion-form');
    if (!form) return;
    form.addEventListener('submit', onSubmit);
    initFromUrl(form);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
