/**
 * js/core/nav.js — モバイルナビゲーションのハンバーガートグル
 *
 * `.nav__toggle` をクリックすると `.nav__links--open` がトグルされる。
 * 既存 components.css の @media (max-width: 768px) 配下のスタイルが効く。
 */
(function () {
  'use strict';

  function closeAll() {
    document.querySelectorAll('.nav__links--open').forEach(links => {
      links.classList.remove('nav__links--open');
    });
    document.querySelectorAll('.nav__toggle[aria-expanded="true"]').forEach(t => {
      t.setAttribute('aria-expanded', 'false');
    });
    document.body.classList.remove('nav-drawer-open');
  }

  function init() {
    const toggles = document.querySelectorAll('.nav__toggle');
    toggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const nav = toggle.closest('.nav');
        if (!nav) return;
        const links = nav.querySelector('.nav__links');
        if (!links) return;
        const open = links.classList.toggle('nav__links--open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        // モバイルでドロワー展開中は本文スクロール抑止＆視覚的重複防止
        document.body.classList.toggle('nav-drawer-open', open);
      });
    });

    // リンククリックで閉じる（ページ内遷移 or 他ページへの遷移のいずれにも対応）
    document.querySelectorAll('.nav__links .nav__link').forEach(link => {
      link.addEventListener('click', () => closeAll());
    });

    // Escape キーで閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAll();
    });

    // 外側クリックで閉じる（ドロワー外のタップ）
    document.addEventListener('click', (e) => {
      const openLinks = document.querySelector('.nav__links--open');
      if (!openLinks) return;
      const nav = openLinks.closest('.nav');
      if (nav && !nav.contains(e.target)) closeAll();
    });
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
