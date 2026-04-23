/**
 * js/core/router.js — data-page 属性でページ別初期化を振り分ける
 *
 * 使用例:
 *   Router.register('home', initHome);
 *   Router.register('shindan', initShindan);
 *   document.addEventListener('DOMContentLoaded', () => Router.boot());
 *
 * body[data-page="home"] だとhome ハンドラを呼ぶ。
 */
const Router = (() => {
  'use strict';

  const handlers = new Map();

  function register(pageName, handler) {
    if (typeof pageName !== 'string' || typeof handler !== 'function') return;
    handlers.set(pageName, handler);
  }

  function getCurrentPage() {
    return document.body ? (document.body.dataset.page || '') : '';
  }

  async function boot() {
    const page = getCurrentPage();
    const handler = handlers.get(page);
    if (handler) {
      try {
        await handler();
      } catch (e) {
        console.error(`[Router] ${page} init failed:`, e);
      }
    }
    // 共通: ナビゲーションのアクティブ状態
    _updateActiveNav();
  }

  function _updateActiveNav() {
    const currentPath = window.location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/');
    document.querySelectorAll('.nav__link').forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      if (href === '/' || href === '/index' || href === 'index.html') {
        if (currentPath === '/' || currentPath === '') link.classList.add('nav__link--active');
      } else {
        const normalizedHref = href.replace(/\.html$/, '');
        if (currentPath === normalizedHref || currentPath.startsWith(normalizedHref + '/')) {
          link.classList.add('nav__link--active');
        }
      }
    });
  }

  return { register, boot, getCurrentPage };
})();

if (typeof window !== 'undefined') {
  window.Router = Router;
}
