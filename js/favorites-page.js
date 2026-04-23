/**
 * js/favorites-page.js — /favorites ページのレンダリング
 *
 * Favorites.list() の結果をカード形式で表示。
 * 各カードには「もう一度診断する」ボタン（permalinkParams でshindanページへ）と削除ボタン。
 */
(function () {
  'use strict';

  function render() {
    const grid = document.getElementById('favorites-grid');
    const empty = document.getElementById('favorites-empty');
    if (!grid || !empty) return;

    const items = (typeof Favorites !== 'undefined') ? Favorites.list() : [];
    grid.innerHTML = '';

    if (items.length === 0) {
      empty.hidden = false;
      grid.hidden = true;
      return;
    }
    empty.hidden = true;
    grid.hidden = false;

    items.forEach(record => {
      const card = document.createElement('article');
      card.className = 'favorite-item animate-fade-in';
      card.dataset.favoriteId = record.id;

      const result = record.result || {};
      const ratingClass = _ratingToClass(result.rating);
      const sei = (result.permalinkParams && result.permalinkParams.sei) || '';
      const mei = (result.permalinkParams && result.permalinkParams.mei) || '';
      const savedDate = new Date(record.savedAt).toLocaleDateString('ja-JP');
      const shindanUrl = `/shindan?sei=${encodeURIComponent(sei)}&mei=${encodeURIComponent(mei)}`;

      card.innerHTML = `
        <button class="favorite-item__remove" aria-label="削除" title="削除">✕</button>
        <div class="favorite-item__title">${_esc(result.title || `${sei} ${mei}`)}</div>
        ${result.rating ? `<span class="badge badge--${ratingClass} favorite-item__rating">${_esc(result.rating)}</span>` : ''}
        <p class="favorite-item__summary">${_esc(result.summary || '')}</p>
        <div class="favorite-item__meta">保存日: ${savedDate}</div>
        <div class="favorite-item__actions">
          <a href="${shindanUrl}" class="btn btn--outline btn--sm">もう一度見る</a>
        </div>
      `;

      card.querySelector('.favorite-item__remove').addEventListener('click', () => {
        if (confirm(`「${sei} ${mei}」をお気に入りから削除しますか？`)) {
          if (typeof Favorites !== 'undefined') Favorites.remove(record.id);
          render();
        }
      });

      grid.appendChild(card);
    });
  }

  function _ratingToClass(rating) {
    switch (rating) {
      case '大吉': return 'daikichi';
      case '吉': return 'kichi';
      case '半吉': return 'hankichi';
      case '凶': return 'kyo';
      case '大凶': return 'daikyo';
      default: return 'kichi';
    }
  }

  function _esc(s) {
    return String(s || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  if (document.readyState !== 'loading') render();
  else document.addEventListener('DOMContentLoaded', render);
})();
