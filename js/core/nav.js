/**
 * js/core/nav.js — モバイルナビゲーションのハンバーガートグル
 *
 * `.nav__toggle` をクリックすると `.nav__links--open` がトグルされる。
 * 既存 components.css の @media (max-width: 768px) 配下のスタイルが効く。
 */
(function () {
  'use strict';

  function init() {
    const toggles = document.querySelectorAll('.nav__toggle');
    toggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        const nav = toggle.closest('.nav');
        if (!nav) return;
        const links = nav.querySelector('.nav__links');
        if (!links) return;
        const open = links.classList.toggle('nav__links--open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
    // リンククリックで閉じる
    document.querySelectorAll('.nav__links .nav__link').forEach(link => {
      link.addEventListener('click', () => {
        const links = link.closest('.nav__links');
        if (links) links.classList.remove('nav__links--open');
      });
    });
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
