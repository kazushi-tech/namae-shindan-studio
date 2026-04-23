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
        if (!f) return false;
        if (filters.fortune === 'daikichi' && f.rating !== '大吉') return false;
        if (filters.fortune === 'kichi' && !['大吉', '吉'].includes(f.rating)) return false;
      }
      return true;
    });
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  function renderResults(results, seiInput) {
    const host = document.getElementById('suggestion-results-grid');
    const count = document.getElementById('suggestion-result-count');
    const empty = document.getElementById('suggestion-empty');
    if (!host) return;
    host.innerHTML = '';

    if (count) count.textContent = `${results.length} 件の候補が見つかりました`;

    if (results.length === 0) {
      if (empty) empty.hidden = false;
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
      card.innerHTML = `
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
      host.appendChild(card);
    });
  }

  function getFormFilters(form) {
    const fd = new FormData(form);
    const chars = fd.getAll('chars').map(String);
    return {
      gender: fd.get('gender') || 'any',
      chars,
      headGroup: fd.get('headGroup') || '',
      fortune: fd.get('fortune') || 'any',
      includeKanji: fd.get('includeKanji') || ''
    };
  }

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const seiInput = form.elements['sei'] ? form.elements['sei'].value.trim() : '';
    const filters = getFormFilters(form);
    const data = await loadData();
    const results = filterNames(data.names, filters);
    renderResults(results, seiInput);
    // URL に条件を反映
    const params = new URLSearchParams();
    if (seiInput) params.set('sei', seiInput);
    if (filters.gender && filters.gender !== 'any') params.set('gender', filters.gender);
    if (filters.chars.length) params.set('chars', filters.chars.join(','));
    if (filters.headGroup) params.set('head', filters.headGroup);
    if (filters.fortune && filters.fortune !== 'any') params.set('fortune', filters.fortune);
    if (filters.includeKanji) params.set('k', filters.includeKanji);
    const qs = params.toString();
    history.replaceState(null, '', qs ? `${location.pathname}?${qs}` : location.pathname);

    // 計測
    if (window.Analytics) window.Analytics.toolCompleted('suggestion', '', { count: results.length });
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
