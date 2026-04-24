/* ==========================================================================
   scroll-reveal.js — IntersectionObserver で [data-reveal] 要素の
   エントランスアニメーションを発火する共通スクリプト
   ========================================================================== */
(function () {
  'use strict';

  var io = null;
  var reduced = false;

  function ensureObserver() {
    if (io) return io;
    reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) return null;
    io = new IntersectionObserver(function (entries) {
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
    return io;
  }

  function observeNodes(nodes) {
    if (!nodes) return;
    var list = nodes.length !== undefined ? nodes : [nodes];
    var observer = ensureObserver();
    if (reduced || !observer) {
      Array.prototype.forEach.call(list, function (el) {
        if (el && el.classList) el.classList.add('is-visible');
      });
      return;
    }
    Array.prototype.forEach.call(list, function (el) {
      if (el && !el.classList.contains('is-visible')) observer.observe(el);
    });
  }

  function init() {
    var els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;
    observeNodes(els);
  }

  window.ScrollReveal = {
    observe: observeNodes
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
