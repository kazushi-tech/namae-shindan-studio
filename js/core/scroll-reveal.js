/* ==========================================================================
   scroll-reveal.js — IntersectionObserver で [data-reveal] 要素の
   エントランスアニメーションを発火する共通スクリプト
   ========================================================================== */
(function () {
  'use strict';

  function init() {
    var els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var target = entry.target;
        var delay = Number(target.dataset.revealDelay) || 0;
        if (delay > 0) {
          target.style.transitionDelay = delay + 'ms';
        }
        target.classList.add('is-visible');
        io.unobserve(target);
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -10% 0px'
    });

    els.forEach(function (el) { io.observe(el); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
