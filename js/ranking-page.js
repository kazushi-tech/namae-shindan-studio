/**
 * js/ranking-page.js — /ranking/2026-* ページのプログレッシブ強化
 *
 * 名前30件・リンク・構造化データはビルド時にHTMLへ出力済み。
 * このスクリプトは任意のクリック計測だけを追加し、未実行でもページ機能を保つ。
 */
(function () {
  'use strict';

  function enhance() {
    const page = document.querySelector('[data-ranking-page]');
    if (!page) return;

    const entries = document.querySelectorAll('[data-ranking-entry]');
    const expectedCount = Number(page.dataset.rankingCount);
    if (Number.isFinite(expectedCount) && entries.length !== expectedCount) {
      console.warn(
        `[ranking] rendered entry count mismatch: expected=${expectedCount}, actual=${entries.length}`
      );
    }

    document.querySelectorAll('[data-ranking-cta]').forEach((link) => {
      if (link.dataset.rankingEnhanced === 'true') return;
      link.dataset.rankingEnhanced = 'true';

      link.addEventListener('click', () => {
        if (!window.Analytics || typeof window.Analytics.ctaClicked !== 'function') return;

        const action = link.dataset.rankingCta || 'unknown';
        const entry = link.closest('[data-ranking-entry]');
        const position = entry ? entry.dataset.rankingPosition : '';
        const gender = page.dataset.rankingGender || '';
        window.Analytics.ctaClicked(`ranking_${action}`, `${gender}:${position}`);
      });
    });
  }

  window.RankingPage = { enhance };
})();
